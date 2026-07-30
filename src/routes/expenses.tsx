import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Paperclip, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/fin/app-shell";
import { MetricCard, Money, PageHeader, Panel, StatusBadge } from "@/components/fin/primitives";
import { EXPENSES, EXPENSE_CATEGORIES, FINANCE, naira } from "@/lib/school-data";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses — Divine Sources Finance OS" },
      {
        name: "description",
        content: "Record and review school expenses by category, payee and payment method for the current term.",
      },
      { property: "og:title", content: "Expenses — Divine Sources Finance OS" },
      { property: "og:description", content: "Every school expense in one place, with receipts attached." },
    ],
  }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const [open, setOpen] = useState(false);

  return (
    <AppShell>
      <PageHeader
        title="Expenses"
        subtitle="Each expense recorded here reduces estimated profit immediately"
        actions={
          <button
            onClick={() => setOpen(true)}
            className="flex h-12 items-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary-deep"
          >
            <Plus className="size-4" /> Add expense
          </button>
        }
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <MetricCard label="Expenses this term" value={naira(FINANCE.totalExpenses)} tone="danger" />
        <MetricCard label="Payroll portion" value={naira(FINANCE.salaries)} hint="Teaching and support staff" />
        <MetricCard label="Today's expenses" value={naira(FINANCE.todayExpenses)} hint="1 record today" />
      </div>

      <Panel className="mt-6" title="Expense ledger" description="Most recent first" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Reference", "Date", "Category", "Description", "Paid to", "Method", "Amount"].map((h) => (
                  <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {EXPENSES.map((e) => (
                <tr key={e.id} className="hover:bg-muted/60">
                  <td className="num px-6 py-4 font-semibold">{e.id}</td>
                  <td className="px-6 py-4 text-muted-foreground">{e.date}</td>
                  <td className="px-6 py-4"><StatusBadge tone="primary">{e.category}</StatusBadge></td>
                  <td className="px-6 py-4">{e.desc}</td>
                  <td className="px-6 py-4 text-muted-foreground">{e.paidTo}</td>
                  <td className="px-6 py-4"><StatusBadge>{e.method}</StatusBadge></td>
                  <td className="px-6 py-4"><Money value={e.amount} className="font-bold" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-border bg-card shadow-lift">
            <header className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <h2 className="text-base font-semibold">Add expense</h2>
                <p className="mt-1 text-xs text-muted-foreground">This will reduce estimated profit</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-2 text-muted-foreground hover:bg-muted">
                <X className="size-4" />
              </button>
            </header>

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold">Category</span>
                <select className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary">
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Amount</span>
                <input placeholder="₦ 0" className="num mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold">Description</span>
                <input placeholder="e.g. Diesel for generator" className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Date</span>
                <input placeholder="20 / 02 / 2026" className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Paid to</span>
                <input placeholder="Vendor or staff name" className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Payment method</span>
                <select className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary">
                  <option>Cash</option>
                  <option>Transfer</option>
                  <option>POS</option>
                </select>
              </label>
              <div className="block">
                <span className="text-sm font-semibold">Attachment</span>
                <button className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm font-semibold text-muted-foreground hover:bg-muted">
                  <Paperclip className="size-4" /> Attach receipt
                </button>
              </div>
            </div>

            <footer className="flex justify-end gap-3 border-t border-border px-6 py-5">
              <button onClick={() => setOpen(false)} className="h-11 rounded-md border border-border px-5 text-sm font-semibold hover:bg-muted">
                Cancel
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  toast.success("Expense recorded", { description: "Estimated profit recalculated." });
                }}
                className="h-11 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-deep"
              >
                Save expense
              </button>
            </footer>
          </div>
        </div>
      )}
    </AppShell>
  );
}
