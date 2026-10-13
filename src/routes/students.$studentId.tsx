import { PageLoadingSkeleton } from "@/components/fin/loading-skeleton";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, ArrowLeft, Check, Phone, Plus, Receipt, Trash2, X } from "lucide-react";
import { toast } from "sonner";
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
import { naira, pct } from "@/lib/school-data";
import { useAuth } from "@/hooks/use-auth";
import { usePaymentModal } from "@/context/payment-modal-context";
import {
  useClassOptions,
  useRemoveStudent,
  useStudent,
  useStudentPayments,
  useUpdateStudent,
} from "@/hooks/use-students";
import type { ClassOption } from "@/lib/students-data";

export const Route = createFileRoute("/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student profile — DaskaSchool" },
      {
        name: "description",
        content: "Student fee summary, guardian details and full payment history.",
      },
    ],
  }),
  component: StudentProfile,
});

const TABS = ["Overview", "Edit", "Payments"] as const;

function StudentProfile() {
  const { openPaymentModal } = usePaymentModal();
  const { studentId } = useParams({ from: "/students/$studentId" });
  const { data: student, isLoading, error } = useStudent(studentId);
  const { data: payments, isLoading: paymentsLoading } = useStudentPayments(studentId);
  const { profile } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { data: classOptions } = useClassOptions();

  const isSuperAdmin = profile?.role === "super_admin";

  if (isLoading) {
    return (
      <AppShell>
        <PageLoadingSkeleton metricCards={4} showTable={false} />
      </AppShell>
    );
  }

  if (error || !student) {
    return (
      <AppShell>
        <Panel>
          <EmptyState
            title="Student not found"
            description="This student record may have been removed."
            action={
              <Link
                to="/students"
                className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Back to students
              </Link>
            }
          />
        </Panel>
      </AppShell>
    );
  }

  const completion = pct(student.paid, student.expected);

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <Link
          to="/students"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to students
        </Link>

        {isSuperAdmin && (
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="flex h-9 items-center gap-2 rounded-md border border-destructive/30 px-3 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" /> Delete student
          </button>
        )}
      </div>

      <Panel className="mt-5" bodyClassName="p-8">
        <div className="flex flex-wrap items-start gap-6">
          <InitialAvatar name={student.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{student.name}</h1>
              <StatusBadge tone={paymentTone(student.status)}>{student.status}</StatusBadge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {student.admissionNo} · {student.className} ({student.section})
              {student.joined ? ` · Joined ${student.joined}` : ""}
            </p>
            {student.guardianPhone !== "—" && (
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Phone className="size-4" /> {student.guardianPhone}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => openPaymentModal(student.id)}
            className="flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-deep"
          >
            <Plus className="size-4" /> Record payment
          </button>
        </div>

        <div className="mt-8 grid gap-5 border-t border-border pt-8 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryTile label="Term fee" value={naira(student.fee)} />
          <SummaryTile label="Discount applied" value={naira(student.discount)} tone="gold" />
          <SummaryTile label="Total paid" value={naira(student.paid)} tone="success" />
          <SummaryTile
            label="Outstanding balance"
            value={naira(student.outstanding)}
            tone="danger"
          />
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between text-sm">
            <p className="font-semibold">Payment completion</p>
            <p className="num font-bold">{completion}%</p>
          </div>
          <ProgressBar className="mt-3" value={completion} />
          <p className="mt-2 text-xs text-muted-foreground">
            {naira(student.paid)} paid of {naira(student.expected)} payable after discount
          </p>
        </div>
      </Panel>

      <div className="mt-6 flex flex-wrap gap-1 rounded-md border border-border bg-card p-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
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
        {tab === "Overview" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Student information">
              <dl className="grid gap-6 sm:grid-cols-2">
                <KeyValue label="Full name" value={student.name} />
                <KeyValue label="Admission number" value={student.admissionNo} />
                <KeyValue label="Gender" value={student.gender ?? "—"} />
                <KeyValue label="Date of birth" value={student.dob ?? "—"} />
                <KeyValue label="Current class" value={student.className} />
                <KeyValue label="Section" value={student.section} />
                <KeyValue label="Home address" value={student.address ?? "—"} />
                <KeyValue label="Enrolled" value={student.joined ?? "—"} />
              </dl>
            </Panel>
            <Panel title="Guardian details">
              <dl className="grid gap-6 sm:grid-cols-2">
                <KeyValue label="Guardian name" value={student.guardian} />
                <KeyValue label="Phone number" value={student.guardianPhone} />
              </dl>
            </Panel>
          </div>
        )}

        {tab === "Edit" && (
          <EditStudentForm
            studentId={studentId}
            defaultValues={{
              fullName: student.name,
              classId: student.id
                ? (classOptions?.find(
                    (c) => c.name === student.className && c.section === student.section,
                  )?.id ?? "")
                : "",
              gender: student.gender ?? "",
              dob: student.dob ?? "",
              address: student.address ?? "",
              guardianName: student.guardian === "—" ? "" : student.guardian,
              guardianPhone: student.guardianPhone === "—" ? "" : student.guardianPhone,
            }}
            classOptions={classOptions ?? []}
            onSaved={() => setTab("Overview")}
          />
        )}

        {tab === "Payments" && (
          <Panel title="Payment timeline" description="Most recent first" bodyClassName="p-0">
            {paymentsLoading ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                Loading payments…
              </p>
            ) : !payments || payments.length === 0 ? (
              <EmptyState
                icon={<Receipt className="size-5" />}
                title="No payments yet"
                description="Payments recorded for this student will show up here."
              />
            ) : (
              <ol className="divide-y divide-border">
                {payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-4 px-6 py-5">
                    <span className="flex size-10 items-center justify-center rounded-md bg-success-soft text-success">
                      <Receipt className="size-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{p.items}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.method} · recorded by {p.receivedBy}
                      </p>
                    </div>
                    <div className="text-right">
                      <Money value={p.amount} className="text-sm font-bold text-success" />
                      <p className="mt-1 text-xs text-muted-foreground">{p.date}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        )}
      </div>

      {showDeleteDialog && (
        <DeleteStudentDialog
          studentName={student.name}
          studentId={student.id}
          hasPayments={(payments?.length ?? 0) > 0}
          myStaffId={profile?.staff_id ?? null}
          onClose={() => setShowDeleteDialog(false)}
        />
      )}
    </AppShell>
  );
}

function DeleteStudentDialog({
  studentName,
  studentId,
  hasPayments,
  myStaffId,
  onClose,
}: {
  studentName: string;
  studentId: string;
  hasPayments: boolean;
  myStaffId: string | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const removeStudent = useRemoveStudent();
  const [typedId, setTypedId] = useState("");
  const [attempted, setAttempted] = useState(false);

  const staffIdMissing = myStaffId === null;
  const idMatches = !staffIdMissing && typedId.trim().toUpperCase() === myStaffId.toUpperCase();

  const handleConfirm = async () => {
    setAttempted(true);
    if (!idMatches) return;

    try {
      const result = await removeStudent.mutateAsync(studentId);
      if (result === "archived") {
        toast.success("Student archived", {
          description:
            "This student has payment history, so their record was archived rather than deleted — nothing was lost.",
        });
      } else {
        toast.success("Student deleted");
      }
      navigate({ to: "/students" });
    } catch (err) {
      console.error("[students.$studentId/DeleteStudentDialog]", err);
      toast.error("Couldn't complete this action. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-bold">
                {hasPayments ? "Archive this student?" : "Delete this student?"}
              </h2>
              <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm">
          {hasPayments ? (
            <p>
              <strong>{studentName}</strong> has real payment history. To protect that financial
              record, this will <strong>archive</strong> the student instead of deleting them —
              they'll disappear from the active list, but their payment history is preserved.
            </p>
          ) : (
            <p>
              <strong>{studentName}</strong> has no payment history, so this will{" "}
              <strong>permanently delete</strong> their record. This cannot be recovered.
            </p>
          )}
        </div>

        <div className="mt-5">
          <label className="block">
            <span className="text-sm font-semibold">
              {staffIdMissing
                ? "Your Staff ID is not linked yet"
                : `Type your Staff ID to confirm (${myStaffId})`}
            </span>
            <input
              value={typedId}
              onChange={(e) => setTypedId(e.target.value)}
              placeholder="STF-XXXXXXXX"
              disabled={staffIdMissing}
              className="mt-2 h-11 w-full rounded-md border border-input bg-background px-4 font-mono text-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
          {staffIdMissing && (
            <p className="mt-1.5 text-xs text-destructive">
              The app could not find or create your linked staff record. Ask the developer to check
              the staff table and RLS policy.
            </p>
          )}
          {attempted && !staffIdMissing && !idMatches && (
            <p className="mt-1.5 text-xs text-destructive">
              That doesn't match your Staff ID. Please check and try again.
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="flex h-11 items-center rounded-md border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={removeStudent.isPending || staffIdMissing}
            className="flex h-11 items-center gap-2 rounded-md bg-destructive px-4 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-60"
          >
            <Trash2 className="size-4" />
            {removeStudent.isPending
              ? "Working…"
              : hasPayments
                ? "Archive student"
                : "Delete student"}
          </button>
        </div>
      </div>
    </div>
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
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="num mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}

// ─── Edit student form ────────────────────────────────────────────────────────

const editSchema = z.object({
  fullName: z.string().min(1, "Required"),
  classId: z.string().min(1, "Select a class"),
  gender: z.string().optional(),
  dob: z.string().optional(),
  address: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

function EditStudentForm({
  studentId,
  defaultValues,
  classOptions,
  onSaved,
}: {
  studentId: string;
  defaultValues: EditFormValues;
  classOptions: ClassOption[];
  onSaved: () => void;
}) {
  const updateStudent = useUpdateStudent(studentId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues,
  });

  const onSubmit = async (values: EditFormValues) => {
    try {
      await updateStudent.mutateAsync({
        fullName: values.fullName,
        classId: values.classId,
        guardianName: values.guardianName ?? "",
        guardianPhone: values.guardianPhone ?? "",
        gender: values.gender ?? "",
        dob: values.dob ?? "",
        address: values.address ?? "",
      });
      toast.success("Student updated");
      onSaved();
    } catch (err) {
      console.error("[students.$studentId/EditStudentForm/onSubmit]", err);
      toast.error("Couldn't save changes. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Panel title="Student information" bodyClassName="p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <EditField
            label="Full name"
            error={errors.fullName?.message}
            {...register("fullName")}
            placeholder="Chiamaka Okonkwo"
          />
          <EditSelectField
            label="Gender"
            {...register("gender")}
            options={["", "Female", "Male"]}
          />
          <EditField label="Date of birth" type="date" {...register("dob")} />
          <div className="sm:col-span-2">
            <EditField
              label="Home address"
              {...register("address")}
              placeholder="Ketu, Lagos"
            />
          </div>
        </div>
      </Panel>

      <Panel title="Guardian details" bodyClassName="p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <EditField
            label="Guardian full name"
            {...register("guardianName")}
            placeholder="Mr. Emeka Okonkwo"
          />
          <EditField
            label="Phone number"
            {...register("guardianPhone")}
            placeholder="+234 803 000 0000"
          />
        </div>
      </Panel>

      <Panel title="Class" bodyClassName="p-8">
        <label className="block">
          <span className="text-sm font-semibold">Class</span>
          <select
            {...register("classId")}
            className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
          >
            <option value="">Select a class</option>
            {classOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.section})
              </option>
            ))}
          </select>
          {errors.classId && (
            <p className="mt-1.5 text-xs text-destructive">{errors.classId.message}</p>
          )}
        </label>
      </Panel>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-12 items-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-deep disabled:opacity-60"
        >
          <Check className="size-4" />
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

const EditField = React.forwardRef<
  HTMLInputElement,
  { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>
>(function EditField({ label, error, ...props }, ref) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        ref={ref}
        {...props}
        className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
      />
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </label>
  );
});

const EditSelectField = React.forwardRef<
  HTMLSelectElement,
  { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>
>(function EditSelectField({ label, options, ...props }, ref) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <select
        ref={ref}
        {...props}
        className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "—"}
          </option>
        ))}
      </select>
    </label>
  );
});

