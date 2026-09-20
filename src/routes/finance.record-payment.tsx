import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Check, Plus, Printer, Search, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";
import { AppShell } from "@/components/fin/app-shell";
import { InitialAvatar, Money, PageHeader, Panel, StatusBadge } from "@/components/fin/primitives";
import { naira } from "@/lib/school-data";
import { useAuth } from "@/hooks/use-auth";
import { useStudents } from "@/hooks/use-students";
import { useRecordPayment } from "@/hooks/use-finance";
import { fetchStudentPaymentItems, type PaymentItem } from "@/lib/finance-data";

export const Route = createFileRoute("/finance/record-payment")({
  validateSearch: z.object({ student: z.string().optional() }),
  head: () => ({
    meta: [{ title: "Record payment — Divine Sources Finance OS" }],
  }),
  component: RecordPayment,
});

type SelectedItem = { id: string; label: string; amount: number; isCustom?: boolean };

function RecordPayment() {
  const { student: preselected } = Route.useSearch();
  const { profile } = useAuth();
  const { data: students, isLoading: studentsLoading } = useStudents();
  const recordPayment = useRecordPayment();

  const [query, setQuery] = useState("");
  const [studentId, setStudentId] = useState<string | null>(preselected ?? null);
  const [classId, setClassId] = useState<string | null>(null);
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [selected, setSelected] = useState<SelectedItem[]>([]);

  // Custom item add form
  const [customLabel, setCustomLabel] = useState("");
  const [customAmount, setCustomAmount] = useState<number | "">("");
  const [savingCustom, setSavingCustom] = useState(false);

  const [method, setMethod] = useState<"Cash" | "Transfer" | "POS">("Transfer");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState<{ receiptNo: string } | null>(null);

  const student = students?.find((s) => s.id === studentId) ?? null;

  // Load real class_id and items when student changes
  useEffect(() => {
    if (!student) {
      setItems([]);
      setSelected([]);
      setClassId(null);
      return;
    }
    setItemsLoading(true);
    supabase
      .from("students")
      .select("class_id")
      .eq("id", student.id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data?.class_id) {
          setItemsLoading(false);
          return;
        }
        setClassId(data.class_id);
        const fetched = await fetchStudentPaymentItems(data.class_id, student.section);
        setItems(fetched);
        setSelected([]);
        setItemsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id]);

  const results = useMemo(() => {
    if (!students) return [];
    const q = query.trim().toLowerCase();
    return students.filter((s) => !q || s.name.toLowerCase().includes(q)).slice(0, 5);
  }, [students, query]);

  const toggleItem = (item: PaymentItem) => {
    setSelected((prev) => {
      const exists = prev.find((s) => s.id === item.id);
      if (exists) return prev.filter((s) => s.id !== item.id);
      return [...prev, { id: item.id, label: item.label, amount: item.amount }];
    });
  };

  const updateSelectedAmount = (id: string, amount: number) => {
    setSelected((prev) => prev.map((s) => (s.id === id ? { ...s, amount } : s)));
  };

  const removeSelected = (id: string) => {
    setSelected((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddCustom = async () => {
    if (!customLabel.trim() || !customAmount || Number(customAmount) <= 0) {
      toast.error("Enter both a label and a positive amount.");
      return;
    }
    const label = customLabel.trim();
    const amount = Number(customAmount);
    const tempId = `custom-${Date.now()}`;

    // Add to selected immediately
    setSelected((prev) => [...prev, { id: tempId, label, amount, isCustom: true }]);

    // Save to class_fee_items so other students in this class see it as a suggestion
    if (classId) {
      setSavingCustom(true);
      const { error } = await supabase
        .from("class_fee_items")
        .upsert({ class_id: classId, label, amount }, { onConflict: "class_id,label" });
      if (error) {
        console.error("[record-payment/handleAddCustom]", error);
        // Don't block the user — the item is still in their selected list
      } else {
        // Refresh items so other students in this class see it
        const fetched = await fetchStudentPaymentItems(classId, student!.section);
        setItems(fetched);
      }
      setSavingCustom(false);
    }

    setCustomLabel("");
    setCustomAmount("");
    toast.success(`"${label}" added and saved for this class.`);
  };

  const total = selected.reduce((s, i) => s + i.amount, 0);

  const handleSave = async () => {
    if (!student || !profile) return;
    if (selected.length === 0) {
      toast.error("Select at least one item.");
      return;
    }
    try {
      const result = await recordPayment.mutateAsync({
        input: {
          studentId: student.id,
          items: selected.map((i) => ({ label: i.label, amount: i.amount })),
          method,
          note,
        },
        receivedBy: profile.id,
      });
      setSaved({ receiptNo: result.receiptNo });
      toast.success("Payment saved", {
        description: `${naira(total)} recorded for ${student.name}.`,
      });
    } catch (err) {
      console.error("[finance.record-payment/handleSave]", err);
      toast.error("Couldn't save this payment. Please try again.");
    }
  };

  if (studentsLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link
        to="/finance"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to finance
      </Link>

      <div className="mt-5">
        <PageHeader
          title="Record a payment"
          subtitle="Takes less than a minute. A receipt is generated automatically."
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* Step 1 */}
          <Panel title="1. Find the student">
            <label className="relative flex h-12 items-center">
              <Search className="pointer-events-none absolute left-4 size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a student name…"
                disabled={saved !== null}
                className="h-12 w-full rounded-md border border-input bg-background pl-11 pr-4 text-sm outline-none focus:border-primary disabled:opacity-60"
              />
            </label>
            {query.length > 0 &&
              (results.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No students match that search.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {results.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => {
                          setStudentId(s.id);
                          setQuery("");
                        }}
                        disabled={saved !== null}
                        className={`flex w-full items-center gap-4 rounded-md border px-4 py-3 text-left transition-colors disabled:opacity-60 ${
                          s.id === studentId
                            ? "border-primary bg-primary-soft"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <InitialAvatar name={s.name} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{s.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {s.className} · {s.guardian}
                          </span>
                        </span>
                        <Money
                          value={s.outstanding}
                          className="text-sm font-bold text-destructive"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              ))}
            {student && (
              <div className="mt-4 flex items-center gap-4 rounded-md border border-primary bg-primary-soft px-4 py-3">
                <InitialAvatar name={student.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{student.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {student.className} · Outstanding: {naira(student.outstanding)}
                  </span>
                </span>
                {!saved && (
                  <button
                    onClick={() => {
                      setStudentId(null);
                      setSelected([]);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            )}
          </Panel>

          {/* Step 2 */}
          <Panel title={`2. Select items${student ? ` for ${student.className}` : ""}`}>
            {!student ? (
              <p className="text-sm text-muted-foreground">Select a student first.</p>
            ) : itemsLoading ? (
              <p className="text-sm text-muted-foreground">Loading fee items…</p>
            ) : (
              <>
                {items.length === 0 ? (
                  <p className="mb-4 text-sm text-muted-foreground">
                    No fee items set up for this class yet. Use "Add custom item" below, or ask a
                    Super Admin to set fees via Classes → Edit fees.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((i) => {
                      const sel = selected.find((s) => s.id === i.id);
                      return (
                        <div
                          key={i.id}
                          className={`rounded-md border px-4 py-4 transition-colors ${
                            sel ? "border-primary bg-primary-soft" : "border-border"
                          } ${saved !== null ? "opacity-60" : ""}`}
                        >
                          <label className="flex cursor-pointer items-start gap-3">
                            <input
                              type="checkbox"
                              checked={!!sel}
                              onChange={() => toggleItem(i)}
                              disabled={saved !== null}
                              className="mt-0.5 size-4 accent-[color:var(--primary)]"
                            />
                            <span className="flex-1">
                              <span className="block text-sm font-semibold">{i.label}</span>
                              {i.source === "class-override" && (
                                <span className="text-[10px] text-muted-foreground">
                                  Class price
                                </span>
                              )}
                            </span>
                            <Money
                              value={sel ? sel.amount : i.amount}
                              className="text-sm font-semibold"
                            />
                          </label>
                          {sel && (
                            <div className="mt-3 flex items-center gap-2 pl-7">
                              <span className="text-xs text-muted-foreground">Adjust:</span>
                              <input
                                type="number"
                                value={sel.amount}
                                onChange={(e) => updateSelectedAmount(i.id, Number(e.target.value))}
                                className="num h-8 w-28 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-primary"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add custom item */}
                <div className="mt-5 rounded-md border border-dashed border-border p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Add custom item — saves to this class for future students
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <input
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="Item name e.g. Club Wear"
                      disabled={saved !== null || savingCustom}
                      className="h-11 flex-1 rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary disabled:opacity-60"
                    />
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) =>
                        setCustomAmount(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      placeholder="Amount (₦)"
                      disabled={saved !== null || savingCustom}
                      className="num h-11 w-36 rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary disabled:opacity-60"
                    />
                    <button
                      onClick={handleAddCustom}
                      disabled={
                        !customLabel.trim() || !customAmount || saved !== null || savingCustom
                      }
                      className="flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      <Plus className="size-4" /> {savingCustom ? "Saving…" : "Add"}
                    </button>
                  </div>
                </div>

                {/* Selected summary */}
                {selected.length > 0 && (
                  <div className="mt-5 rounded-md border border-border bg-muted/40 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Selected items ({selected.length})
                    </p>
                    <ul className="space-y-2">
                      {selected.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-4">
                          <span className="flex-1 text-sm">{s.label}</span>
                          <Money value={s.amount} className="text-sm font-semibold" />
                          <button
                            onClick={() => removeSelected(s.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="size-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                      <span className="text-sm font-bold">Total</span>
                      <span className="num text-lg font-bold text-primary">{naira(total)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </Panel>

          {/* Step 3 */}
          <Panel title="3. Payment details">
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold">Amount received</span>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ₦
                  </span>
                  <input
                    value={total > 0 ? total.toLocaleString("en-NG") : "0"}
                    readOnly
                    className="num h-12 w-full rounded-md border border-input bg-muted pl-9 pr-4 text-sm font-bold outline-none"
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Auto-calculated from selected items.
                </p>
              </label>

              <div>
                <span className="text-sm font-semibold">Payment method</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["Cash", "Transfer", "POS"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      disabled={saved !== null}
                      className={`h-11 rounded-md px-5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                        method === m
                          ? "bg-primary text-primary-foreground"
                          : "border border-border hover:bg-muted"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold">Notes (optional)</span>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={saved !== null}
                  placeholder="e.g. Balance promised before end of month"
                  className="mt-2 w-full rounded-md border border-input bg-background p-4 text-sm outline-none focus:border-primary disabled:opacity-60"
                />
              </label>
            </div>
          </Panel>
        </div>

        {/* Receipt panel */}
        <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <Panel title={saved ? `Receipt ${saved.receiptNo}` : "Receipt preview"}>
            {!student ? (
              <p className="text-sm text-muted-foreground">
                Select a student to preview the receipt.
              </p>
            ) : (
              <div
                className="rounded-md border border-border bg-background p-5 text-sm"
                id="receipt-content"
              >
                <p className="font-bold">Divine Sources Praiseland High School</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Official payment receipt{saved ? ` · ${saved.receiptNo}` : " (preview)"}
                </p>
                <div className="mt-5 space-y-2 border-t border-border pt-4 text-xs">
                  <Row label="Student" value={student.name} />
                  <Row label="Class" value={student.className} />
                  <Row label="Guardian" value={student.guardian} />
                  <Row label="Method" value={method} />
                </div>
                {selected.length > 0 && (
                  <ul className="mt-4 space-y-2 border-t border-border pt-4 text-xs">
                    {selected.map((i, idx) => (
                      <li key={`${i.id}-${idx}`} className="flex justify-between">
                        <span className="text-muted-foreground">{i.label}</span>
                        <Money value={i.amount} className="font-semibold" />
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="font-bold">Total paid</span>
                  <span className="num text-lg font-bold text-primary">{naira(total)}</span>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Balance after this payment:{" "}
                  <span className="font-semibold text-foreground">
                    {naira(Math.max(student.outstanding - total, 0))}
                  </span>
                </p>
                {saved && (
                  <p className="mt-4">
                    <StatusBadge tone="success">
                      <Check className="mr-1 inline size-3" /> Payment saved
                    </StatusBadge>
                  </p>
                )}
              </div>
            )}

            <div className="mt-5 space-y-3">
              {!saved ? (
                <button
                  onClick={handleSave}
                  disabled={!student || recordPayment.isPending || total === 0}
                  className="h-12 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-deep disabled:opacity-60"
                >
                  {recordPayment.isPending ? "Saving…" : "Save payment"}
                </button>
              ) : (
                <button
                  onClick={() => window.print()}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-border text-sm font-semibold transition-colors hover:bg-muted"
                >
                  <Printer className="size-4" /> Print / Save receipt
                </button>
              )}
              <div className="flex gap-3">
                <Link
                  to="/dashboard"
                  className="flex h-11 flex-1 items-center justify-center rounded-md border border-border text-sm font-semibold hover:bg-muted"
                >
                  Dashboard
                </Link>
                <Link
                  to="/finance"
                  className="flex h-11 flex-1 items-center justify-center rounded-md border border-border text-sm font-semibold hover:bg-muted"
                >
                  Finance
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
