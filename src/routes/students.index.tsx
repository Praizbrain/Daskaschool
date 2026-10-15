import { PageLoadingSkeleton } from "@/components/fin/loading-skeleton";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Filter, Plus, Search, UserX } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
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
import { naira } from "@/lib/school-data";
import { useStudents } from "@/hooks/use-students";
import { usePaymentModal } from "@/context/payment-modal-context";

export const Route = createFileRoute("/students/")({
  validateSearch: z.object({
    q: z.string().optional(),
    klass: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Students — DaskaSchool" },
      {
        name: "description",
        content:
          "Search students, view outstanding balances and payment status across every class at Divine Sources Praiseland High School.",
      },
    ],
  }),
  component: StudentsPage,
});

const STATUSES = ["All", "Paid", "Part Payment", "Owing"] as const;
const PAGE_SIZE = 20;

function StudentsPage() {
  const { openPaymentModal } = usePaymentModal();
  const searchParams = Route.useSearch();
  const { data: students, isLoading, error } = useStudents();
  const [query, setQuery] = useState(searchParams.q || "");

  useEffect(() => {
    if (searchParams.q !== undefined) {
      setQuery(searchParams.q);
    }
  }, [searchParams.q]);
  useEffect(() => {
    if (searchParams.klass !== undefined) {
      setKlass(searchParams.klass);
    }
  }, [searchParams.klass]);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("All");
  const [klass, setKlass] = useState(searchParams.klass || "All classes");
  const [page, setPage] = useState(1);

  const classOptions = useMemo(() => {
    if (!students) return [];
    return Array.from(new Set(students.map((s) => s.className))).sort();
  }, [students]);

  const rows = useMemo(() => {
    if (!students) return [];
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.guardian.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q);
      const matchStatus = status === "All" || s.status === status;
      const matchClass = klass === "All classes" || s.className === klass;
      return matchQuery && matchStatus && matchClass;
    });
  }, [students, query, status, klass]);

  const totalOutstanding = rows.reduce((sum, s) => sum + s.outstanding, 0);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (isLoading) {
    return (
      <AppShell>
        <PageLoadingSkeleton metricCards={0} />
      </AppShell>
    );
  }

  if (error || !students) {
    return (
      <AppShell>
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-semibold text-destructive">Couldn't load students.</p>
          <p className="text-xs text-muted-foreground">Please refresh the page.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Students"
        subtitle={`${students.length} enrolled · ${naira(totalOutstanding)} outstanding in current view`}
        actions={
          <>
            <button
              onClick={() => toast.info("Export is coming with the Reports phase.")}
              className="flex h-11 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Export
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
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by student, guardian or admission number"
              className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
            />
          </label>

          <select
            value={klass}
            onChange={(e) => {
              setKlass(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
          >
            <option>All classes</option>
            {classOptions.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 rounded-md border border-border bg-background p-1">
            <Filter className="mx-2 size-4 text-muted-foreground" />
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  status === s
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
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
            title={students.length === 0 ? "No students yet" : "No students match your filters"}
            description={
              students.length === 0
                ? "Add your first student to get started."
                : "Try a different class, payment status or search term."
            }
            action={
              students.length === 0 ? (
                <Link
                  to="/students/new"
                  className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Add student
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setQuery("");
                    setStatus("All");
                    setKlass("All classes");
                    setPage(1);
                  }}
                  className="rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
                >
                  Clear filters
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Student", "Class", "Guardian", "Outstanding balance", "Status", ""].map(
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
                {pageRows.map((s) => (
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
                        value={s.outstanding}
                        className={
                          s.outstanding > 0
                            ? "font-bold text-destructive"
                            : "font-bold text-success"
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
                        <button
                          onClick={() => openPaymentModal(s.id)}
                          className="rounded-md bg-primary-soft px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                          Record payment
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-6 py-4">
            <p className="text-xs text-muted-foreground">
              Showing {pageRows.length} of {rows.length} students
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-9 items-center rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-2 text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-9 items-center rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
