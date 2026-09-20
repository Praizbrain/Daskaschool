import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClass, fetchClasses, updateClass, type UpdateClassInput } from "@/lib/classes-data";

export function useClasses(_?: boolean) {
  return useQuery({ queryKey: ["classes"], queryFn: fetchClasses });
}

export function useClass(classId: string, isSuperAdmin: boolean) {
  return useQuery({
    queryKey: ["class", classId, isSuperAdmin],
    queryFn: () => fetchClass(classId, isSuperAdmin),
    enabled: !!classId,
  });
}

export function useUpdateClass(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateClassInput) => updateClass(classId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["class", classId] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
