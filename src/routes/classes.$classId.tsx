import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Users } from "lucide-react";
import { AppShell } from "@/components/fin/app-shell";
import {
  EmptyState,
  InitialAvatar,
  MetricCard,
  Money,
  Panel,
  ProgressBar,
  ProgressRing,
  StatusBadge,
  paymentTone,
} from "@/components/fin/primitives";
import { CLASSES, STUDENTS, getClass, naira, outstanding, pct } from "@/lib/school-data";

export const Route = createFileRoute("/classes/$classId")({
  head: () => ({
    meta: [
      { title: "Class details — Divine Sources Finance OS" },
      {
        name: "description",
        content:
          "Class revenue, teacher salary, class expenses, estimated profit and student payment completion.",
      },
      { property: "og:title", content: "Class details — Divine Sources Finance OS" },
      {
        property: "og:description",
        content: "Profitability and payment completion for a single class.",
      },
    ],
  }),
  component: ClassDetails,
});

function ClassDetails() {
  const { classId } = useParams({ from: "/classes/$classId" });
  const klass = getClass(classId);

  if (!klass) {
    return (
      <AppShell>
        <Panel>
          <EmptyState
            title="Class not found"
            action={
              <Link to="/classes" className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                Back to classes
              </Link>
            }
          />
        </Panel>
      </AppShell>
    );
  }

  const collection = pct(klass.collected, klass.expected);
  const profit = klass.collected - klass.teacherSalary - klass.expenses;
  const students = STUDENTS.filter((s) => s.className === klass.name);
  const roster = students.length ? students : STUDENTS.filter((s) => s.section === klass.section).slice(0, 4);

  return (
    <AppShell>
      <Link
        to="/classes"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to classes
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{klass.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {klass.section} section · Class teacher {klass.teacher} · {klass.students} students
          </p>
        </div>
        <StatusBadge tone={collection >= 80 ? "success" : collection >= 65 ? "warning" : "danger"}>
          {collection}% collected
        </StatusBadge>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Expected revenue" value={naira(klass.expected)} hint={`${klass.students} students × fees`} tone="primary" />
        <MetricCard label="Collected revenue" value={naira(klass.collected)} hint={`${collection}% of expected`} tone="success" />
        <MetricCard label="Outstanding" value={naira(klass.expected - klass.collected)} tone="danger" />
        <MetricCard label="Teacher salary (term)" value={naira(klass.teacherSalary)} hint="Deducted from class profit" />
        <MetricCard label="Class expenses" value={naira(klass.expenses)} hint="Materials, repairs, activities" />
        <MetricCard
          label="Estimated profit"
          value={naira(profit)}
          hint="Collected − salary − expenses"
          tone="gold"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <Panel title="Payment completion">
          <div className="flex flex-col items-center">
            <ProgressRing value={collection} label="Collected" caption={`${naira(klass.collected, { compact: true })} of ${naira(klass.expected, { compact: true })}`} />
            <div className="mt-8 w-full space-y-3 text-sm">
              <Row label="Fully paid students" value={`${Math.round(klass.students * (collection / 100))}`} />
              <Row label="Part payments" value={`${Math.max(Math.round(klass.students * 0.22), 1)}`} />
              <Row label="Not yet paid" value={`${Math.max(klass.students - Math.round(klass.students * (collection / 100)) - Math.round(klass.students * 0.22), 0)}`} />
            </div>
          </div>
        </Panel>

        <Panel
          title="Student list"
          description="Balances for students in this class"
          action={
            <Link to="/students" className="text-sm font-semibold text-primary hover:underline">
              All students
            </Link>
          }
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Student", "Guardian", "Outstanding", "Status", ""].map((h) => (
                    <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roster.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <InitialAvatar name={s.name} size="sm" />
                        <div>
                          <p className="font-semibold">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.className}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{s.guardian}</td>
                    <td className="px-6 py-4">
                      <Money value={outstanding(s)} className="font-semibold" />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge tone={paymentTone(s.status)}>{s.status}</StatusBadge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to="/students/$studentId"
                        params={{ studentId: s.id }}
                        className="rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel className="mt-6" title="Other classes in this section" bodyClassName="p-5">
        <div className="flex flex-wrap gap-3">
          {CLASSES.filter((c) => c.section === klass.section && c.id !== klass.id).map((c) => (
            <Link
              key={c.id}
              to="/classes/$classId"
              params={{ classId: c.id }}
              className="flex items-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-semibold transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary"
            >
              <Users className="size-4" /> {c.name}
              <span className="num text-xs text-muted-foreground">{pct(c.collected, c.expected)}%</span>
            </Link>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-muted px-4 py-3">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="num text-sm font-bold">{value}</span>
    </div>
  );
}
