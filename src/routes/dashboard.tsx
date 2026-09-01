import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BanknoteArrowDown,
  BanknoteArrowUp,
  Plus,
  Receipt,
  TrendingUp,
  UserPlus,
  Users2,
  Wallet,
  Calculator,
} from "lucide-react";
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
  ProgressRing,
  StatusBadge,
  InitialAvatar,
  paymentTone,
} from "@/components/fin/primitives";
import { naira, pct } from "@/lib/school-data";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Financial Dashboard — Divine Sources Finance OS" },
      {
        name: "description",
        content:
          "Term revenue, collection progress, outstanding fees, expenses and estimated profit for Divine Sources Praiseland High School.",
      },
      { property: "og:title", content: "Financial Dashboard — Divine Sources Finance OS" },
      {
        property: "og:description",
        content: "Live view of expected revenue, collections, expenses and estimated profit.",
      },
    ],
  }),
  component: Dashboard,
});

const SECTION_TONES = ["primary", "gold", "olive", "slate"] as const;

function Dashboard() {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading financial overview…</p>
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-semibold text-destructive">Couldn't load the dashboard.</p>
          <p className="text-xs text-muted-foreground">
            Please refresh the page. If this keeps happening, let Praise know.
          </p>
        </div>
      </AppShell>
    );
  }

  const {
    school,
    metrics,
    sections,
    outstandingStudents,
    recentPayments,
    recentExpenses,
    revenueTrend,
  } = data;
  const collection = pct(metrics.collectedRevenue, metrics.expectedRevenue);

  return (
    <AppShell>
      <PageHeader
        title="Financial overview"
        subtitle={`${school.name} · ${school.session} · ${school.term}`}
        actions={
          <>
            <Link
              to="/reports"
              className="flex h-11 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold transition-colors hover:bg-muted"
            >
              View reports
            </Link>
            <Link
              to="/finance/record-payment"
              className="flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-deep"
            >
              <Plus className="size-4" /> Record payment
            </Link>
          </>
        }
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Expected revenue"
          value={naira(metrics.expectedRevenue)}
          hint={`${metrics.studentCount} students · auto-calculated`}
          tone="primary"
          icon={<Calculator className="size-4" />}
        />
        <MetricCard
          label="Collected revenue"
          value={naira(metrics.collectedRevenue)}
          hint={`${collection}% of expected revenue`}
          tone="success"
          icon={<BanknoteArrowUp className="size-4" />}
          footer={<ProgressBar value={collection} />}
        />
        <MetricCard
          label="Outstanding revenue"
          value={naira(metrics.outstandingRevenue)}
          hint={`${metrics.studentsOwingCount} students still owing`}
          tone="danger"
          icon={<Wallet className="size-4" />}
        />
        <MetricCard
          label="Estimated net profit"
          value={naira(metrics.estimatedNetProfit)}
          hint={`Collected − ${naira(metrics.totalExpenses, { compact: true })} expenses`}
          tone="gold"
          icon={<TrendingUp className="size-4" />}
        />
        <MetricCard
          label="Today's revenue"
          value={naira(metrics.todayRevenue)}
          hint={`${metrics.receiptsToday} receipt${metrics.receiptsToday === 1 ? "" : "s"} issued today`}
          tone="success"
          icon={<Receipt className="size-4" />}
        />
        <MetricCard
          label="Today's expenses"
          value={naira(metrics.todayExpenses)}
          hint={`${metrics.expensesToday} expense${metrics.expensesToday === 1 ? "" : "s"} recorded today`}
          tone="danger"
          icon={<BanknoteArrowDown className="size-4" />}
        />
      </div>

      <Panel
        className="mt-6"
        title="How expected revenue is calculated"
        description="Updated automatically whenever students, fees, discounts, payments or expenses change."
      >
        <div className="flex flex-wrap items-stretch gap-3">
          <Formula label="Students" value={`${metrics.studentCount}`} />
          <Operator sign="×" />
          <Formula label="Average fee" value={naira(metrics.avgFee)} />
          <Operator sign="−" />
          <Formula label="Discounts" value={naira(metrics.discounts)} tone="gold" />
          <Operator sign="+" />
          <Formula label="Extra charges" value={naira(metrics.extraCharges)} tone="gold" />
          <Operator sign="=" />
          <Formula label="Expected revenue" value={naira(metrics.expectedRevenue)} tone="primary" />
        </div>
        <div className="mt-6 grid gap-4 border-t border-border pt-6 md:grid-cols-3">
          <Chain
            title="Payments recorded"
            body="Every receipt increases collected revenue and moves the collection ring forward."
          />
          <Chain
            title="Expenses added"
            body={`Expenses of ${naira(metrics.totalExpenses)} this term reduce estimated profit in real time.`}
          />
          <Chain
            title="Discounts changed"
            body="A student's discount recalculates expected revenue the moment it's updated."
          />
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <Panel title="Revenue collection progress" description={`${school.term} target`}>
          <div className="flex flex-col items-center">
            <ProgressRing
              value={collection}
              label="Collected"
              caption={`${naira(metrics.collectedRevenue, { compact: true })} of ${naira(metrics.expectedRevenue, { compact: true })}`}
            />
            <dl className="mt-8 grid w-full grid-cols-2 gap-4">
              <div className="rounded-md bg-success-soft p-4">
                <dt className="text-xs font-semibold text-success">Collected</dt>
                <dd className="num mt-1 text-sm font-bold">{naira(metrics.collectedRevenue)}</dd>
              </div>
              <div className="rounded-md bg-danger-soft p-4">
                <dt className="text-xs font-semibold text-destructive">Outstanding</dt>
                <dd className="num mt-1 text-sm font-bold">{naira(metrics.outstandingRevenue)}</dd>
              </div>
            </dl>
            <Link
              to="/targets"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Open collection targets <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </Panel>

        <Panel title="Revenue vs expenses" description="Six-month trend (₦)">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ left: -12, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
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
                  tickFormatter={(v: number) => naira(v, { compact: true })}
                />
                <Tooltip
                  formatter={(v: number) => naira(v)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fill="url(#rev)"
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

          <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="size-2.5 rounded-full bg-primary" /> Revenue collected
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="size-2.5 rounded-full bg-gold" /> Expenses paid
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        className="mt-6"
        title="Revenue by section"
        description="Expected vs collected across school sections"
        action={
          <Link to="/classes" className="text-sm font-semibold text-primary hover:underline">
            View classes
          </Link>
        }
      >
        {sections.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No students assigned to classes yet.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {sections.map((s, i) => {
              const p = pct(s.collected, s.expected);
              return (
                <div key={s.name} className="rounded-md border border-border p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{s.name}</p>
                    <StatusBadge tone={p >= 80 ? "success" : p >= 65 ? "warning" : "danger"}>
                      {p}%
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{s.students} students</p>
                  <ProgressBar
                    className="mt-4"
                    value={p}
                    tone={SECTION_TONES[i % SECTION_TONES.length]}
                  />
                  <dl className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Expected</dt>
                      <dd className="num font-semibold">{naira(s.expected)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Collected</dt>
                      <dd className="num font-semibold text-success">{naira(s.collected)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Outstanding</dt>
                      <dd className="num font-semibold text-destructive">
                        {naira(s.expected - s.collected)}
                      </dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Outstanding students"
          description="Highest balances first"
          action={
            <Link to="/students" className="text-sm font-semibold text-primary hover:underline">
              All students
            </Link>
          }
          bodyClassName="p-0"
        >
          {outstandingStudents.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              No students owing right now.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {outstandingStudents.map((s) => (
                <li key={s.id}>
                  <Link
                    to="/students/$studentId"
                    params={{ studentId: s.id }}
                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted"
                  >
                    <InitialAvatar name={s.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.className} · {s.guardian}
                      </p>
                    </div>
                    <div className="text-right">
                      <Money value={s.outstanding} className="text-sm font-bold text-destructive" />
                      <p className="mt-1">
                        <StatusBadge tone={paymentTone(s.status)}>{s.status}</StatusBadge>
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent payments"
          description="Latest receipts issued"
          action={
            <Link to="/finance" className="text-sm font-semibold text-primary hover:underline">
              Open ledger
            </Link>
          }
          bodyClassName="p-0"
        >
          {recentPayments.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              No payments recorded yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recentPayments.map((p) => (
                <li key={p.id} className="flex items-center gap-4 px-6 py-4">
                  <span className="flex size-10 items-center justify-center rounded-md bg-success-soft text-success">
                    <Receipt className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.student}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.items} · {p.method}
                    </p>
                  </div>
                  <div className="text-right">
                    <Money value={p.amount} className="text-sm font-bold text-success" />
                    <p className="mt-1 text-xs text-muted-foreground">{p.date}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <Panel
          title="Recent expenses"
          description="Most recent first"
          action={
            <Link to="/expenses" className="text-sm font-semibold text-primary hover:underline">
              All expenses
            </Link>
          }
          bodyClassName="p-0"
        >
          {recentExpenses.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              No expenses recorded yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recentExpenses.map((e) => (
                <li key={e.id} className="flex items-center gap-4 px-6 py-4">
                  <span className="flex size-10 items-center justify-center rounded-md bg-danger-soft text-destructive">
                    <BanknoteArrowDown className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{e.desc}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.category} · {e.paidTo}
                    </p>
                  </div>
                  <div className="text-right">
                    <Money value={e.amount} className="text-sm font-bold" />
                    <p className="mt-1 text-xs text-muted-foreground">{e.date}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Quick actions" description="Common daily tasks">
          <div className="grid gap-3">
            <QuickAction
              to="/students/new"
              icon={<UserPlus className="size-[18px]" />}
              label="Add student"
            />
            <QuickAction
              to="/finance/record-payment"
              icon={<Receipt className="size-[18px]" />}
              label="Record payment"
            />
            <QuickAction
              to="/expenses"
              icon={<BanknoteArrowDown className="size-[18px]" />}
              label="Add expense"
            />
            <QuickAction to="/staff" icon={<Users2 className="size-[18px]" />} label="Add staff" />
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      className="flex items-center gap-3 rounded-md border border-border px-4 py-3.5 text-sm font-semibold transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary"
    >
      <span className="flex size-9 items-center justify-center rounded-md bg-primary-soft text-primary">
        {icon}
      </span>
      {label}
      <Plus className="ml-auto size-4 text-muted-foreground" />
    </Link>
  );
}

function Formula({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "gold" | "primary";
}) {
  const styles = {
    neutral: "border-border bg-card",
    gold: "border-[color:var(--gold)]/30 bg-gold-soft",
    primary: "border-primary/30 bg-primary-soft",
  }[tone];
  return (
    <div className={`min-w-[150px] flex-1 rounded-md border p-4 ${styles}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="num mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}

function Operator({ sign }: { sign: string }) {
  return (
    <div className="flex items-center justify-center text-lg font-bold text-muted-foreground">
      {sign}
    </div>
  );
}

function Chain({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
