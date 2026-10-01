import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignItemToClass,
  createInventoryItem,
  deleteInventoryItem,
  fetchClassInventoryItems,
  fetchInventoryItems,
  fetchInventorySummary,
  fetchInventoryTransactions,
  removeItemFromClass,
  restockItem,
  updateInventoryItem,
  type CreateInventoryItemInput,
} from "@/lib/inventory-data";

export function useInventoryItems() {
  return useQuery({ queryKey: ["inventory-items"], queryFn: fetchInventoryItems });
}

export function useInventorySummary() {
  return useQuery({ queryKey: ["inventory-summary"], queryFn: fetchInventorySummary });
}

export function useClassInventoryItems(classId: string) {
  return useQuery({
    queryKey: ["class-inventory", classId],
    queryFn: () => fetchClassInventoryItems(classId),
    enabled: Boolean(classId),
  });
}

export function useInventoryTransactions(itemId?: string) {
  return useQuery({
    queryKey: ["inventory-transactions", itemId],
    queryFn: () => fetchInventoryTransactions(itemId),
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-summary"] });
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-summary"] });
      queryClient.invalidateQueries({ queryKey: ["class-inventory"] });
    },
  });
}
export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CreateInventoryItemInput> & { isActive?: boolean };
    }) => updateInventoryItem(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-summary"] });
    },
  });
}

export function useRestockItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: string; quantity: number; note: string; addedBy: string }) =>
      restockItem(input.itemId, input.quantity, input.note, input.addedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-summary"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
    },
  });
}

export function useAssignItemToClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { classId: string; itemId: string; isRequired: boolean }) =>
      assignItemToClass(input.classId, input.itemId, input.isRequired),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ["class-inventory", input.classId] });
    },
  });
}

export function useRemoveItemFromClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { assignmentId: string; classId: string }) =>
      removeItemFromClass(input.assignmentId),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ["class-inventory", input.classId] });
    },
  });
}
