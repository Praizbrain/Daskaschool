import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ArrowLeft, Check, Printer, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/fin/app-shell";
import { InitialAvatar, Money, PageHeader, Panel, StatusBadge } from "@/components/fin/primitives";
import { BANK_ACCOUNTS, PAYMENT_ITEMS, STUDENTS, naira, outstanding } from "@/lib/school-data";

export const Route = createFileRoute("/finance/record-payment")({
  validateSearch: z.object({ student: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Record payment — Divine Sources Finance OS" },
      {
        name: "description",
        content:
          "Record a student payment, select outstanding items, choose payment method and generate a receipt.",
      },
      { property: "og:title", content: "Record payment — Divine Sources Finance OS" },
      { property: "og:description", content: "Fast payment entry with instant receipt generation." },
    ],
  }),
  component: RecordPayment,
});

function RecordPayment() {
  const { student: preselected } = Route.useSearch();
  const [query, setQuery] = useState("");
  const [studentId, setStudentId] = useState(preselected ?? STUDENTS[2].id);
  const [selected, setSelected] = useState<string[]>(["fees"]);
  const [method, setMethod] = useState("Transfer");
  const [account, setAccount] = useState(BANK_ACCOUNTS[0]);
  const [saved, setSaved] = useState(false);

  const student = STUDENTS.find((s) => s.id === studentId) ?? STUDENTS[0];
  const results = STUDENTS.filter((s) =>
    query ? s.name.toLowerCase().includes(query.toLowerCase()) : true,
  ).slice(0, 5);
  const total = PAYMENT_ITEMS.filter((i) => selected.includes(i.id)).reduce((s, i) => s + i.amount, 0);
  const receipt = "RCP-10489";

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <AppShell>
      <Link
        to="/finance"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to finance
      </Link>

      <div className="mt-5">
        <PageHeader title="Record a payment" subtitle="Takes less than a minute. A receipt is generated automatically." />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Panel title="1. Find the student">
            <label className="relative flex h-12 items-center">
              <Search className="pointer-events-none absolute left-4 size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a student name…"
                className="h-12 w-full rounded-md border border-input bg-background pl-11 pr-4 text-sm outline-none focus:border-primary"
              />
            </label>
            <ul className="mt-4 space-y-2">
              {results.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => setStudentId(s.id)}
                    className={`flex w-full items-center gap-4 rounded-md border px-4 py-3 text-left transition-colors ${
                      s.id === studentId ? "border-primary bg-primary-soft" : "border-border hover:bg-muted"
                    }`}
                  >
                    <InitialAvatar name={s.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{s.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {s.className} · {s.guardian}
                      </span>
                    </span>
                    <Money value={outstanding(s)} className="text-sm font-bold text-destructive" />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="2. Select outstanding items">
            <div className="grid gap-3 sm:grid-cols-2">
              {PAYMENT_ITEMS.map((i) => (
                <label
                  key={i.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-4 transition-colors ${
                    selected.includes(i.id) ? "border-primary bg-primary-soft" : "border-border hover:bg-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(i.id)}
                    onChange={() => toggle(i.id)}
                    className="size-4 accent-[color:var(--primary)]"
                  />
                  <span className="flex-1 text-sm font-semibold">{i.label}</span>
                  <Money value={i.amount} className="text-sm" />
                </label>
              ))}
              <label className="flex items-center gap-3 rounded-md border border-dashed border-border px-4 py-4">
                <span className="flex-1 text-sm font-semibold text-muted-foreground">Custom item</span>
                <input
                  placeholder="Amount"
                  className="num h-9 w-28 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>
          </Panel>

          <Panel title="3. Payment details">
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold">Amount received</span>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
                  <input
                    value={total.toLocaleString("en-NG")}
                    readOnly
                    className="num h-12 w-full rounded-md border border-input bg-muted pl-9 pr-4 text-sm font-bold outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold">Receipt number</span>
                <input
                  defaultValue={receipt}
                  className="num mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
                />
              </label>

              <div className="sm:col-span-2">
                <span className="text-sm font-semibold">Payment method</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["Cash", "Transfer", "POS"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      className={`h-11 rounded-md px-5 text-sm font-semibold transition-colors ${
                        method === m ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold">Bank account / till received into</span>
                <select
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
                >
                  {BANK_ACCOUNTS.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold">Notes (optional)</span>
                <textarea
                  rows={3}
                  placeholder="e.g. Balance promised before end of month"
                  className="mt-2 w-full rounded-md border border-input bg-background p-4 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>
          </Panel>
        </div>

        <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <Panel title={saved ? `Receipt ${receipt}` : "Receipt preview"}>
            <div className="rounded-md border border-border bg-background p-5">
              <p className="text-sm font-bold">Divine Sources Praiseland High School</p>
              <p className="mt-1 text-xs text-muted-foreground">Official payment receipt · {receipt}</p>
              <div className="mt-5 space-y-2 border-t border-border pt-4 text-xs">
                <Row label="Student" value={student.name} />
                <Row label="Class" value={student.className} />
                <Row label="Guardian" value={student.guardian} />
                <Row label="Method" value={method} />
                <Row label="Received into" value={account} />
              </div>
              <ul className="mt-4 space-y-2 border-t border-border pt-4 text-xs">
                {PAYMENT_ITEMS.filter((i) => selected.includes(i.id)).map((i) => (
                  <li key={i.id} className="flex justify-between">
                    <span className="text-muted-foreground">{i.label}</span>
                    <Money value={i.amount} className="font-semibold" />
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm font-bold">Total paid</span>
                <span className="num text-lg font-bold text-primary">{naira(total)}</span>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                New balance after this payment:{" "}
                <span className="font-semibold text-foreground">
                  {naira(Math.max(outstanding(student) - total, 0))}
                </span>
              </p>
              {saved && (
                <p className="mt-4">
                  <StatusBadge tone="success">
                    <Check className="size-3" /> Payment saved
                  </StatusBadge>
                </p>
              )}
            </div>

            <div className="mt-5 space-y-3">
              <button
                onClick={() => {
                  setSaved(true);
                  toast.success("Payment saved", {
                    description: `${naira(total)} recorded for ${student.name}. Collection progress updated.`,
                  });
                }}
                className="h-12 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-deep"
              >
                Save payment
              </button>
              <button
                onClick={() => toast.success(`Receipt ${receipt} generated`, { description: "Sent to the printer queue." })}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-border text-sm font-semibold transition-colors hover:bg-muted"
              >
                <Printer className="size-4" /> Generate receipt
              </button>
              <div className="flex gap-3">
                <Link
                  to="/dashboard"
                  className="flex h-11 flex-1 items-center justify-center rounded-md border border-border text-sm font-semibold hover:bg-muted"
                >
                  Dashboard
                </Link>
                <Link
                  to="/reports"
                  className="flex h-11 flex-1 items-center justify-center rounded-md border border-border text-sm font-semibold hover:bg-muted"
                >
                  Reports
                </Link>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-semibold">{value}</span>
    </div>
  );
}
