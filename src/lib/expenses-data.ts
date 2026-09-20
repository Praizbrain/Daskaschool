import { supabase } from "@/lib/supabase-client";

export const EXPENSE_CATEGORIES = [
  "Salaries",
  "Utilities",
  "Maintenance",
  "Inventory Purchase",
  "Transport",
  "Feeding",
  "Examination",
  "Miscellaneous",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type ExpenseRow = {
  id: string;
  category: ExpenseCategory;
  className: string | null;
  amount: number;
  description: string;
  paidTo: string;
  method: string;
  date: string;
};

export async function fetchExpenses(): Promise<ExpenseRow[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, category, class_id, amount, description, paid_to, method, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const classIds = Array.from(
    new Set((data ?? []).filter((e) => e.class_id).map((e) => e.class_id as string)),
  );
  const classNameById = new Map<string, string>();
  if (classIds.length > 0) {
    const { data: classes } = await supabase
      .from("classes_staff_view")
      .select("id, name")
      .in("id", classIds);
    for (const c of classes ?? []) classNameById.set(c.id, c.name);
  }

  return (data ?? []).map((e) => ({
    id: e.id,
    category: e.category as ExpenseCategory,
    className: e.class_id ? (classNameById.get(e.class_id) ?? null) : null,
    amount: Number(e.amount),
    description: e.description ?? "",
    paidTo: e.paid_to ?? "—",
    method: e.method,
    date: new Date(e.created_at).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  }));
}

export type CreateExpenseInput = {
  category: ExpenseCategory;
  classId: string;
  amount: number;
  description: string;
  paidTo: string;
  method: "Cash" | "Transfer" | "POS";
};

export async function createExpense(input: CreateExpenseInput, addedBy: string): Promise<void> {
  const { error } = await supabase.from("expenses").insert({
    category: input.category,
    class_id: input.classId || null,
    amount: input.amount,
    description: input.description || null,
    paid_to: input.paidTo || null,
    method: input.method,
    added_by: addedBy,
  });
  if (error) throw error;
}

export type ExpenseSummary = {
  totalThisTerm: number;
  byCategory: { category: string; total: number }[];
};

export async function fetchExpenseSummary(): Promise<ExpenseSummary> {
  const { data, error } = await supabase.from("expenses").select("amount, category");
  if (error) throw error;

  const totalThisTerm = (data ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  const byCategory = new Map<string, number>();
  for (const e of data ?? []) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + Number(e.amount));
  }

  return {
    totalThisTerm,
    byCategory: Array.from(byCategory.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total),
  };
}
