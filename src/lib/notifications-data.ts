import { getEffectiveFeeTotal, getEffectiveFeesForClass } from "@/lib/fee-utils";
import { supabase } from "@/lib/supabase-client";

export type PaymentReminder = {
  id: string;
  studentName: string;
  className: string;
  feeLabel: string;
  outstandingAmount: number;
  remindOn: string;
  isOverdue: boolean;
};

export type OutstandingGroup = {
  className: string;
  section: string;
  noPay: number;
  partial: number;
  total: number;
  totalOwed: number;
};

export type RecentPayment = {
  id: string;
  studentName: string;
  className: string;
  amount: number;
  date: string;
  method: string;
};

export type NotificationData = {
  reminders: PaymentReminder[];
  outstanding: OutstandingGroup[];
  recentPayments: RecentPayment[];
  totalRemindersdue: number;
  totalNoPayStudents: number;
  totalOutstandingStudents: number;
  isMonday: boolean;
  isFriday: boolean;
  generatedAt: string;
};

function localDateValue(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function getExpectedAmount(classId: string, section: string) {
  const [baseTotal, effectiveFees, extrasRes] = await Promise.all([
    getEffectiveFeeTotal(classId, section),
    getEffectiveFeesForClass(classId, section),
    supabase.from("class_fee_items").select("label, amount").eq("class_id", classId),
  ]);

  if (extrasRes.error) throw extrasRes.error;

  const templateLabels = new Set(effectiveFees.map((fee) => fee.label.toLowerCase()));
  const extrasTotal = (extrasRes.data ?? []).reduce(
    (sum, item) => (templateLabels.has(item.label.toLowerCase()) ? sum : sum + Number(item.amount)),
    0,
  );

  return baseTotal + extrasTotal;
}

export async function fetchNotificationData(): Promise<NotificationData> {
  const today = new Date();
  const todayValue = localDateValue(today);
  const isMonday = today.getDay() === 1;
  const isFriday = today.getDay() === 5;
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const [remindersRes, studentsRes, classesRes, paymentsRes, recentPaymentsRes] = await Promise.all(
    [
      supabase
        .from("payment_reminders")
        .select(
          "id, fee_label, outstanding_amount, remind_on, students(full_name, classes(name, section))",
        )
        .is("dismissed_at", null)
        .lte("remind_on", todayValue)
        .order("remind_on", { ascending: true }),
      supabase.from("students").select("id, full_name, class_id").is("archived_at", null),
      supabase.from("classes").select("id, name, section"),
      supabase.from("payments").select("student_id, amount"),
      supabase
        .from("payments")
        .select("id, amount, method, created_at, students(full_name, classes(name))")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10),
    ],
  );

  for (const result of [remindersRes, studentsRes, classesRes, paymentsRes, recentPaymentsRes]) {
    if (result.error) throw result.error;
  }

  const reminders = (remindersRes.data ?? []).map((reminder) => {
    const student = Array.isArray(reminder.students) ? reminder.students[0] : reminder.students;
    const klass = student?.classes
      ? Array.isArray(student.classes)
        ? student.classes[0]
        : student.classes
      : null;
    return {
      id: reminder.id,
      studentName: student?.full_name ?? "Unknown student",
      className: klass?.name ?? "Unassigned",
      feeLabel: reminder.fee_label ?? "School fees",
      outstandingAmount: Number(reminder.outstanding_amount ?? 0),
      remindOn: formatDate(reminder.remind_on),
      isOverdue: reminder.remind_on < todayValue,
    };
  });

  const classById = new Map((classesRes.data ?? []).map((klass) => [klass.id, klass]));
  const paidByStudent = new Map<string, number>();
  for (const payment of paymentsRes.data ?? []) {
    paidByStudent.set(
      payment.student_id,
      (paidByStudent.get(payment.student_id) ?? 0) + Number(payment.amount),
    );
  }

  const expectedByClass = new Map<string, number>();
  await Promise.all(
    (classesRes.data ?? []).map(async (klass) => {
      expectedByClass.set(klass.id, await getExpectedAmount(klass.id, klass.section));
    }),
  );

  const outstandingByClass = new Map<string, OutstandingGroup>();
  for (const student of studentsRes.data ?? []) {
    const klass = classById.get(student.class_id);
    const expectedAmount = expectedByClass.get(student.class_id) ?? 0;
    const paidAmount = paidByStudent.get(student.id) ?? 0;
    const outstandingAmount = Math.max(expectedAmount - paidAmount, 0);

    if (!klass || expectedAmount <= 0 || outstandingAmount <= 0) continue;

    const group = outstandingByClass.get(klass.id) ?? {
      className: klass.name,
      section: klass.section,
      noPay: 0,
      partial: 0,
      total: 0,
      totalOwed: 0,
    };
    group.total += 1;
    group.totalOwed += outstandingAmount;
    if (paidAmount === 0) group.noPay += 1;
    else group.partial += 1;
    outstandingByClass.set(klass.id, group);
  }

  const recentPayments = (recentPaymentsRes.data ?? []).map((payment) => {
    const student = Array.isArray(payment.students) ? payment.students[0] : payment.students;
    const klass = student?.classes
      ? Array.isArray(student.classes)
        ? student.classes[0]
        : student.classes
      : null;
    return {
      id: payment.id,
      studentName: student?.full_name ?? "Unknown student",
      className: klass?.name ?? "Unassigned",
      amount: Number(payment.amount),
      date: new Date(payment.created_at).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
      }),
      method: payment.method,
    };
  });

  const outstanding = Array.from(outstandingByClass.values()).sort(
    (a, b) => b.totalOwed - a.totalOwed,
  );
  const totalNoPayStudents = outstanding.reduce((sum, group) => sum + group.noPay, 0);
  const totalOutstandingStudents = outstanding.reduce((sum, group) => sum + group.total, 0);

  return {
    reminders,
    outstanding,
    recentPayments,
    totalRemindersdue: reminders.length,
    totalNoPayStudents,
    totalOutstandingStudents,
    isMonday,
    isFriday,
    generatedAt: today.toISOString(),
  };
}
