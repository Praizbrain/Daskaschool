import { supabase } from "@/lib/supabase-client";
import { getEffectiveFeeTotal } from "@/lib/fee-utils";

export type DashboardData = {
  school: { name: string; session: string; term: string };
  metrics: {
    expectedRevenue: number;
    collectedRevenue: number;
    outstandingRevenue: number;
    estimatedNetProfit: number;
    todayRevenue: number;
    todayExpenses: number;
    totalExpenses: number;
    studentCount: number;
    avgFee: number;
    discounts: number;
    receiptsToday: number;
    expensesToday: number;
    studentsOwingCount: number;
  };
  sections: { name: string; students: number; expected: number; collected: number }[];
  outstandingStudents: {
    id: string;
    name: string;
    className: string;
    guardian: string;
    outstanding: number;
    status: "Paid" | "Part Payment" | "Owing";
  }[];
  recentPayments: {
    id: string;
    student: string;
    items: string;
    method: string;
    amount: number;
    date: string;
  }[];
  recentExpenses: {
    id: string;
    desc: string;
    category: string;
    paidTo: string;
    amount: number;
    date: string;
  }[];
  revenueTrend: { month: string; revenue: number; expenses: number }[];
};

function isToday(dateString: string): boolean {
  const d = new Date(dateString);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function studentStatus(paid: number, expected: number): "Paid" | "Part Payment" | "Owing" {
  if (paid >= expected) return "Paid";
  if (paid > 0) return "Part Payment";
  return "Owing";
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [schoolRes, classesRes, studentsRes, paymentsRes, expensesRes] = await Promise.all([
    supabase.from("school_settings").select("name, current_session, current_term").single(),
    supabase.from("classes_staff_view").select("id, name, section"),
    // IMPORTANT: only active (non-archived) students count toward expected revenue
    supabase
      .from("students")
      .select("id, full_name, class_id, guardian_name, discount")
      .is("archived_at", null),
    supabase
      .from("payments")
      .select("id, student_id, amount, items, method, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("expenses")
      .select("id, category, amount, description, paid_to, created_at")
      .order("created_at", { ascending: false }),
  ]);

  if (schoolRes.error) throw schoolRes.error;
  if (classesRes.error) throw classesRes.error;
  if (studentsRes.error) throw studentsRes.error;
  if (paymentsRes.error) throw paymentsRes.error;
  if (expensesRes.error) throw expensesRes.error;

  const school = schoolRes.data;
  const classes = classesRes.data ?? [];
  const students = studentsRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const expenses = expensesRes.data ?? [];

  const classById = new Map(classes.map((c) => [c.id, c]));

  // Resolve effective fee totals per class (from fee_templates + class_fee_assignments)
  const grossByClass = new Map<string, number>();
  await Promise.all(
    classes.map(async (c) => {
      const total = await getEffectiveFeeTotal(c.id, c.section);
      grossByClass.set(c.id, total);
    }),
  );

  // Collected revenue includes ALL payments (including from archived students)
  // because the school genuinely received that money — it doesn't disappear
  // just because a student later left. Only EXPECTED revenue excludes archived.
  const paidByStudent = new Map<string, number>();
  for (const p of payments) {
    paidByStudent.set(p.student_id, (paidByStudent.get(p.student_id) ?? 0) + Number(p.amount));
  }

  let expectedRevenue = 0;
  let discounts = 0;
  let grossFeeSum = 0;

  const studentDetails = students.map((s) => {
    const klass = classById.get(s.class_id);
    const gross = grossByClass.get(s.class_id) ?? 0;
    const discount = Number(s.discount ?? 0);
    const expected = Math.max(gross - discount, 0);
    const paid = paidByStudent.get(s.id) ?? 0;
    const outstanding = Math.max(expected - paid, 0);

    expectedRevenue += expected;
    discounts += discount;
    grossFeeSum += gross;

    return {
      id: s.id,
      name: s.full_name as string,
      className: klass?.name ?? "Unassigned",
      section: klass?.section ?? "Unassigned",
      guardian: (s.guardian_name as string) ?? "—",
      expected,
      paid,
      outstanding,
      status: studentStatus(paid, expected),
    };
  });

  // Collected = all payments, including from archived students
  const collectedRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const todayRevenue = payments
    .filter((p) => isToday(p.created_at))
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const todayExpenses = expenses
    .filter((e) => isToday(e.created_at))
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const receiptsToday = payments.filter((p) => isToday(p.created_at)).length;
  const expensesToday = expenses.filter((e) => isToday(e.created_at)).length;

  const sectionsMap = new Map<string, { students: number; expected: number; collected: number }>();
  for (const sd of studentDetails) {
    const entry = sectionsMap.get(sd.section) ?? { students: 0, expected: 0, collected: 0 };
    entry.students += 1;
    entry.expected += sd.expected;
    entry.collected += sd.paid;
    sectionsMap.set(sd.section, entry);
  }
  const sections = Array.from(sectionsMap.entries()).map(([name, v]) => ({ name, ...v }));

  const outstandingStudents = studentDetails
    .filter((sd) => sd.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, 5)
    .map((sd) => ({
      id: sd.id,
      name: sd.name,
      className: sd.className,
      guardian: sd.guardian,
      outstanding: sd.outstanding,
      status: sd.status,
    }));

  const studentNameById = new Map(students.map((s) => [s.id, s.full_name as string]));

  const recentPayments = payments.slice(0, 5).map((p) => {
    const items = Array.isArray(p.items)
      ? (p.items as { label: string }[]).map((i) => i.label).join(", ")
      : "";
    return {
      id: p.id,
      student: studentNameById.get(p.student_id) ?? "Unknown student",
      items: items || "Payment",
      method: p.method,
      amount: Number(p.amount),
      date: new Date(p.created_at).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
      }),
    };
  });

  const recentExpenses = expenses.slice(0, 5).map((e) => ({
    id: e.id,
    desc: (e.description as string) || e.category,
    category: e.category,
    paidTo: (e.paid_to as string) ?? "—",
    amount: Number(e.amount),
    date: new Date(e.created_at).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
    }),
  }));

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
  for (const p of payments) {
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number(p.amount));
  }
  for (const e of expenses) {
    const d = new Date(e.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    expensesByMonth.set(key, (expensesByMonth.get(key) ?? 0) + Number(e.amount));
  }
  const revenueTrend = months.map((m) => ({
    month: m.label,
    revenue: revenueByMonth.get(m.key) ?? 0,
    expenses: expensesByMonth.get(m.key) ?? 0,
  }));

  const studentCount = students.length;
  const avgFee = studentCount > 0 ? Math.round(grossFeeSum / studentCount) : 0;

  return {
    school: {
      name: school?.name ?? "—",
      session: school?.current_session ?? "—",
      term: school?.current_term ?? "—",
    },
    metrics: {
      expectedRevenue,
      collectedRevenue,
      outstandingRevenue: Math.max(expectedRevenue - collectedRevenue, 0),
      estimatedNetProfit: collectedRevenue - totalExpenses,
      todayRevenue,
      todayExpenses,
      totalExpenses,
      studentCount,
      avgFee,
      discounts,
      receiptsToday,
      expensesToday,
      studentsOwingCount: studentDetails.filter((sd) => sd.outstanding > 0).length,
    },
    sections,
    outstandingStudents,
    recentPayments,
    recentExpenses,
    revenueTrend,
  };
}
