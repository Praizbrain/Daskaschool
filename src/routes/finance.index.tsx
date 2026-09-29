import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/fin/app-shell";
import {
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
import { usePaymentModal } from "@/context/payment-modal-context";
import { useFinanceSummary, useLedger, useProfitByClass } from "@/hooks/use-finance";

export const Route = createFileRoute("/finance/")({
  head: () => ({
    meta: [
      { title: "Finance — DaskaSchool" },
      {
        name: "description",
        content:
          "Full payment ledger, revenue summary and class-by-class profit for Divine Sources Praiseland High School.",
      },
    ],
  }),
  component: FinancePage,
});

const TABS = ["Ledger", "Summary", "Profit"] as const;
type Tab = (typeof TABS)[number];

function FinancePage() {
  const { openPaymentModal } = usePaymentModal();
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "super_admin";
  const [tab, setTab] = useState<Tab>("Ledger");

  const { data: ledger, isLoading: ledgerLoading } = useLedger();
  const { data: summary, isLoading: summaryLoading } = useFinanceSummary();
  const { data: profit, isLoading: profitLoading } = useProfitByClass(isSuperAdmin);

  const isLoading = ledgerLoading || summaryLoading || (isSuperAdmin && profitLoading);

  if (isLoading) {
    return (
      <AppShell>
        <PageLoadingSkeleton metricCards={4} />
      </AppShell>
    );
  }

  const visibleTabs = isSuperAdmin ? TABS : (["Ledger", "Summary"] as const);

  return (
    <AppShell>
      <PageHeader
        title="Finance"
        subtitle={`${ledger?.length ?? 0} payments recorded · ${naira(summary?.collectedRevenue ?? 0)} collected this term`}
        actions={
          <button
            onClick={() => openPaymentModal()}
            className="flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-deep"
          >
            <Plus className="size-4" /> Record payment
          </button>
        }
      />

      <div className="mt-6 flex flex-wrap gap-1 rounded-md border border-border bg-card p-1.5">
        {visibleTabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as Tab)}
            className={`rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "Ledger" && <LedgerTab rows={ledger ?? []} />}
        {tab === "Summary" && summary && <SummaryTab summary={summary} />}
        {tab === "Profit" && isSuperAdmin && <ProfitTab rows={profit ?? []} />}
      </div>
    </AppShell>
  );
}

function LedgerTab({ rows }: { rows: import("@/lib/finance-data").LedgerRow[] }) {
  const [search, setSearch] = useState("");
  const filtered = rows.filter(
    (r) =>
      !search ||
      r.student.toLowerCase().includes(search.toLowerCase()) ||
      r.receiptNo.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Panel bodyClassName="p-0">
      <div className="p-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name or receipt number…"
          className="h-11 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-muted-foreground">
          {rows.length === 0 ? "No payments recorded yet." : "No payments match that search."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Receipt no.", "Student", "Class", "Items", "Method", "Amount", "Date"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/60">
                  <td className="px-6 py-4 font-mono text-xs font-semibold">{r.receiptNo}</td>
                  <td className="px-6 py-4 font-semibold">{r.student}</td>
                  <td className="px-6 py-4 text-muted-foreground">{r.className}</td>
                  <td className="px-6 py-4 text-muted-foreground">{r.items}</td>
                  <td className="px-6 py-4">
                    <StatusBadge tone="primary">{r.method}</StatusBadge>
                  </td>
                  <td className="px-6 py-4">
                    <Money value={r.amount} className="font-bold text-success" />
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function SummaryTab({ summary }: { summary: import("@/lib/finance-data").FinanceSummary }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Expected revenue"
          value={naira(summary.expectedRevenue)}
          tone="primary"
        />
        <MetricCard
          label="Collected revenue"
          value={naira(summary.collectedRevenue)}
          tone="success"
        />
        <MetricCard label="Outstanding" value={naira(summary.outstandingRevenue)} tone="danger" />
        <MetricCard label="Total expenses" value={naira(summary.totalExpenses)} />
        <MetricCard label="Salaries paid" value={naira(summary.salariesTotal)} />
        <MetricCard
          label="Estimated profit"
          value={naira(summary.estimatedProfit)}
          tone="gold"
          icon={<TrendingUp className="size-4" />}
        />
      </div>

      <Panel title="Revenue vs expenses — 6-month trend">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={summary.revenueTrend} margin={{ left: -12, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => naira(v, { compact: true })}
              />
              <Tooltip
                formatter={(v: number) => naira(v)}
                contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--primary)"
                strokeWidth={2.5}
                fill="url(#rev2)"
                name="Revenue"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="var(--gold)"
                strokeWidth={2.5}
                fill="transparent"
                name="Expenses"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Collection by section" bodyClassName="p-0">
        <div className="divide-y divide-border">
          {summary.sectionBreakdown.map((s) => {
            const p = s.expected > 0 ? Math.round((s.collected / s.expected) * 100) : 0;
            return (
              <div key={s.name} className="flex items-center gap-6 px-6 py-4">
                <div className="w-24 shrink-0">
                  <p className="text-sm font-bold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.students} students</p>
                </div>
                <ProgressBar value={p} className="flex-1" />
                <span className="num w-10 shrink-0 text-right text-xs font-semibold">{p}%</span>
                <Money
                  value={s.collected}
                  className="w-28 shrink-0 text-right text-sm font-semibold"
                />
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function ProfitTab({ rows }: { rows: import("@/lib/finance-data").ClassProfitRow[] }) {
  const sorted = [...rows].sort((a, b) => b.profit - a.profit);
  return (
    <Panel
      title="Profit by class"
      description="Collected revenue minus teacher salary and class expenses"
      bodyClassName="p-0"
    >
      {sorted.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-muted-foreground">No class data yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Class", "Estimated profit"].map((h) => (
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
              {sorted.map((r) => (
                <tr key={r.id} className="hover:bg-muted/60">
                  <td className="px-6 py-4 font-semibold">
                    <Link
                      to="/classes/$classId"
                      params={{ classId: r.id }}
                      className="hover:text-primary hover:underline"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Money
                      value={r.profit}
                      className={`font-bold ${r.profit >= 0 ? "text-success" : "text-destructive"}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
