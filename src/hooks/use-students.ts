import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStudent,
  fetchClassOptions,
  fetchStudent,
  fetchStudentPayments,
  fetchStudents,
  removeStudent,
  type CreateStudentInput,
} from "@/lib/students-data";

export function useStudents() {
  return useQuery({ queryKey: ["students"], queryFn: fetchStudents });
}

export function useClassOptions() {
  return useQuery({ queryKey: ["class-options"], queryFn: fetchClassOptions });
}

export function useStudent(id: string) {
  return useQuery({ queryKey: ["student", id], queryFn: () => fetchStudent(id), enabled: !!id });
}

export function useStudentPayments(id: string) {
  return useQuery({
    queryKey: ["student-payments", id],
    queryFn: () => fetchStudentPayments(id),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStudentInput) => createStudent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useRemoveStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) => removeStudent(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
