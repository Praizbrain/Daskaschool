import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, Plus, Printer, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useStudents } from "@/hooks/use-students";
import { useAuth } from "@/hooks/use-auth";
import { useRecordPayment } from "@/hooks/use-finance";
import { fetchStudentPaymentItems, type PaymentItem } from "@/lib/finance-data";
import { supabase } from "@/lib/supabase-client";
import { naira } from "@/lib/school-data";

type PaymentModalProps = { isOpen: boolean; studentId: string | null; onClose: () => void };
type Method = "Cash" | "Transfer" | "POS";
type FeeEntry = {
  key: string;
  itemId: string;
  label: string;
  total: number;
  amount: number;
  allowInstallment: boolean;
  isCustom: boolean;
  customLabel: string;
};
type Receipt = { receiptNo: string };

function newFeeEntry(): FeeEntry {
  return {
    key: crypto.randomUUID(),
    itemId: "",
    label: "",
    total: 0,
    amount: 0,
    allowInstallment: false,
    isCustom: false,
    customLabel: "",
  };
}

export function PaymentModal({ isOpen, studentId: initialStudentId, onClose }: PaymentModalProps) {
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { profile } = useAuth();
  const recordPayment = useRecordPayment();
  const [stage, setStage] = useState(1);
  const [studentId, setStudentId] = useState<string | null>(initialStudentId);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [fees, setFees] = useState<FeeEntry[]>([newFeeEntry()]);
  const [method, setMethod] = useState<Method | null>(null);
  const [reminderOn, setReminderOn] = useState(false);
  const [remindOn, setRemindOn] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const student = students.find((entry) => entry.id === studentId) ?? null;
  const total = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const remaining = Math.max((student?.outstanding ?? 0) - total, 0);
  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students
      .filter((entry) => !query || entry.name.toLowerCase().includes(query))
      .slice(0, 6);
  }, [search, students]);

  const reset = () => {
    setStage(1);
    setStudentId(null);
    setSearch("");
    setItems([]);
    setFees([newFeeEntry()]);
    setMethod(null);
    setReminderOn(false);
    setRemindOn("");
    setReminderNote("");
    setReceipt(null);
  };

  useEffect(() => {
    if (!isOpen) return;
    reset();
    setStudentId(initialStudentId);
  }, [isOpen, initialStudentId]);

  useEffect(() => {
    if (!student) {
      setItems([]);
      return;
    }
    const load = async () => {
      setLoadingItems(true);
      try {
        const { data, error } = await supabase
          .from("students")
          .select("class_id")
          .eq("id", student.id)
          .maybeSingle();
        if (error) throw error;
        if (!data?.class_id) {
          setItems([]);
          return;
        }
        setItems(await fetchStudentPaymentItems(data.class_id, student.section));
      } catch (error) {
        console.error("[PaymentModal/loadItems]", error);
        toast.error("Couldn't load this student's fees. Please try again.");
      } finally {
        setLoadingItems(false);
      }
    };
    void load();
  }, [student?.id, student?.section]);

  if (!isOpen) return null;

  const updateFee = (key: string, change: Partial<FeeEntry>) =>
    setFees((current) => current.map((fee) => (fee.key === key ? { ...fee, ...change } : fee)));
  const selectFee = (key: string, value: string) => {
    if (value === "custom") {
      updateFee(key, {
        itemId: "custom",
        label: "",
        total: 0,
        amount: 0,
        allowInstallment: true,
        isCustom: true,
      });
      return;
    }
    const item = items.find((candidate) => candidate.id === value);
    if (item)
      updateFee(key, {
        itemId: item.id,
        label: item.label,
        total: item.amount,
        amount: item.amount,
        allowInstallment: item.allowInstallment,
        isCustom: false,
      });
  };
  const review = () => {
    if (!student) {
      toast.error("Select a student first.");
      return;
    }
    if (!fees.some((fee) => fee.label.trim() && fee.amount > 0)) {
      toast.error("Select at least one fee with a positive amount.");
      return;
    }
    if (!method) {
      toast.error("Select a payment method.");
      return;
    }
    if (reminderOn && !remindOn) {
      toast.error("Choose a reminder date.");
      return;
    }
    setStage(2);
  };
  const confirm = async () => {
    if (!student || !profile || !method) return;
    const paidFees = fees.filter((fee) => fee.label.trim() && fee.amount > 0);
    try {
      const saved = await recordPayment.mutateAsync({
        input: {
          studentId: student.id,
          items: paidFees.map((fee) => ({ label: fee.label, amount: fee.amount })),
          method,
          note: "",
        },
        receivedBy: profile.id,
      });
      if (reminderOn) {
        const { error } = await supabase.from("payment_reminders").insert({
          student_id: student.id,
          fee_label: paidFees.map((fee) => fee.label).join(", "),
          outstanding_amount: remaining,
          remind_on: remindOn,
          note: reminderNote || null,
          created_by: profile.id,
        });
        if (error) {
          console.error("[PaymentModal/createReminder]", error);
          toast.warning("Payment was recorded, but the reminder could not be saved.");
        }
      }
      setReceipt({ receiptNo: saved.receiptNo });
      setStage(3);
      toast.success("Payment recorded.");
    } catch (error) {
      console.error("[PaymentModal/confirm]", error);
      toast.error("Couldn't record this payment. Please try again.");
    }
  };
  const done = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end bg-foreground/40 sm:items-center sm:justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Record payment"
    >
      <div className="flex max-h-[95dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-card shadow-xl sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-bold">Record payment</p>
            <p className="text-xs text-muted-foreground">Step {stage} of 3</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(stage / 3) * 100}%` }}
          />
        </div>
        <div className="overflow-y-auto p-5 sm:p-7">
          {stage === 1 && (
            <div className="space-y-6">
              <section>
                <h2 className="text-base font-bold">Student</h2>
                {student ? (
                  <div className="mt-3 flex items-center justify-between rounded-md border border-primary bg-primary-soft p-4">
                    <div>
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.className} · Outstanding {naira(student.outstanding)}
                      </p>
                    </div>
                    {!initialStudentId && (
                      <button onClick={() => setStudentId(null)} className="text-muted-foreground">
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <label className="relative mt-3 block">
                      <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search for a student"
                        className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none focus:border-primary"
                      />
                    </label>
                    {search && (
                      <div className="mt-2 divide-y divide-border rounded-md border border-border">
                        {studentsLoading ? (
                          <p className="p-3 text-sm text-muted-foreground">Loading students...</p>
                        ) : (
                          results.map((entry) => (
                            <button
                              key={entry.id}
                              onClick={() => {
                                setStudentId(entry.id);
                                setSearch("");
                              }}
                              className="block w-full px-3 py-3 text-left hover:bg-muted"
                            >
                              <p className="text-sm font-semibold">{entry.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {entry.className} · {naira(entry.outstanding)} outstanding
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </section>
              {student && (
                <section>
                  <h2 className="text-base font-bold">Fees being paid</h2>
                  {loadingItems ? (
                    <p className="mt-3 text-sm text-muted-foreground">Loading fees...</p>
                  ) : (
                    <div className="mt-3 space-y-4">
                      {fees.map((fee, index) => (
                        <div key={fee.key} className="rounded-md border border-border p-4">
                          <div className="flex gap-2">
                            <select
                              value={fee.isCustom ? "custom" : fee.itemId}
                              onChange={(event) => selectFee(fee.key, event.target.value)}
                              className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                            >
                              <option value="">Select fee to pay for</option>
                              {items.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.label} ({naira(item.amount)})
                                </option>
                              ))}
                              <option value="custom">Custom fee</option>
                            </select>
                            {fees.length > 1 && (
                              <button
                                onClick={() =>
                                  setFees((current) =>
                                    current.filter((entry) => entry.key !== fee.key),
                                  )
                                }
                                className="text-muted-foreground"
                              >
                                <X className="size-4" />
                              </button>
                            )}
                          </div>
                          {fee.isCustom && (
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <input
                                value={fee.customLabel}
                                onChange={(event) =>
                                  updateFee(fee.key, {
                                    customLabel: event.target.value,
                                    label: event.target.value,
                                  })
                                }
                                placeholder="Fee name"
                                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                              />
                              <input
                                type="number"
                                min="0"
                                value={fee.amount || ""}
                                onChange={(event) =>
                                  updateFee(fee.key, { amount: Number(event.target.value) })
                                }
                                placeholder="Amount"
                                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                              />
                            </div>
                          )}
                          {fee.itemId && !fee.isCustom && (
                            <div className="mt-3">
                              {fee.allowInstallment ? (
                                <>
                                  <div className="flex flex-wrap gap-2">
                                    {[100, 70, 50, 20].map((percent) => (
                                      <button
                                        key={percent}
                                        onClick={() =>
                                          updateFee(fee.key, {
                                            amount: Math.round((fee.total * percent) / 100),
                                          })
                                        }
                                        className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                                      >
                                        {percent}%
                                      </button>
                                    ))}
                                    <button
                                      onClick={() => updateFee(fee.key, { amount: 0 })}
                                      className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                                    >
                                      Custom
                                    </button>
                                  </div>
                                  <input
                                    type="number"
                                    min="0"
                                    value={fee.amount || ""}
                                    onChange={(event) =>
                                      updateFee(fee.key, { amount: Number(event.target.value) })
                                    }
                                    className="mt-3 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                  />
                                </>
                              ) : (
                                <input
                                  readOnly
                                  value={naira(fee.total)}
                                  className="mt-3 h-10 w-full rounded-md border border-input bg-muted px-3 text-sm font-semibold"
                                />
                              )}
                              <p className="mt-3 text-xs text-muted-foreground">
                                Fee: {naira(fee.total)} | This payment: {naira(fee.amount)} |
                                Remaining: {naira(Math.max(fee.total - fee.amount, 0))}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => setFees((current) => [...current, newFeeEntry()])}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                      >
                        <Plus className="size-4" /> Add another fee
                      </button>
                    </div>
                  )}
                </section>
              )}
              {student && (
                <section>
                  <h2 className="text-base font-bold">Payment method</h2>
                  <div className="mt-3 flex gap-2">
                    {(["Cash", "Transfer", "POS"] as Method[]).map((entry) => (
                      <button
                        key={entry}
                        onClick={() => setMethod(entry)}
                        className={`h-10 rounded-md px-4 text-sm font-semibold ${method === entry ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}
                      >
                        {entry}
                      </button>
                    ))}
                  </div>
                </section>
              )}
              {student && (
                <section className="rounded-md border border-border p-4">
                  <label className="flex items-center gap-3 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={reminderOn}
                      onChange={(event) => setReminderOn(event.target.checked)}
                      className="size-4 accent-[color:var(--primary)]"
                    />
                    Set a payment reminder
                  </label>
                  {reminderOn && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <input
                        type="date"
                        value={remindOn}
                        onChange={(event) => setRemindOn(event.target.value)}
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      />
                      <input
                        value={reminderNote}
                        onChange={(event) => setReminderNote(event.target.value)}
                        placeholder="Reminder note (optional)"
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      />
                    </div>
                  )}
                </section>
              )}
              <button
                onClick={review}
                className="h-11 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground"
              >
                Review payment
              </button>
            </div>
          )}
          {stage === 2 && student && method && (
            <div className="space-y-6">
              <section className="rounded-md border border-border p-5">
                <h2 className="text-lg font-bold">Payment summary</h2>
                <dl className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Student</dt>
                    <dd className="font-semibold">{student.name}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Class</dt>
                    <dd className="font-semibold">{student.className}</dd>
                  </div>
                </dl>
                <p className="mt-6 text-xs font-bold tracking-wider text-muted-foreground">
                  FEES BEING PAID
                </p>
                <div className="mt-3 space-y-3">
                  {fees
                    .filter((fee) => fee.label && fee.amount > 0)
                    .map((fee) => (
                      <div key={fee.key}>
                        <div className="flex justify-between gap-4 text-sm">
                          <span>{fee.label}</span>
                          <span className="font-semibold">{naira(fee.amount)}</span>
                        </div>
                        {fee.amount < fee.total && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            ({Math.round((fee.amount / fee.total) * 100)}% of {naira(fee.total)},{" "}
                            {naira(fee.total - fee.amount)} remaining)
                          </p>
                        )}
                      </div>
                    ))}
                </div>
                <div className="mt-5 border-t border-border pt-4">
                  <p className="flex justify-between font-bold">
                    <span>Total this payment</span>
                    <span>{naira(total)}</span>
                  </p>
                  <p className="mt-3 text-sm">
                    Payment method: <span className="font-semibold">{method}</span>
                  </p>
                  {reminderOn && (
                    <p className="mt-2 text-sm">
                      Reminder set for{" "}
                      <span className="font-semibold">
                        {new Date(`${remindOn}T00:00:00`).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </p>
                  )}
                </div>
              </section>
              <div className="flex gap-3">
                <button
                  onClick={() => setStage(1)}
                  className="h-11 flex-1 rounded-md border border-border text-sm font-semibold"
                >
                  <ChevronLeft className="mr-1 inline size-4" />
                  Edit payment
                </button>
                <button
                  onClick={() => void confirm()}
                  disabled={recordPayment.isPending}
                  className="h-11 flex-1 rounded-md bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {recordPayment.isPending ? "Recording..." : "Confirm & record"}
                </button>
              </div>
            </div>
          )}
          {stage === 3 && student && receipt && (
            <div className="space-y-6">
              <section id="payment-receipt" className="rounded-md border border-border p-5">
                <p className="font-bold">DIVINE SOURCES PRAISELAND HIGH SCHOOL</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  DaskaSchool · Official Payment Receipt
                </p>
                <p className="mt-5 text-sm">
                  Receipt No: <span className="font-semibold">{receipt.receiptNo}</span>
                </p>
                <p className="mt-1 text-sm">
                  Date:{" "}
                  {new Date().toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <div className="mt-5 border-y border-border py-4 text-sm">
                  <p>
                    Student: <span className="font-semibold">{student.name}</span>
                  </p>
                  <p className="mt-1">
                    Class: <span className="font-semibold">{student.className}</span>
                  </p>
                  <p className="mt-1">
                    Guardian: <span className="font-semibold">{student.guardian}</span>
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  {fees
                    .filter((fee) => fee.label && fee.amount > 0)
                    .map((fee) => (
                      <p key={fee.key} className="flex justify-between text-sm">
                        <span>{fee.label}</span>
                        <span>{naira(fee.amount)}</span>
                      </p>
                    ))}
                </div>
                <p className="mt-4 flex justify-between border-t border-border pt-4 text-base font-bold">
                  <span>TOTAL PAID</span>
                  <span>{naira(total)}</span>
                </p>
                <p className="mt-4 text-sm">Payment method: {method}</p>
                {reminderOn && (
                  <p className="mt-2 text-sm">
                    Reminder set for{" "}
                    {new Date(`${remindOn}T00:00:00`).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </section>
              <button
                onClick={() => window.print()}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border text-sm font-semibold"
              >
                <Printer className="size-4" />
                Print receipt
              </button>
              <button
                onClick={done}
                className="h-11 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground"
              >
                Done
              </button>
              <button
                onClick={reset}
                className="flex w-full items-center justify-center gap-1 text-sm font-semibold text-primary"
              >
                <Check className="size-4" />
                Record another payment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
