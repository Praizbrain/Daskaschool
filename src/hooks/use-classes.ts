import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CLASSES, getClass, STUDENTS } from "@/lib/school-data";
import { toast } from "sonner";

export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      return CLASSES.map((c) => ({
        ...c,
        collectionPct: c.expected ? Math.round((c.collected / c.expected) * 100) : 0,
      }));
    },
  });
}

export function useClass(id: string, isSuperAdmin: boolean = false) {
  return useQuery({
    queryKey: ["class", id],
    queryFn: async () => {
      const cls = getClass(id);
      if (!cls) return null;
      
      const classStudents = STUDENTS.filter((s) => s.className === cls.name).map((s) => ({
        id: s.id,
        name: s.name,
        guardian: s.guardian,
        outstanding: s.fee - s.discount - s.paid,
        status: s.status,
      }));
      
      return {
        ...cls,
        teacherName: cls.teacher,
        studentCount: cls.students,
        collectionPct: cls.expected ? Math.round((cls.collected / cls.expected) * 100) : 0,
        tuitionFee: 0,
        booksFee: 0,
        otherCharges: 0,
        outstanding: cls.expected - cls.collected,
        classExpenses: cls.expenses,
        estimatedProfit: cls.collected - cls.teacherSalary - cls.expenses,
        students: classStudents,
      };
    },
    enabled: !!id,
  });
}

export function useUpdateClass(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      // Mock update
      return data;
    },
    onSuccess: () => {
      toast.success("Class updated successfully");
      queryClient.invalidateQueries({ queryKey: ["class", classId] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}
