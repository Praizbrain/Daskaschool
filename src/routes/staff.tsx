import { createFileRoute } from "@tanstack/react-router";
import { Phone, Plus } from "lucide-react";
import { AppShell } from "@/components/fin/app-shell";
import { InitialAvatar, MetricCard, Money, PageHeader, StatusBadge } from "@/components/fin/primitives";
import { STAFF, naira } from "@/lib/school-data";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff & payroll — Divine Sources Finance OS" },
      { name: "description", content: "Staff roles, monthly salaries, assigned sections and payroll totals." },
      { property: "og:title", content: "Staff & payroll — Divine Sources Finance OS" },
      { property: "og:description", content: "Salaries and assignments for teaching and support staff." },
    ],
  }),
  component: StaffPage,
});

function StaffPage() {
  const monthly = STAFF.reduce((s, m) => s + m.salary, 0);
  return (
    <AppShell>
      <PageHeader
        title="Staff"
        subtitle="Salary changes recalculate estimated profit automatically"
        actions={
          <button className="flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary-deep">
            <Plus className="size-4" /> Add staff
          </button>
        }
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <MetricCard label="Total staff" value={`${STAFF.length}`} tone="primary" />
        <MetricCard label="Monthly payroll" value={naira(monthly)} tone="gold" />
        <MetricCard label="Term payroll (3 months)" value={naira(monthly * 3)} />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {STAFF.map((m) => (
          <div key={m.id} className="surface p-6">
            <div className="flex items-start gap-4">
              <InitialAvatar name={m.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold">{m.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{m.role}</p>
              </div>
              <StatusBadge tone={m.status === "Active" ? "success" : "warning"}>{m.status}</StatusBadge>
            </div>

            <dl className="mt-5 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Monthly salary</dt>
                <dd><Money value={m.salary} className="font-bold" /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Assigned section</dt>
                <dd className="font-semibold">{m.section}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="num font-semibold">{m.phone}</dd>
              </div>
            </dl>

            <button className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border text-sm font-semibold hover:bg-muted">
              <Phone className="size-4" /> View staff record
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
