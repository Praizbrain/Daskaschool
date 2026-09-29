import { PageLoadingSkeleton } from "@/components/fin/loading-skeleton";
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
import { naira } from "@/lib/school-data";
import { useAuth } from "@/hooks/use-auth";
import { useClass, useClasses } from "@/hooks/use-classes";

export const Route = createFileRoute("/classes/$classId")({
  head: () => ({
    meta: [
      { title: "Class details — DaskaSchool" },
      {
        name: "description",
        content: "Class revenue, fee structure and student payment completion.",
      },
    ],
  }),
  component: ClassDetails,
});

function ClassDetails() {
  const { classId } = useParams({ from: "/classes/$classId" });
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "super_admin";
  const { data: klass, isLoading, error } = useClass(classId, isSuperAdmin);
  const { data: allClasses } = useClasses();

  if (isLoading) {
    return (
      <AppShell>
        <PageLoadingSkeleton metricCards={4} showTable={false} />
      </AppShell>
    );
  }

  if (error || !klass) {
    return (
      <AppShell>
        <Panel>
          <EmptyState
            title="Class not found"
            action={
              <Link
                to="/classes"
                className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Back to classes
              </Link>
            }
          />
        </Panel>
      </AppShell>
    );
  }

  const paidCount = klass.students.filter((s) => s.status === "Paid").length;
  const partCount = klass.students.filter((s) => s.status === "Part Payment").length;
  const owingCount = klass.students.filter((s) => s.status === "Owing").length;

  const otherClassesInSection =
    allClasses?.filter((c) => c.section === klass.section && c.id !== klass.id) ?? [];

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <Link
          to="/classes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to classes
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{klass.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {klass.section} section · Class teacher {klass.teacherName ?? "Not assigned"} ·{" "}
            {klass.studentCount} students
          </p>
        </div>
        <StatusBadge
          tone={
            klass.collectionPct >= 80 ? "success" : klass.collectionPct >= 65 ? "warning" : "danger"
          }
        >
          {klass.collectionPct}% collected
        </StatusBadge>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Expected revenue"
          value={naira(klass.expected)}
          hint={`${klass.studentCount} students × fees`}
          tone="primary"
        />
        <MetricCard
          label="Collected revenue"
          value={naira(klass.collected)}
          hint={`${klass.collectionPct}% of expected`}
          tone="success"
        />
        <MetricCard label="Outstanding" value={naira(klass.outstanding)} tone="danger" />

        {isSuperAdmin && klass.teacherSalary !== null && (
          <>
            <MetricCard
              label="Teacher salary (term)"
              value={naira(klass.teacherSalary)}
              hint="Deducted from class profit"
            />
            <MetricCard
              label="Class expenses"
              value={naira(klass.classExpenses)}
              hint="Materials, repairs, activities"
            />
            <MetricCard
              label="Estimated profit"
              value={naira(klass.estimatedProfit ?? 0)}
              hint="Collected − salary − expenses"
              tone="gold"
            />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <Panel title="Payment completion">
          <div className="flex flex-col items-center">
            <ProgressRing
              value={klass.collectionPct}
              label="Collected"
              caption={`${naira(klass.collected, { compact: true })} of ${naira(klass.expected, { compact: true })}`}
            />
            <div className="mt-8 w-full space-y-3 text-sm">
              <Row label="Fully paid students" value={`${paidCount}`} />
              <Row label="Part payments" value={`${partCount}`} />
              <Row label="Not yet paid" value={`${owingCount}`} />
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
          {klass.students.length === 0 ? (
            <EmptyState
              icon={<Users className="size-5" />}
              title="No students in this class yet"
              description="Students assigned to this class will show up here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {["Student", "Guardian", "Outstanding", "Status", ""].map((h) => (
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
                  {klass.students.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/60">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <InitialAvatar name={s.name} size="sm" />
                          <p className="font-semibold">{s.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{s.guardian}</td>
                      <td className="px-6 py-4">
                        <Money value={s.outstanding} className="font-semibold" />
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
          )}
        </Panel>
      </div>

      {otherClassesInSection.length > 0 && (
        <Panel className="mt-6" title="Other classes in this section" bodyClassName="p-5">
          <div className="flex flex-wrap gap-3">
            {otherClassesInSection.map((c) => (
              <Link
                key={c.id}
                to="/classes/$classId"
                params={{ classId: c.id }}
                className="flex items-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-semibold transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary"
              >
                <Users className="size-4" /> {c.name}
                <span className="num text-xs text-muted-foreground">{c.collectionPct}%</span>
              </Link>
            ))}
          </div>
        </Panel>
      )}
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
