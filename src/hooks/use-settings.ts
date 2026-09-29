import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignTeacherToClass,
  createTeacher,
  deleteFeeTemplate,
  deleteTeacher,
  fetchClassTeachers,
  fetchFeeTemplates,
  fetchSchoolSettings,
  fetchStaffAccounts,
  fetchTeachers,
  removeTeacherFromClass,
  updateSchoolSettings,
  updateTeacher,
  upsertFeeTemplate,
  type SchoolSettings,
} from "@/lib/settings-data";

export function useSchoolSettings() {
  return useQuery({ queryKey: ["school-settings"], queryFn: fetchSchoolSettings });
}
export function useUpdateSchoolSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SchoolSettings) => updateSchoolSettings(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school-settings"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
export function useFeeTemplates() {
  return useQuery({ queryKey: ["fee-templates"], queryFn: fetchFeeTemplates });
}
export function useUpsertFeeTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      section,
      label,
      amount,
      allowInstallment,
      id,
    }: {
      section: string;
      label: string;
      amount: number;
      allowInstallment: boolean;
      id?: string;
    }) => upsertFeeTemplate(section, label, amount, allowInstallment, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fee-templates"] }),
  });
}
export function useDeleteFeeTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFeeTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fee-templates"] }),
  });
}
export function useTeachers() {
  return useQuery({ queryKey: ["teachers"], queryFn: fetchTeachers });
}
export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fullName, defaultSalary }: { fullName: string; defaultSalary: number }) =>
      createTeacher(fullName, defaultSalary),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
  });
}
export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      fullName,
      defaultSalary,
    }: {
      id: string;
      fullName: string;
      defaultSalary: number;
    }) => updateTeacher(id, fullName, defaultSalary),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
  });
}
export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTeacher(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
  });
}
export function useClassTeachers() {
  return useQuery({ queryKey: ["class-teachers"], queryFn: fetchClassTeachers });
}
export function useAssignTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      classId,
      teacherId,
      salaryAllocation,
    }: {
      classId: string;
      teacherId: string;
      salaryAllocation: number;
    }) => assignTeacherToClass(classId, teacherId, salaryAllocation),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class-teachers"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}
export function useRemoveTeacherFromClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeTeacherFromClass(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class-teachers"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}
export function useStaffAccounts() {
  return useQuery({ queryKey: ["staff-accounts"], queryFn: fetchStaffAccounts });
}
