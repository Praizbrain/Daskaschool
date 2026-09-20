import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPayment,
  fetchFinanceSummary,
  fetchLedger,
  fetchProfitByClass,
  type CreatePaymentInput,
} from "@/lib/finance-data";

export function useLedger() {
  return useQuery({ queryKey: ["ledger"], queryFn: fetchLedger });
}

export function useFinanceSummary() {
  return useQuery({ queryKey: ["finance-summary"], queryFn: fetchFinanceSummary });
}

export function useProfitByClass(enabled: boolean) {
  return useQuery({ queryKey: ["profit-by-class"], queryFn: fetchProfitByClass, enabled });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, receivedBy }: { input: CreatePaymentInput; receivedBy: string }) =>
      createPayment(input, receivedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["profit-by-class"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
