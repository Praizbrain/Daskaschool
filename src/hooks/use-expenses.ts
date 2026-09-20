import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createExpense,
  fetchExpenses,
  fetchExpenseSummary,
  type CreateExpenseInput,
} from "@/lib/expenses-data";

export function useExpenses() {
  return useQuery({ queryKey: ["expenses"], queryFn: fetchExpenses });
}

export function useExpenseSummary() {
  return useQuery({ queryKey: ["expense-summary"], queryFn: fetchExpenseSummary });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, addedBy }: { input: CreateExpenseInput; addedBy: string }) =>
      createExpense(input, addedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
