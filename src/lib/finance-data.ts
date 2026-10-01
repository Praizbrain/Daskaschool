import { supabase } from "@/lib/supabase-client";
import { fetchClasses } from "@/lib/classes-data";
import { getEffectiveFeesForClass } from "@/lib/fee-utils";
import { fetchClassInventoryItems } from "@/lib/inventory-data";

/**
 * Builds the dynamic item list for the Record Payment form when a student is
 * selected. Merges two sources in order of specificity:
 *
 * 1. Fee templates + class_fee_assignments (resolved via getEffectiveFeesForClass)
 *    — "School Fees", "Exam Fee", "Uniform", etc. set per-section with optional
 *    per-class overrides. "Books" is returned as a zero-amount placeholder until
 *    Phase 8 (Inventory).
 * 2. Class-specific extras (class_fee_items) — custom charges unique to that
 *    class, layered on top.
 *
 * The old classes_staff_view.tuition_fee / books_fee columns are no longer read.
 * The price_list table is retired — nothing here reads from it.
 */
export type PaymentItem = {
  id: string; // stable key for React, not a DB id for custom/merged items
  label: string;
  amount: number;
  source: "template" | "class-override" | "inventory";
  allowInstallment: boolean;
  inventoryItemId?: string;
  isRequired?: boolean;
  isOutOfStock?: boolean;
};

export async function fetchStudentPaymentItems(
  classId: string,
  section: string,
): Promise<PaymentItem[]> {
  const [effectiveFees, overridesRes, inventoryItems] = await Promise.all([
    getEffectiveFeesForClass(classId, section),
    supabase
      .from("class_fee_items")
      .select("id, label, amount, allow_installment")
      .eq("class_id", classId),
    fetchClassInventoryItems(classId),
  ]);

  if (overridesRes.error) throw overridesRes.error;

  const items: PaymentItem[] = [];

  // 1. Fee templates resolved through class_fee_assignments
  for (const fee of effectiveFees) {
    if (!fee.isActive) continue; // Inactive fee for this class — skip

    items.push({
      id: fee.templateId,
      label: fee.label,
      amount: fee.effectiveAmount,
      source: fee.isOverride ? "class-override" : "template",
      allowInstallment: fee.allowInstallment,
    });
  }

  // 2. Class-specific extras (class_fee_items) — layered on top
  const templateLabels = new Set(effectiveFees.map((f) => f.label.toLowerCase()));
  for (const extra of overridesRes.data ?? []) {
    // Skip if same label already covered by a template
    if (templateLabels.has(extra.label.toLowerCase())) continue;
    items.push({
      id: extra.id,
      label: extra.label,
      amount: Number(extra.amount),
      source: "class-override",
      allowInstallment: extra.allow_installment,
    });
  }

  for (const inventory of inventoryItems) {
    items.push({
      id: `inventory-${inventory.id}`,
      label: inventory.name,
      amount: inventory.sellingPrice,
      source: "inventory",
      allowInstallment: false,
      inventoryItemId: inventory.id,
      isRequired: inventory.isRequired,
      isOutOfStock: inventory.isOutOfStock,
    });
  }

  return items;
}

export type LedgerRow = {
  id: string;
  receiptNo: string;
  student: string;
  className: string;
  items: string;
  method: string;
  amount: number;
  date: string;
};

export async function fetchLedger(): Promise<LedgerRow[]> {
  const { data: payments, error } = await supabase
    .from("payments")
    .select("id, receipt_no, student_id, amount, items, method, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const studentIds = Array.from(new Set((payments ?? []).map((p) => p.student_id)));
  const studentsMap = new Map<string, { name: string; classId: string }>();
  if (studentIds.length > 0) {
    const { data: students, error: sErr } = await supabase
      .from("students")
      .select("id, full_name, class_id")
      .in("id", studentIds);
    if (sErr) throw sErr;
    for (const s of students ?? [])
      studentsMap.set(s.id, { name: s.full_name, classId: s.class_id });
  }

  const classIds = Array.from(new Set(Array.from(studentsMap.values()).map((s) => s.classId)));
  const classNameById = new Map<string, string>();
  if (classIds.length > 0) {
    const { data: classes, error: cErr } = await supabase
      .from("classes_staff_view")
      .select("id, name")
      .in("id", classIds);
    if (cErr) throw cErr;
    for (const c of classes ?? []) classNameById.set(c.id, c.name);
  }

  return (payments ?? []).map((p) => {
    const student = studentsMap.get(p.student_id);
    const items = Array.isArray(p.items)
      ? (p.items as { label: string }[]).map((i) => i.label).join(", ")
      : "";
    return {
      id: p.id,
      receiptNo: p.receipt_no,
      student: student?.name ?? "Unknown student",
      className: student ? (classNameById.get(student.classId) ?? "Unassigned") : "—",
      items: items || "Payment",
      method: p.method,
      amount: Number(p.amount),
      date: new Date(p.created_at).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
  });
}

export type FinanceSummary = {
  collectedRevenue: number;
  expectedRevenue: number;
  outstandingRevenue: number;
  totalExpenses: number;
  salariesTotal: number;
  estimatedProfit: number;
  revenueTrend: { month: string; revenue: number; expenses: number }[];
  sectionBreakdown: { name: string; students: number; expected: number; collected: number }[];
};

export async function fetchFinanceSummary(): Promise<FinanceSummary> {
  const [classes, paymentsRes, expensesRes] = await Promise.all([
    fetchClasses(),
    supabase.from("payments").select("amount, created_at"),
    supabase.from("expenses").select("amount, category, created_at"),
  ]);
  if (paymentsRes.error) throw paymentsRes.error;
  if (expensesRes.error) throw expensesRes.error;

  const expectedRevenue = classes.reduce((sum, c) => sum + c.expected, 0);
  const collectedRevenue = classes.reduce((sum, c) => sum + c.collected, 0);
  const totalExpenses = (expensesRes.data ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  const salariesTotal = (expensesRes.data ?? [])
    .filter((e) => e.category === "Salaries")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const sectionsMap = new Map<string, { students: number; expected: number; collected: number }>();
  for (const c of classes) {
    const entry = sectionsMap.get(c.section) ?? { students: 0, expected: 0, collected: 0 };
    entry.students += c.studentCount;
    entry.expected += c.expected;
    entry.collected += c.collected;
    sectionsMap.set(c.section, entry);
  }

  const now = new Date();
  const months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("en-NG", { month: "short" }),
    });
  }
  const revenueByMonth = new Map<string, number>();
  const expensesByMonth = new Map<string, number>();
  for (const p of paymentsRes.data ?? []) {
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number(p.amount));
  }
  for (const e of expensesRes.data ?? []) {
    const d = new Date(e.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    expensesByMonth.set(key, (expensesByMonth.get(key) ?? 0) + Number(e.amount));
  }

  return {
    collectedRevenue,
    expectedRevenue,
    outstandingRevenue: Math.max(expectedRevenue - collectedRevenue, 0),
    totalExpenses,
    salariesTotal,
    estimatedProfit: collectedRevenue - totalExpenses,
    revenueTrend: months.map((m) => ({
      month: m.label,
      revenue: revenueByMonth.get(m.key) ?? 0,
      expenses: expensesByMonth.get(m.key) ?? 0,
    })),
    sectionBreakdown: Array.from(sectionsMap.entries()).map(([name, v]) => ({ name, ...v })),
  };
}

export type ClassProfitRow = { id: string; name: string; profit: number };

export async function fetchProfitByClass(): Promise<ClassProfitRow[]> {
  const [classesRes, studentsRes, paymentsRes, expensesRes] = await Promise.all([
    supabase.from("classes").select("id, name, teacher_salary"),
    supabase.from("students").select("id, class_id").is("archived_at", null),
    supabase.from("payments").select("student_id, amount"),
    supabase.from("expenses").select("class_id, amount").not("class_id", "is", null),
  ]);
  if (classesRes.error) throw classesRes.error;
  if (studentsRes.error) throw studentsRes.error;
  if (paymentsRes.error) throw paymentsRes.error;
  if (expensesRes.error) throw expensesRes.error;

  const paidByStudent = new Map<string, number>();
  for (const p of paymentsRes.data ?? []) {
    paidByStudent.set(p.student_id, (paidByStudent.get(p.student_id) ?? 0) + Number(p.amount));
  }
  const collectedByClass = new Map<string, number>();
  for (const s of studentsRes.data ?? []) {
    collectedByClass.set(
      s.class_id,
      (collectedByClass.get(s.class_id) ?? 0) + (paidByStudent.get(s.id) ?? 0),
    );
  }
  const expensesByClass = new Map<string, number>();
  for (const e of expensesRes.data ?? []) {
    expensesByClass.set(e.class_id, (expensesByClass.get(e.class_id) ?? 0) + Number(e.amount));
  }

  return (classesRes.data ?? []).map((c) => {
    const collected = collectedByClass.get(c.id) ?? 0;
    const expenses = expensesByClass.get(c.id) ?? 0;
    const salary = Number(c.teacher_salary ?? 0);
    return { id: c.id, name: c.name, profit: collected - salary - expenses };
  });
}

export type CreatePaymentInput = {
  studentId: string;
  items: { label: string; amount: number }[];
  method: "Cash" | "Transfer" | "POS";
  note: string;
};

export async function createPayment(
  input: CreatePaymentInput,
  receivedBy: string,
): Promise<{ id: string; receiptNo: string }> {
  const amount = input.items.reduce((sum, i) => sum + i.amount, 0);
  const { data, error } = await supabase
    .from("payments")
    .insert({
      student_id: input.studentId,
      amount,
      items: input.items,
      method: input.method,
      note: input.note || null,
      received_by: receivedBy,
    })
    .select("id, receipt_no")
    .single();
  if (error) throw error;
  return { id: data.id, receiptNo: data.receipt_no };
}
