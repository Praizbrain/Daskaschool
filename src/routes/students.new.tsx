import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/fin/app-shell";
import { PageHeader, Panel, StatusBadge } from "@/components/fin/primitives";
import { CLASSES, naira } from "@/lib/school-data";

export const Route = createFileRoute("/students/new")({
  head: () => ({
    meta: [
      { title: "Add student — Divine Sources Finance OS" },
      {
        name: "description",
        content:
          "Enrol a new student in six guided steps: bio data, guardian, class, fee structure, discount and review.",
      },
      { property: "og:title", content: "Add student — Divine Sources Finance OS" },
      {
        property: "og:description",
        content: "Guided enrolment with automatic fee and discount calculation.",
      },
    ],
  }),
  component: AddStudent,
});

const STEPS = ["Bio data", "Guardian", "Class", "Fee structure", "Discount", "Review"] as const;

function AddStudent() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "Female",
    dob: "",
    address: "",
    guardian: "",
    relationship: "Parent",
    phone: "",
    email: "",
    className: CLASSES[0].name,
    fee: 118_000,
    extras: 12_000,
    discount: 0,
    discountReason: "None",
  });

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));
  const expected = form.fee + form.extras - form.discount;

  return (
    <AppShell>
      <Link
        to="/students"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to students
      </Link>

      <div className="mt-5">
        <PageHeader title="Add a new student" subtitle="Six short steps. Nothing is saved until you submit." />
      </div>

      <Panel className="mt-8" bodyClassName="p-5">
        <ol className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex-1">
              <button
                onClick={() => setStep(i)}
                className={`flex w-full items-center gap-2.5 rounded-md px-3 py-3 text-left text-xs font-semibold transition-colors ${
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                      ? "bg-primary-soft text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-current text-[11px]">
                  {i < step ? <Check className="size-3" /> : i + 1}
                </span>
                <span className="truncate">{s}</span>
              </button>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel className="mt-6" title={STEPS[step]} bodyClassName="p-8">
        {step === 0 && (
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="First name" value={form.firstName} onChange={(v) => set("firstName", v)} placeholder="Chiamaka" />
            <Field label="Surname" value={form.lastName} onChange={(v) => set("lastName", v)} placeholder="Okonkwo" />
            <SelectField label="Gender" value={form.gender} onChange={(v) => set("gender", v)} options={["Female", "Male"]} />
            <Field label="Date of birth" value={form.dob} onChange={(v) => set("dob", v)} placeholder="12 / 03 / 2011" />
            <div className="sm:col-span-2">
              <Field label="Home address" value={form.address} onChange={(v) => set("address", v)} placeholder="Ketu, Lagos" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Guardian full name" value={form.guardian} onChange={(v) => set("guardian", v)} placeholder="Mr. Emeka Okonkwo" />
            <SelectField
              label="Relationship"
              value={form.relationship}
              onChange={(v) => set("relationship", v)}
              options={["Parent", "Guardian", "Sponsor", "Relative"]}
            />
            <Field label="Phone number" value={form.phone} onChange={(v) => set("phone", v)} placeholder="+234 803 000 0000" />
            <Field label="Email address" value={form.email} onChange={(v) => set("email", v)} placeholder="guardian@gmail.com" />
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {CLASSES.map((c) => (
              <button
                key={c.id}
                onClick={() => set("className", c.name)}
                className={`rounded-md border p-5 text-left transition-colors ${
                  form.className === c.name ? "border-primary bg-primary-soft" : "border-border hover:bg-muted"
                }`}
              >
                <p className="text-sm font-bold">{c.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.section} · {c.students} students
                </p>
                <p className="mt-3 text-xs text-muted-foreground">Class teacher: {c.teacher}</p>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-6 sm:grid-cols-2">
            <NumberField label="Term school fee" value={form.fee} onChange={(v) => set("fee", v)} />
            <NumberField label="Extra charges (exam, lesson, items)" value={form.extras} onChange={(v) => set("extras", v)} />
            <div className="sm:col-span-2 rounded-md bg-muted p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Expected revenue from this student
              </p>
              <p className="num mt-2 text-2xl font-bold">{naira(form.fee + form.extras)}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Fee {naira(form.fee)} + extra charges {naira(form.extras)}
              </p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-6 sm:grid-cols-2">
            <NumberField label="Discount amount" value={form.discount} onChange={(v) => set("discount", v)} />
            <SelectField
              label="Discount reason"
              value={form.discountReason}
              onChange={(v) => set("discountReason", v)}
              options={["None", "Staff child", "Sibling discount", "Scholarship", "Owner's approval"]}
            />
            <div className="sm:col-span-2 rounded-md bg-gold-soft p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payable after discount
              </p>
              <p className="num mt-2 text-2xl font-bold">{naira(expected)}</p>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <Review label="Student" value={`${form.firstName || "—"} ${form.lastName}`} />
              <Review label="Gender" value={form.gender} />
              <Review label="Date of birth" value={form.dob || "—"} />
              <Review label="Address" value={form.address || "—"} />
              <Review label="Guardian" value={form.guardian || "—"} />
              <Review label="Guardian phone" value={form.phone || "—"} />
              <Review label="Class" value={form.className} />
              <Review label="Term fee" value={naira(form.fee)} />
              <Review label="Extra charges" value={naira(form.extras)} />
              <Review label="Discount" value={`${naira(form.discount)} (${form.discountReason})`} />
              <Review label="Expected revenue" value={naira(expected)} />
              <Review label="Status on enrolment" value={<StatusBadge tone="danger">Owing</StatusBadge>} />
            </div>
            <div className="rounded-md border border-primary/30 bg-primary-soft p-6 text-sm text-primary">
              Submitting adds {naira(expected)} to the term's expected revenue and updates the collection target immediately.
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex h-11 items-center gap-2 rounded-md border border-border px-5 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-40"
          >
            <ArrowLeft className="size-4" /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-deep"
            >
              Continue <ArrowRight className="size-4" />
            </button>
          ) : (
            <Link
              to="/students"
              onClick={() => toast.success("Student enrolled", { description: "Expected revenue updated." })}
              className="flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-deep"
            >
              <Check className="size-4" /> Enrol student
            </Link>
          )}
        </div>
      </Panel>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <div className="relative mt-2">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="num h-12 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm outline-none transition-colors focus:border-primary"
        />
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function Review({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="num mt-1.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
