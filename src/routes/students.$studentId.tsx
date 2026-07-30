import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  FileText,
  Mail,
  Phone,
  Plus,
  Receipt,
  StickyNote,
  Upload,
} from "lucide-react";
import { AppShell } from "@/components/fin/app-shell";
import {
  EmptyState,
  InitialAvatar,
  KeyValue,
  Money,
  Panel,
  ProgressBar,
  StatusBadge,
  paymentTone,
} from "@/components/fin/primitives";
import {
  STUDENT_PAYMENTS,
  STUDENT_PURCHASES,
  getStudent,
  naira,
  outstanding,
  pct,
} from "@/lib/school-data";

export const Route = createFileRoute("/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student profile — Divine Sources Finance OS" },
      {
        name: "description",
        content:
          "Student fee summary, guardian details, payment timeline, purchases, notes and documents.",
      },
      { property: "og:title", content: "Student profile — Divine Sources Finance OS" },
      {
        property: "og:description",
        content: "Fee summary, discounts, balance and full payment history for a student.",
      },
    ],
  }),
  component: StudentProfile,
});

const TABS = ["Overview", "Payments", "Purchases", "Notes", "Documents"] as const;

function StudentProfile() {
  const { studentId } = useParams({ from: "/students/$studentId" });
  const student = getStudent(studentId);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  if (!student) {
    return (
      <AppShell>
        <Panel>
          <EmptyState
            title="Student not found"
            description="This student record may have been removed."
            action={
              <Link to="/students" className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                Back to students
              </Link>
            }
          />
        </Panel>
      </AppShell>
    );
  }

  const payable = student.fee - student.discount;
  const balance = outstanding(student);
  const completion = pct(student.paid, payable);

  return (
    <AppShell>
      <Link
        to="/students"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to students
      </Link>

      <Panel className="mt-5" bodyClassName="p-8">
        <div className="flex flex-wrap items-start gap-6">
          <InitialAvatar name={student.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{student.name}</h1>
              <StatusBadge tone={paymentTone(student.status)}>{student.status}</StatusBadge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {student.admissionNo} · {student.className} ({student.section}) · Joined {student.joined}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Phone className="size-4" /> {student.guardianPhone}
              </span>
              <span className="flex items-center gap-2">
                <Mail className="size-4" /> {student.guardianEmail}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted">
              <FileText className="size-4" /> Statement
            </button>
            <Link
              to="/finance/record-payment"
              search={{ student: student.id }}
              className="flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-deep"
            >
              <Plus className="size-4" /> Record payment
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-5 border-t border-border pt-8 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryTile label="Term fee" value={naira(student.fee)} />
          <SummaryTile label="Discount applied" value={naira(student.discount)} tone="gold" />
          <SummaryTile label="Total paid" value={naira(student.paid)} tone="success" />
          <SummaryTile label="Outstanding balance" value={naira(balance)} tone="danger" />
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between text-sm">
            <p className="font-semibold">Payment completion</p>
            <p className="num font-bold">{completion}%</p>
          </div>
          <ProgressBar className="mt-3" value={completion} />
          <p className="mt-2 text-xs text-muted-foreground">
            {naira(student.paid)} paid of {naira(payable)} payable after discount
          </p>
        </div>
      </Panel>

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
        {tab === "Overview" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Student information">
              <dl className="grid gap-6 sm:grid-cols-2">
                <KeyValue label="Full name" value={student.name} />
                <KeyValue label="Admission number" value={student.admissionNo} />
                <KeyValue label="Gender" value={student.gender} />
                <KeyValue label="Date of birth" value={student.dob} />
                <KeyValue label="Current class" value={student.className} />
                <KeyValue label="Section" value={student.section} />
                <KeyValue label="Home address" value={student.address} />
                <KeyValue label="Enrolled" value={student.joined} />
              </dl>
            </Panel>
            <Panel title="Guardian details">
              <dl className="grid gap-6 sm:grid-cols-2">
                <KeyValue label="Guardian name" value={student.guardian} />
                <KeyValue label="Relationship" value="Parent" />
                <KeyValue label="Phone number" value={student.guardianPhone} />
                <KeyValue label="Email" value={student.guardianEmail} />
                <KeyValue label="Preferred contact" value="WhatsApp / SMS" />
                <KeyValue label="Fee payer" value="Guardian" />
              </dl>
            </Panel>
          </div>
        )}

        {tab === "Payments" && (
          <Panel title="Payment timeline" description="Most recent first" bodyClassName="p-0">
            <ol className="divide-y divide-border">
              {STUDENT_PAYMENTS.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-4 px-6 py-5">
                  <span className="flex size-10 items-center justify-center rounded-md bg-success-soft text-success">
                    <Receipt className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{p.items}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.id} · {p.method} · recorded by {p.by}
                    </p>
                  </div>
                  <div className="text-right">
                    <Money value={p.amount} className="text-sm font-bold text-success" />
                    <p className="mt-1 text-xs text-muted-foreground">{p.date}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        )}

        {tab === "Purchases" && (
          <Panel title="Purchases" description="Books, uniforms and other items" bodyClassName="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Item", "Qty", "Unit price", "Total", "Date"].map((h) => (
                    <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {STUDENT_PURCHASES.map((p) => (
                  <tr key={p.item}>
                    <td className="px-6 py-4 font-medium">{p.item}</td>
                    <td className="num px-6 py-4">{p.qty}</td>
                    <td className="px-6 py-4"><Money value={p.unit} /></td>
                    <td className="px-6 py-4 font-semibold"><Money value={p.unit * p.qty} /></td>
                    <td className="px-6 py-4 text-muted-foreground">{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}

        {tab === "Notes" && (
          <Panel title="Internal notes" description="Visible to admin staff only">
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-background p-5">
                <p className="text-sm">
                  Guardian requested to pay the balance in two instalments before the end of term.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Mrs. Grace Adeyemi · 12 Feb 2026</p>
              </div>
              <textarea
                rows={4}
                placeholder="Add a note about this student…"
                className="w-full rounded-md border border-input bg-background p-4 text-sm outline-none focus:border-primary"
              />
              <button className="flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-deep">
                <StickyNote className="size-4" /> Save note
              </button>
            </div>
          </Panel>
        )}

        {tab === "Documents" && (
          <Panel title="Documents">
            <EmptyState
              icon={<Upload className="size-5" />}
              title="No documents uploaded"
              description="Attach birth certificates, transfer letters or signed fee agreements."
              action={
                <button className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-deep">
                  Upload document
                </button>
              }
            />
          </Panel>
        )}
      </div>
    </AppShell>
  );
}

function SummaryTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "gold" | "success" | "danger";
}) {
  const cls = {
    neutral: "bg-muted",
    gold: "bg-gold-soft",
    success: "bg-success-soft",
    danger: "bg-danger-soft",
  }[tone];
  return (
    <div className={`rounded-md p-5 ${cls}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="num mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}
