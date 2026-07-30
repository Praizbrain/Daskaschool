import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Download, Plus } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/fin/app-shell";
import {
  MetricCard,
  Money,
  PageHeader,
  Panel,
  ProgressBar,
  StatusBadge,
} from "@/components/fin/primitives";
import {
  CLASSES,
  ESTIMATED_PROFIT,
  FINANCE,
  INVENTORY,
  RECENT_PAYMENTS,
  REVENUE_MIX,
  REVENUE_TREND,
  SECTIONS,
  naira,
  pct,
} from "@/lib/school-data";

export const Route = createFileRoute("/finance/")({
  head: () => ({
    meta: [
      { title: "Finance ledger — Divine Sources Finance OS" },
      {
        name: "description",
        content:
          "Ledger of payments, revenue, school fees, item sales and profit for the current academic term.",
      },
      { property: "og:title", content: "Finance ledger — Divine Sources Finance OS" },
      {
        property: "og:description",
        content: "Payments, revenue, fees, sales and profitability in one ledger.",
      },
    ],
  }),
  component: FinancePage,
});

const TABS = ["Payments", "Revenue", "School Fees", "Sales", "Profit"] as const;
const CHART_COLORS = ["var(--primary)", "var(--gold)", "var(--olive)", "var(--slate)", "var(--chart-5)"];

function FinancePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Payments");

  return (
    <AppShell>
      <PageHeader
        title="Finance"
        subtitle="Every naira in and out of the school, recorded in one ledger"
        actions={
          <>
            <button className="flex h-11 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold transition-colors hover:bg-muted">
              <Download className="size-4" /> Export ledger
            </button>
            <Link
              to="/finance/record-payment"
              className="flex h-12 items-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-deep"
            >
              <Plus className="size-4" /> Record payment
            </Link>
          </>
        }
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Collected this term" value={naira(FINANCE.collectedRevenue)} tone="success" hint={`${pct(FINANCE.collectedRevenue, FINANCE.expectedRevenue)}% of expected`} />
        <MetricCard label="Outstanding" value={naira(FINANCE.outstandingRevenue)} tone="danger" />
        <MetricCard label="Total expenses" value={naira(FINANCE.totalExpenses)} hint={`Includes ${naira(FINANCE.salaries, { compact: true })} payroll`} />
        <MetricCard label="Estimated profit" value={naira(ESTIMATED_PROFIT)} tone="gold" />
      </div>

      <div className="mt-6 flex flex-wrap gap-1 rounded-md border border-border bg-card p-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "Payments" && (
          <Panel title="Payment ledger" description="All receipts issued this term" bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {["Receipt", "Student", "Class", "Items", "Method", "Amount", "Date"].map((h) => (
                      <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...RECENT_PAYMENTS, ...RECENT_PAYMENTS.map((p) => ({ ...p, receipt: p.receipt.replace("104", "103"), date: "Last week" }))].map((p, i) => (
                    <tr key={`${p.receipt}-${i}`} className="hover:bg-muted/60">
                      <td className="num px-6 py-4 font-semibold">{p.receipt}</td>
                      <td className="px-6 py-4">{p.student}</td>
                      <td className="px-6 py-4 text-muted-foreground">{p.className}</td>
                      <td className="px-6 py-4 text-muted-foreground">{p.items}</td>
                      <td className="px-6 py-4">
                        <StatusBadge tone="neutral">{p.method}</StatusBadge>
                      </td>
                      <td className="px-6 py-4">
                        <Money value={p.amount} className="font-bold text-success" />
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{p.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {tab === "Revenue" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
            <Panel title="Monthly revenue vs expenses" description="₦ millions">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={REVENUE_TREND} margin={{ left: -12, right: 8, top: 8 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v / 1_000_000}M`} />
                    <Tooltip formatter={(v: number) => naira(v)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                    <Bar dataKey="revenue" name="Revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="var(--gold)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title="Revenue mix" description="Where money comes from">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={REVENUE_MIX} dataKey="value" nameKey="name" innerRadius={62} outerRadius={100} paddingAngle={2}>
                      {REVENUE_MIX.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => naira(v)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-6 space-y-3">
                {REVENUE_MIX.map((m, i) => (
                  <li key={m.name} className="flex items-center gap-3 text-sm">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="flex-1">{m.name}</span>
                    <Money value={m.value} className="font-semibold" />
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        )}

        {tab === "School Fees" && (
          <Panel title="School fees by section" description="Expected, collected and outstanding" bodyClassName="p-0">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Section", "Students", "Expected", "Collected", "Outstanding", "Progress"].map((h) => (
                    <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {SECTIONS.map((s) => (
                  <tr key={s.name} className="hover:bg-muted/60">
                    <td className="px-6 py-4 font-semibold">{s.name}</td>
                    <td className="num px-6 py-4">{s.students}</td>
                    <td className="num px-6 py-4">{naira(s.expected)}</td>
                    <td className="num px-6 py-4 text-success">{naira(s.collected)}</td>
                    <td className="num px-6 py-4 text-destructive">{naira(s.expected - s.collected)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ProgressBar value={pct(s.collected, s.expected)} className="w-24" />
                        <span className="num text-xs font-semibold">{pct(s.collected, s.expected)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}

        {tab === "Sales" && (
          <Panel title="Item sales" description="Books, uniforms, sneakers and other items" bodyClassName="p-0">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Item", "Units sold", "Selling price", "Revenue", "Cost", "Profit"].map((h) => (
                    <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {INVENTORY.map((i) => (
                  <tr key={i.id} className="hover:bg-muted/60">
                    <td className="px-6 py-4 font-semibold">{i.name}</td>
                    <td className="num px-6 py-4">{i.sold}</td>
                    <td className="num px-6 py-4">{naira(i.price)}</td>
                    <td className="num px-6 py-4">{naira(i.price * i.sold)}</td>
                    <td className="num px-6 py-4 text-muted-foreground">{naira(i.cost * i.sold)}</td>
                    <td className="num px-6 py-4 font-bold text-success">{naira((i.price - i.cost) * i.sold)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}

        {tab === "Profit" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Profit build-up" description="How estimated profit is reached">
              <ul className="space-y-3">
                <Line label="Collected revenue" value={FINANCE.collectedRevenue} tone="up" />
                <Line label="Staff salaries" value={-FINANCE.salaries} tone="down" />
                <Line label="Other expenses" value={-(FINANCE.totalExpenses - FINANCE.salaries)} tone="down" />
                <li className="flex items-center justify-between rounded-md bg-primary-soft px-5 py-4">
                  <span className="text-sm font-bold text-primary">Estimated net profit</span>
                  <span className="num text-lg font-bold text-primary">{naira(ESTIMATED_PROFIT)}</span>
                </li>
              </ul>
              <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
                If the outstanding {naira(FINANCE.outstandingRevenue)} is fully collected, estimated profit rises to{" "}
                <span className="font-semibold text-foreground">
                  {naira(ESTIMATED_PROFIT + FINANCE.outstandingRevenue)}
                </span>
                .
              </p>
            </Panel>
            <Panel title="Profit contribution by class" description="Collected − teacher salary − class expenses" bodyClassName="p-0">
              <ul className="divide-y divide-border">
                {[...CLASSES]
                  .map((c) => ({ ...c, profit: c.collected - c.teacherSalary - c.expenses }))
                  .sort((a, b) => b.profit - a.profit)
                  .slice(0, 8)
                  .map((c) => (
                    <li key={c.id} className="flex items-center gap-4 px-6 py-4">
                      <span className="flex-1 text-sm font-semibold">{c.name}</span>
                      <ProgressBar value={pct(c.profit, 3_000_000)} className="w-32" tone="olive" />
                      <Money value={c.profit} className="w-32 text-right text-sm font-bold" />
                    </li>
                  ))}
              </ul>
            </Panel>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Line({ label, value, tone }: { label: string; value: number; tone: "up" | "down" }) {
  return (
    <li className="flex items-center justify-between rounded-md border border-border px-5 py-4">
      <span className="flex items-center gap-3 text-sm font-medium">
        <span
          className={`flex size-8 items-center justify-center rounded-md ${
            tone === "up" ? "bg-success-soft text-success" : "bg-danger-soft text-destructive"
          }`}
        >
          {tone === "up" ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
        </span>
        {label}
      </span>
      <span className="num text-sm font-bold">{naira(value)}</span>
    </li>
  );
}
