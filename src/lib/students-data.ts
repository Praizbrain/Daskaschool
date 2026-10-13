import { supabase } from "@/lib/supabase-client";

export type PaymentStatus = "Paid" | "Part Payment" | "Owing";

export type StudentListItem = {
  id: string;
  name: string;
  admissionNo: string;
  className: string;
  section: string;
  guardian: string;
  guardianPhone: string;
  expected: number;
  paid: number;
  outstanding: number;
  status: PaymentStatus;
};

export type StudentDetail = StudentListItem & {
  gender: string | null;
  dob: string | null;
  address: string | null;
  joined: string | null;
  discount: number;
  fee: number;
};

export type ClassOption = {
  id: string;
  name: string;
  section: string;
  tuitionFee: number;
  booksFee: number;
  otherCharges: number;
};

export type PaymentHistoryItem = {
  id: string;
  items: string;
  method: string;
  amount: number;
  date: string;
  receivedBy: string;
};

function studentStatus(paid: number, expected: number): PaymentStatus {
  if (expected > 0 && paid >= expected) return "Paid";
  if (paid > 0) return "Part Payment";
  return "Owing";
}

export async function fetchClassOptions(): Promise<ClassOption[]> {
  const { data, error } = await supabase
    .from("classes_staff_view")
    .select("id, name, section, tuition_fee, books_fee, other_charges")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    section: c.section,
    tuitionFee: Number(c.tuition_fee),
    booksFee: Number(c.books_fee),
    otherCharges: Number(c.other_charges),
  }));
}

export async function fetchStudents(): Promise<StudentListItem[]> {
  const [studentsRes, classesRes, paymentsRes] = await Promise.all([
    supabase
      .from("students")
      .select("id, full_name, admission_no, class_id, guardian_name, guardian_phone, discount")
      .is("archived_at", null)
      .order("full_name"),
    supabase
      .from("classes_staff_view")
      .select("id, name, section, tuition_fee, books_fee, other_charges"),
    supabase.from("payments").select("student_id, amount"),
  ]);

  if (studentsRes.error) throw studentsRes.error;
  if (classesRes.error) throw classesRes.error;
  if (paymentsRes.error) throw paymentsRes.error;

  const classById = new Map((classesRes.data ?? []).map((c) => [c.id, c]));
  const paidByStudent = new Map<string, number>();
  for (const p of paymentsRes.data ?? []) {
    paidByStudent.set(p.student_id, (paidByStudent.get(p.student_id) ?? 0) + Number(p.amount));
  }

  return (studentsRes.data ?? []).map((s) => {
    const klass = classById.get(s.class_id);
    const tuition = Number(klass?.tuition_fee ?? 0);
    const books = Number(klass?.books_fee ?? 0);
    const other = Number(klass?.other_charges ?? 0);
    const discount = Number(s.discount ?? 0);
    const expected = tuition + books + other - discount;
    const paid = paidByStudent.get(s.id) ?? 0;
    return {
      id: s.id,
      name: s.full_name,
      admissionNo: s.admission_no,
      className: klass?.name ?? "Unassigned",
      section: klass?.section ?? "Unassigned",
      guardian: s.guardian_name ?? "—",
      guardianPhone: s.guardian_phone ?? "—",
      expected,
      paid,
      outstanding: Math.max(expected - paid, 0),
      status: studentStatus(paid, expected),
    };
  });
}

export async function fetchStudent(id: string): Promise<StudentDetail | null> {
  const { data: s, error } = await supabase
    .from("students")
    .select(
      "id, full_name, admission_no, class_id, guardian_name, guardian_phone, gender, dob, address, discount, joined_date",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!s) return null;

  const { data: klass, error: classError } = await supabase
    .from("classes_staff_view")
    .select("id, name, section, tuition_fee, books_fee, other_charges")
    .eq("id", s.class_id)
    .maybeSingle();
  if (classError) throw classError;

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("amount")
    .eq("student_id", id);
  if (paymentsError) throw paymentsError;

  const tuition = Number(klass?.tuition_fee ?? 0);
  const books = Number(klass?.books_fee ?? 0);
  const other = Number(klass?.other_charges ?? 0);
  const discount = Number(s.discount ?? 0);
  const fee = tuition + books + other;
  const expected = fee - discount;
  const paid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    id: s.id,
    name: s.full_name,
    admissionNo: s.admission_no,
    className: klass?.name ?? "Unassigned",
    section: klass?.section ?? "Unassigned",
    guardian: s.guardian_name ?? "—",
    guardianPhone: s.guardian_phone ?? "—",
    gender: s.gender,
    dob: s.dob,
    address: s.address,
    joined: s.joined_date,
    discount,
    fee,
    expected,
    paid,
    outstanding: Math.max(expected - paid, 0),
    status: studentStatus(paid, expected),
  };
}

export async function fetchStudentPayments(studentId: string): Promise<PaymentHistoryItem[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("id, amount, items, method, created_at, received_by")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const receiverIds = Array.from(new Set((data ?? []).map((p) => p.received_by)));
  const namesById = new Map<string, string>();
  if (receiverIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", receiverIds);
    for (const p of profiles ?? []) {
      if (p.full_name) namesById.set(p.id, p.full_name);
    }
  }

  return (data ?? []).map((p) => {
    const items = Array.isArray(p.items)
      ? (p.items as { label: string }[]).map((i) => i.label).join(", ")
      : "";
    return {
      id: p.id,
      items: items || "Payment",
      method: p.method,
      amount: Number(p.amount),
      date: new Date(p.created_at).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      receivedBy: namesById.get(p.received_by) ?? "Staff",
    };
  });
}

export type CreateStudentInput = {
  fullName: string;
  classId: string;
  guardianName: string;
  guardianPhone: string;
  gender: string;
  dob: string;
  address: string;
  discount: number;
};

export async function createStudent(
  input: CreateStudentInput,
): Promise<{ id: string; admissionNo: string }> {
  const { data, error } = await supabase
    .from("students")
    .insert({
      full_name: input.fullName,
      class_id: input.classId,
      guardian_name: input.guardianName || null,
      guardian_phone: input.guardianPhone || null,
      gender: input.gender || null,
      dob: input.dob || null,
      address: input.address || null,
      discount: input.discount,
    })
    .select("id, admission_no")
    .single();
  if (error) throw error;
  return { id: data.id, admissionNo: data.admission_no };
}

export async function studentHasPayments(studentId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

/**
 * Removes a student. If the student has any payment history, this ARCHIVES
 * them instead of hard-deleting — real financial records are never actually
 * erased. Only truly deletes when there is nothing to lose. Returns which one
 * happened so the UI can tell the person what actually took place.
 */
export async function removeStudent(studentId: string): Promise<"deleted" | "archived"> {
  const hasPayments = await studentHasPayments(studentId);

  if (hasPayments) {
    const { error } = await supabase
      .from("students")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", studentId);
    if (error) throw error;
    return "archived";
  }

  const { error } = await supabase.from("students").delete().eq("id", studentId);
  if (error) throw error;
  return "deleted";
}

export type UpdateStudentInput = {
  fullName: string;
  classId: string;
  guardianName: string;
  guardianPhone: string;
  gender: string;
  dob: string;
  address: string;
};

export async function updateStudent(
  id: string,
  input: UpdateStudentInput,
): Promise<void> {
  const { error } = await supabase
    .from("students")
    .update({
      full_name: input.fullName,
      class_id: input.classId,
      guardian_name: input.guardianName || null,
      guardian_phone: input.guardianPhone || null,
      gender: input.gender || null,
      dob: input.dob || null,
      address: input.address || null,
    })
    .eq("id", id);
  if (error) throw error;
}
