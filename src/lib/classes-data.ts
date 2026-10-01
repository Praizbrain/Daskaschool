import { supabase } from "@/lib/supabase-client";
import { getEffectiveFeesForClass, getEffectiveFeeTotal, type EffectiveFee } from "@/lib/fee-utils";
import { fetchRequiredClassInventoryItems } from "@/lib/inventory-data";

export type PaymentStatus = "Paid" | "Part Payment" | "Owing";

export type ClassListItem = {
  id: string;
  name: string;
  section: string;
  teacherName: string | null;
  studentCount: number;
  expected: number;
  collected: number;
  outstanding: number;
  collectionPct: number;
};

export type FeeBreakdownItem = {
  label: string;
  sectionAmount: number;
  effectiveAmount: number;
  isActive: boolean;
};

export type ClassStudentRow = {
  id: string;
  name: string;
  guardian: string;
  outstanding: number;
  status: PaymentStatus;
};

export type ClassDetail = ClassListItem & {
  feeBreakdown: FeeBreakdownItem[];
  teacherSalary: number | null;
  classExpenses: number;
  estimatedProfit: number | null;
  students: ClassStudentRow[];
};

function studentStatus(paid: number, expected: number): PaymentStatus {
  if (expected > 0 && paid >= expected) return "Paid";
  if (paid > 0) return "Part Payment";
  return "Owing";
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export async function fetchClasses(): Promise<ClassListItem[]> {
  const [classesRes, studentsRes, paymentsRes] = await Promise.all([
    supabase.from("classes_staff_view").select("id, name, section, teacher_name").order("name"),
    supabase.from("students").select("id, class_id, discount").is("archived_at", null),
    supabase.from("payments").select("student_id, amount"),
  ]);

  if (classesRes.error) throw classesRes.error;
  if (studentsRes.error) throw studentsRes.error;
  if (paymentsRes.error) throw paymentsRes.error;

  const paidByStudent = new Map<string, number>();
  for (const p of paymentsRes.data ?? []) {
    paidByStudent.set(p.student_id, (paidByStudent.get(p.student_id) ?? 0) + Number(p.amount));
  }

  const studentsByClass = new Map<string, { discount: number; paid: number }[]>();
  for (const s of studentsRes.data ?? []) {
    const list = studentsByClass.get(s.class_id) ?? [];
    list.push({ discount: Number(s.discount ?? 0), paid: paidByStudent.get(s.id) ?? 0 });
    studentsByClass.set(s.class_id, list);
  }

  // Fetch effective fee totals for each unique class
  const classRows = classesRes.data ?? [];
  const grossByClass = new Map<string, number>();
  await Promise.all(
    classRows.map(async (c) => {
      const total = await getEffectiveFeeTotal(c.id, c.section);
      grossByClass.set(c.id, total);
    }),
  );

  return classRows.map((c) => {
    const gross = grossByClass.get(c.id) ?? 0;
    const roster = studentsByClass.get(c.id) ?? [];
    const expected = roster.reduce((sum, s) => sum + Math.max(gross - s.discount, 0), 0);
    const collected = roster.reduce((sum, s) => sum + s.paid, 0);
    return {
      id: c.id,
      name: c.name,
      section: c.section,
      teacherName: c.teacher_name,
      studentCount: roster.length,
      expected,
      collected,
      outstanding: Math.max(expected - collected, 0),
      collectionPct: pct(collected, expected),
    };
  });
}

export async function fetchClass(
  classId: string,
  isSuperAdmin: boolean,
): Promise<ClassDetail | null> {
  const { data: c, error } = await supabase
    .from("classes_staff_view")
    .select("id, name, section, teacher_name")
    .eq("id", classId)
    .maybeSingle();
  if (error) throw error;
  if (!c) return null;

  let teacherSalary: number | null = null;
  if (isSuperAdmin) {
    const { data: fullRow, error: fullError } = await supabase
      .from("classes")
      .select("teacher_salary")
      .eq("id", classId)
      .maybeSingle();
    if (fullError) throw fullError;
    teacherSalary = fullRow ? Number(fullRow.teacher_salary) : null;
  }

  const [effectiveFees, requiredInventoryItems, studentsRes, expensesRes] = await Promise.all([
    getEffectiveFeesForClass(classId, c.section),
    fetchRequiredClassInventoryItems(classId),
    supabase
      .from("students")
      .select("id, full_name, guardian_name, discount")
      .eq("class_id", classId)
      .is("archived_at", null),
    supabase.from("expenses").select("amount").eq("class_id", classId),
  ]);
  if (studentsRes.error) throw studentsRes.error;
  if (expensesRes.error) throw expensesRes.error;

  const feeBreakdown: FeeBreakdownItem[] = [
    ...effectiveFees.map((fee) => ({
      label: fee.label,
      sectionAmount: fee.sectionAmount,
      effectiveAmount: fee.effectiveAmount,
      isActive: fee.isActive,
    })),
    ...requiredInventoryItems.map((item) => ({
      label: `${item.name} (Required inventory)`,
      sectionAmount: item.sellingPrice,
      effectiveAmount: item.sellingPrice,
      isActive: true,
    })),
  ];

  const gross = feeBreakdown
    .filter((item) => item.isActive)
    .reduce((sum, item) => sum + item.effectiveAmount, 0);

  const studentIds = (studentsRes.data ?? []).map((s) => s.id);
  const paidByStudent = new Map<string, number>();
  if (studentIds.length > 0) {
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("student_id, amount")
      .in("student_id", studentIds);
    if (paymentsError) throw paymentsError;
    for (const p of payments ?? []) {
      paidByStudent.set(p.student_id, (paidByStudent.get(p.student_id) ?? 0) + Number(p.amount));
    }
  }

  const students: ClassStudentRow[] = (studentsRes.data ?? []).map((s) => {
    const discount = Number(s.discount ?? 0);
    const expected = Math.max(gross - discount, 0);
    const paid = paidByStudent.get(s.id) ?? 0;
    return {
      id: s.id,
      name: s.full_name,
      guardian: s.guardian_name ?? "—",
      outstanding: Math.max(expected - paid, 0),
      status: studentStatus(paid, expected),
    };
  });

  const expected = (studentsRes.data ?? []).reduce((sum, s) => {
    const discount = Number(s.discount ?? 0);
    return sum + Math.max(gross - discount, 0);
  }, 0);
  const collected = Array.from(paidByStudent.values()).reduce((sum, v) => sum + v, 0);
  const classExpenses = (expensesRes.data ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  const estimatedProfit =
    isSuperAdmin && teacherSalary !== null ? collected - teacherSalary - classExpenses : null;

  return {
    id: c.id,
    name: c.name,
    section: c.section,
    teacherName: c.teacher_name,
    studentCount: students.length,
    expected,
    collected,
    outstanding: Math.max(expected - collected, 0),
    collectionPct: pct(collected, expected),
    feeBreakdown,
    teacherSalary,
    classExpenses,
    estimatedProfit,
    students,
  };
}

export type UpdateClassInput = {
  teacherName: string;
  teacherSalary: number;
};

export async function updateClass(classId: string, input: UpdateClassInput): Promise<void> {
  const { error } = await supabase
    .from("classes")
    .update({
      teacher_name: input.teacherName || null,
      teacher_salary: input.teacherSalary,
    })
    .eq("id", classId);
  if (error) throw error;
}
