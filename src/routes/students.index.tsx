import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Filter, Plus, Search, UserX } from "lucide-react";
import { AppShell } from "@/components/fin/app-shell";
import {
  EmptyState,
  InitialAvatar,
  Money,
  PageHeader,
  Panel,
  StatusBadge,
  paymentTone,
} from "@/components/fin/primitives";
import { CLASSES, STUDENTS, naira, outstanding } from "@/lib/school-data";

export const Route = createFileRoute("/students/")({
  head: () => ({
    meta: [
      { title: "Students — Divine Sources Finance OS" },
      {
        name: "description",
        content:
          "Search students, view outstanding balances and payment status across every class at Divine Sources Praiseland High School.",
      },
      { property: "og:title", content: "Students — Divine Sources Finance OS" },
      {
        property: "og:description",
        content: "Student register with fees, discounts, balances and payment status.",
      },
    ],
  }),
  component: StudentsPage,
});

const STATUSES = ["All", "Paid", "Part Payment", "Owing"] as const;

function StudentsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("All");
  const [klass, setKlass] = useState("All classes");

  const rows = useMemo(
    () =>
      STUDENTS.filter((s) => {
        const q = query.trim().toLowerCase();
        const matchQuery =
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.guardian.toLowerCase().includes(q) ||
          s.admissionNo.toLowerCase().includes(q);
        const matchStatus = status === "All" || s.status === status;
        const matchClass = klass === "All classes" || s.className === klass;
        return matchQuery && matchStatus && matchClass;
      }),
    [query, status, klass],
  );

  const totalOutstanding = rows.reduce((sum, s) => sum + outstanding(s), 0);

  return (
    <AppShell>
      <PageHeader
        title="Students"
        subtitle={`${STUDENTS.length} enrolled · ${naira(totalOutstanding)} outstanding in current view`}
        actions={
          <>
            <button className="flex h-11 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold transition-colors hover:bg-muted">
              <Download className="size-4" /> Export
            </button>
            <Link
              to="/students/new"
              className="flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-deep"
            >
              <Plus className="size-4" /> Add student
            </Link>
          </>
        }
      />

      <Panel className="mt-8" bodyClassName="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative flex h-11 min-w-[260px] flex-1 items-center">
            <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by student, guardian or admission number"
              className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
            />
          </label>

          <select
            value={klass}
            onChange={(e) => setKlass(e.target.value)}
            className="h-11 rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
          >
            <option>All classes</option>
            {CLASSES.map((c) => (
              <option key={c.id}>{c.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 rounded-md border border-border bg-background p-1">
            <Filter className="mx-2 size-4 text-muted-foreground" />
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <Panel className="mt-6" bodyClassName="p-0">
        {rows.length === 0 ? (
          <EmptyState
            icon={<UserX className="size-5" />}
            title="No students match your filters"
            description="Try a different class, payment status or search term."
            action={
              <button
                onClick={() => {
                  setQuery("");
                  setStatus("All");
                  setKlass("All classes");
                }}
                className="rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Student", "Class", "Guardian", "Outstanding balance", "Status", ""].map((h) => (
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
                {rows.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-muted/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <InitialAvatar name={s.name} />
                        <div>
                          <p className="font-semibold">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.admissionNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{s.className}</p>
                      <p className="text-xs text-muted-foreground">{s.section}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{s.guardian}</p>
                      <p className="num text-xs text-muted-foreground">{s.guardianPhone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Money
                        value={outstanding(s)}
                        className={
                          outstanding(s) > 0 ? "font-bold text-destructive" : "font-bold text-success"
                        }
                      />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge tone={paymentTone(s.status)}>{s.status}</StatusBadge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to="/students/$studentId"
                          params={{ studentId: s.id }}
                          className="rounded-md border border-border px-3 py-2 text-xs font-semibold transition-colors hover:bg-muted"
                        >
                          View
                        </Link>
                        <Link
                          to="/finance/record-payment"
                          search={{ student: s.id }}
                          className="rounded-md bg-primary-soft px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                          Record payment
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-6 py-4">
          <p className="text-xs text-muted-foreground">
            Showing {rows.length} of {STUDENTS.length} students
          </p>
          <div className="flex items-center gap-1">
            <button className="flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted">
              <ChevronLeft className="size-4" />
            </button>
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                className={`size-9 rounded-md text-xs font-semibold ${
                  p === 1 ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"
                }`}
              >
                {p}
              </button>
            ))}
            <button className="flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </Panel>
    </AppShell>
  );
}
