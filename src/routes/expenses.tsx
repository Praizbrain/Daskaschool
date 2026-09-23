import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Receipt, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/fin/app-shell";
import {
  EmptyState,
  MetricCard,
  Money,
  PageHeader,
  Panel,
  ProgressBar,
  StatusBadge,
} from "@/components/fin/primitives";
import { PageLoadingSkeleton } from "@/components/fin/loading-skeleton";
import { naira } from "@/lib/school-data";
import { useAuth } from "@/hooks/use-auth";
import { useClasses } from "@/hooks/use-classes";
import { useCreateExpense, useExpenses, useExpenseSummary } from "@/hooks/use-expenses";
import { EXPENSE_CATEGORIES, type CreateExpenseInput } from "@/lib/expenses-data";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses — DaskaSchool" },
      {
        name: "description",
        content: "Record and review school expenses — salaries, utilities, maintenance and more.",
      },
    ],
  }),
  component: ExpensesPage,
});

const schema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  classId: z.string().optional(),
  amount: z.coerce.number().min(1, "Enter a positive amount"),
  description: z.string().optional(),
  paidTo: z.string().optional(),
  method: z.enum(["Cash", "Transfer", "POS"]),
});

type FormValues = z.infer<typeof schema>;

function ExpensesPage() {
  const { profile } = useAuth();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: summary, isLoading: summaryLoading } = useExpenseSummary();
  const { data: classes } = useClasses();
  const createExpense = useCreateExpense();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const isLoading = expensesLoading || summaryLoading;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { method: "Transfer", category: "Miscellaneous" },
  });

  const onSubmit = async (values: FormValues) => {
    if (!profile) return;
    try {
      await createExpense.mutateAsync({
        input: values as CreateExpenseInput,
        addedBy: profile.id,
      });
      toast.success("Expense recorded", {
        description: `${naira(values.amount)} logged under ${values.category}.`,
      });
      reset();
      setShowForm(false);
    } catch (err) {
      console.error("[expenses/onSubmit]", err);
      toast.error("Couldn't save this expense. Please try again.");
    }
  };

  const filtered = (expenses ?? []).filter(
    (e) =>
      !search ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      e.paidTo.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / 20));

  if (isLoading) {
    return (
      <AppShell>
        <PageLoadingSkeleton metricCards={3} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Expenses"
        subtitle={`${expenses?.length ?? 0} recorded · ${naira(summary?.totalThisTerm ?? 0)} this term`}
        actions={
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-deep"
          >
            <Plus className="size-4" /> {showForm ? "Cancel" : "Add expense"}
          </button>
        }
      />

      {/* Summary cards */}
      {summary && summary.byCategory.length > 0 && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Total expenses this term"
            value={naira(summary.totalThisTerm)}
            tone="danger"
          />
          {summary.byCategory.slice(0, 2).map((c) => (
            <MetricCard key={c.category} label={c.category} value={naira(c.total)} />
          ))}
        </div>
      )}

      {/* Breakdown by category */}
      {summary && summary.byCategory.length > 0 && (
        <Panel className="mt-6" title="Breakdown by category" bodyClassName="p-0">
          <div className="divide-y divide-border">
            {summary.byCategory.map((c) => {
              const pct =
                summary.totalThisTerm > 0 ? Math.round((c.total / summary.totalThisTerm) * 100) : 0;
              return (
                <div key={c.category} className="flex items-center gap-6 px-6 py-4">
                  <p className="w-36 shrink-0 text-sm font-semibold">{c.category}</p>
                  <ProgressBar value={pct} className="flex-1" />
                  <span className="num w-10 shrink-0 text-right text-xs font-semibold text-muted-foreground">
                    {pct}%
                  </span>
                  <Money
                    value={c.total}
                    className="w-28 shrink-0 text-right text-sm font-semibold"
                  />
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {/* Add expense form */}
      {showForm && (
        <Panel className="mt-6" title="Record an expense" bodyClassName="p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="block">
                <span className="text-sm font-semibold">Category</span>
                <select
                  {...register("category")}
                  className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="block">
                <span className="text-sm font-semibold">
                  Class (optional — leave blank for school-wide)
                </span>
                <select
                  {...register("classId")}
                  className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
                >
                  <option value="">School-wide (no specific class)</option>
                  {(classes ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <ExpenseField
                label="Amount (₦)"
                type="number"
                step="any"
                error={errors.amount?.message}
                {...register("amount")}
              />

              <ExpenseField
                label="Paid to"
                placeholder="e.g. NEPA, plumber's name"
                {...register("paidTo")}
              />

              <div className="sm:col-span-2">
                <ExpenseField
                  label="Description"
                  placeholder="Brief description of what this expense covered"
                  {...register("description")}
                />
              </div>

              <div className="block">
                <span className="text-sm font-semibold">Payment method</span>
                <div className="mt-2 flex gap-2">
                  {(["Cash", "Transfer", "POS"] as const).map((m) => (
                    <label key={m} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        value={m}
                        {...register("method")}
                        className="accent-[color:var(--primary)]"
                      />
                      <span className="text-sm">{m}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  reset();
                }}
                className="flex h-11 items-center rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {isSubmitting ? "Saving…" : "Save expense"}
              </button>
            </div>
          </form>
        </Panel>
      )}

      {/* Expense list */}
      <Panel className="mt-6" bodyClassName="p-0">
        <div className="p-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by description, category or paid to…"
            className="h-11 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Receipt className="size-5" />}
            title={
              expenses?.length === 0 ? "No expenses recorded yet" : "No expenses match your search"
            }
            description={
              expenses?.length === 0
                ? 'Click "Add expense" above to record your first expense.'
                : "Try a different search term."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {[
                      "Category",
                      "Description",
                      "Class",
                      "Paid to",
                      "Method",
                      "Amount",
                      "Date",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.slice(0, 20).map((e) => (
                    <tr key={e.id} className="hover:bg-muted/60">
                      <td className="px-6 py-4">
                        <StatusBadge tone="primary">{e.category}</StatusBadge>
                      </td>
                      <td className="px-6 py-4 font-medium">{e.description || "—"}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {e.className ?? "School-wide"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{e.paidTo}</td>
                      <td className="px-6 py-4 text-muted-foreground">{e.method}</td>
                      <td className="px-6 py-4">
                        <Money value={e.amount} className="font-bold text-destructive" />
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{e.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length > 20 && (
              <p className="px-6 py-4 text-xs text-muted-foreground">
                Showing 20 of {filtered.length} expenses. Use search to narrow down.
              </p>
            )}
          </>
        )}
      </Panel>
    </AppShell>
  );
}

const ExpenseField = React.forwardRef<
  HTMLInputElement,
  { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>
>(function ExpenseField({ label, error, ...props }, ref) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        ref={ref}
        {...props}
        className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
      />
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </label>
  );
});
