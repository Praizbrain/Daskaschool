import { supabase } from "@/lib/supabase-client";

export type SchoolSettings = {
  name: string;
  address: string;
  phone: string;
  currentSession: string;
  currentTerm: string;
};

export async function fetchSchoolSettings(): Promise<SchoolSettings> {
  const { data, error } = await supabase
    .from("school_settings")
    .select("name, address, phone, current_session, current_term")
    .single();
  if (error) throw error;
  return {
    name: data.name ?? "",
    address: data.address ?? "",
    phone: data.phone ?? "",
    currentSession: data.current_session ?? "",
    currentTerm: data.current_term ?? "",
  };
}

export async function updateSchoolSettings(input: SchoolSettings): Promise<void> {
  const { error } = await supabase
    .from("school_settings")
    .update({
      name: input.name,
      address: input.address,
      phone: input.phone,
      current_session: input.currentSession,
      current_term: input.currentTerm,
    })
    .eq("id", 1);
  if (error) throw error;
}

export const SECTIONS = ["KG", "Primary", "JSS", "SS"] as const;

export type FeeTemplate = { id: string; section: string; label: string; amount: number };

export async function fetchFeeTemplates(): Promise<FeeTemplate[]> {
  const { data, error } = await supabase
    .from("fee_templates")
    .select("id, section, label, amount")
    .order("section")
    .order("label");
  if (error) throw error;
  return (data ?? []).map((t) => ({
    id: t.id,
    section: t.section,
    label: t.label,
    amount: Number(t.amount),
  }));
}

export async function upsertFeeTemplate(
  section: string,
  label: string,
  amount: number,
  id?: string,
): Promise<void> {
  if (id) {
    const { error } = await supabase.from("fee_templates").update({ amount }).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("fee_templates")
      .upsert({ section, label, amount }, { onConflict: "section,label" });
    if (error) throw error;
  }
}

export async function deleteFeeTemplate(id: string): Promise<void> {
  const { error } = await supabase.from("fee_templates").delete().eq("id", id);
  if (error) throw error;
}

export type Teacher = { id: string; fullName: string; defaultSalary: number };

export async function fetchTeachers(): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from("teachers")
    .select("id, full_name, default_salary")
    .order("full_name");
  if (error) throw error;
  return (data ?? []).map((t) => ({
    id: t.id,
    fullName: t.full_name,
    defaultSalary: Number(t.default_salary),
  }));
}

export async function createTeacher(fullName: string, defaultSalary: number): Promise<void> {
  const { error } = await supabase
    .from("teachers")
    .insert({ full_name: fullName, default_salary: defaultSalary });
  if (error) throw error;
}

export async function updateTeacher(
  id: string,
  fullName: string,
  defaultSalary: number,
): Promise<void> {
  const { error } = await supabase
    .from("teachers")
    .update({ full_name: fullName, default_salary: defaultSalary })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTeacher(id: string): Promise<void> {
  const { error } = await supabase.from("teachers").delete().eq("id", id);
  if (error) throw error;
}

export type ClassTeacherAssignment = {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  salaryAllocation: number;
};

export async function fetchClassTeachers(): Promise<ClassTeacherAssignment[]> {
  const { data, error } = await supabase
    .from("class_teachers")
    .select("id, class_id, teacher_id, salary_allocation");
  if (error) throw error;
  const classIds = Array.from(new Set((data ?? []).map((r) => r.class_id)));
  const teacherIds = Array.from(new Set((data ?? []).map((r) => r.teacher_id)));
  const [classesRes, teachersRes] = await Promise.all([
    classIds.length > 0
      ? supabase.from("classes_staff_view").select("id, name").in("id", classIds)
      : Promise.resolve({ data: [], error: null }),
    teacherIds.length > 0
      ? supabase.from("teachers").select("id, full_name").in("id", teacherIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const classNameById = new Map((classesRes.data ?? []).map((c) => [c.id, c.name]));
  const teacherNameById = new Map((teachersRes.data ?? []).map((t) => [t.id, t.full_name]));
  return (data ?? []).map((r) => ({
    id: r.id,
    classId: r.class_id,
    className: classNameById.get(r.class_id) ?? "Unknown",
    teacherId: r.teacher_id,
    teacherName: teacherNameById.get(r.teacher_id) ?? "Unknown",
    salaryAllocation: Number(r.salary_allocation),
  }));
}

export async function assignTeacherToClass(
  classId: string,
  teacherId: string,
  salaryAllocation: number,
): Promise<void> {
  const { error } = await supabase
    .from("class_teachers")
    .upsert(
      { class_id: classId, teacher_id: teacherId, salary_allocation: salaryAllocation },
      { onConflict: "class_id,teacher_id" },
    );
  if (error) throw error;
}

export async function removeTeacherFromClass(assignmentId: string): Promise<void> {
  const { error } = await supabase.from("class_teachers").delete().eq("id", assignmentId);
  if (error) throw error;
}

export type StaffAccount = {
  id: string;
  fullName: string | null;
  role: string;
  staffId: string | null;
};

export async function fetchStaffAccounts(): Promise<StaffAccount[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, staff_id")
    .order("role");
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    fullName: p.full_name,
    role: p.role,
    staffId: p.staff_id,
  }));
}
