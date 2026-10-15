import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, LoaderCircle, X } from "lucide-react";
import { useDismissReminder, useNotifications } from "@/hooks/use-notifications";
import { Money, StatusBadge } from "@/components/fin/primitives";

export function NotificationPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useNotifications();
  const dismissReminder = useDismissReminder();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close notifications"
        className="fixed inset-0 z-40 cursor-default"
        onClick={onClose}
      />
      <section
        aria-label="Notifications"
        className="fixed inset-x-0 top-[73px] z-50 mx-auto max-h-[calc(100vh-5.5rem)] w-full overflow-y-auto border border-border bg-card shadow-elevated sm:inset-x-auto sm:right-4 sm:mx-0 sm:w-96 sm:rounded-md"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <h2 className="text-base font-semibold">Notifications</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close notifications"
          >
            <X className="size-4" />
          </button>
        </header>
        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
            <LoaderCircle className="mr-2 size-4 animate-spin" /> Loading notifications
          </div>
        ) : error || !data ? (
          <div className="p-5 text-sm text-destructive">
            Could not load notifications. Please try again.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(data.isMonday || data.isFriday) && (
              <div className="bg-primary-soft px-5 py-3 text-sm font-medium text-primary">
                {data.isMonday
                  ? "📋 Monday Review, here is who still owes this week"
                  : "📊 Friday Update, here is what changed since Monday"}
              </div>
            )}
            {data.reminders.length > 0 && (
              <section className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Reminders due
                  </h3>
                  <StatusBadge tone="danger">{data.reminders.length}</StatusBadge>
                </div>
                <ul className="mt-3 space-y-3">
                  {data.reminders.map((reminder) => (
                    <li key={reminder.id} className="rounded-md border border-border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{reminder.studentName}</p>
                          <p className="text-xs text-muted-foreground">{reminder.className}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => dismissReminder.mutate(reminder.id)}
                          disabled={dismissReminder.isPending}
                          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                          aria-label={`Dismiss reminder for ${reminder.studentName}`}
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-muted-foreground">{reminder.feeLabel}</span>
                        <Money
                          value={reminder.outstandingAmount}
                          className="font-bold text-destructive"
                        />
                      </div>
                      <p
                        className={`mt-2 text-xs ${reminder.isOverdue ? "font-semibold text-destructive" : "text-muted-foreground"}`}
                      >
                        {reminder.isOverdue ? "Overdue" : reminder.remindOn}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section className="p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {data.isMonday
                  ? "Who still owes this week?"
                  : data.isFriday
                    ? "What changed during the week?"
                    : "Outstanding balances"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {data.totalOutstandingStudents} students with outstanding balances ·{" "}
                {data.totalNoPayStudents} with no payment at all
              </p>
              {data.outstanding.length === 0 ? (
                <p className="mt-4 flex items-center gap-2 text-sm font-medium text-success">
                  <Check className="size-4" /> All students are fully paid up!
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {data.outstanding.map((group) => (
                    <li key={`${group.section}-${group.className}`}>
                      <button
                        type="button"
                        onClick={() => {
                          navigate({ to: "/students", search: { klass: group.className } });
                          onClose();
                        }}
                        className="w-full rounded-md border border-border p-3 text-left transition-colors hover:bg-muted"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{group.className}</p>
                            <p className="text-xs text-muted-foreground">{group.section}</p>
                          </div>
                          <Money value={group.totalOwed} className="font-bold text-destructive" />
                        </div>
                        <div className="mt-3 flex gap-4 text-xs">
                          <span
                            className={
                              group.noPay > 0
                                ? "font-semibold text-destructive"
                                : "text-muted-foreground"
                            }
                          >
                            No payment: {group.noPay}
                          </span>
                          <span
                            className={
                              group.partial > 0
                                ? "font-semibold text-[color:var(--warning)]"
                                : "text-muted-foreground"
                            }
                          >
                            Partial: {group.partial}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            {data.recentPayments.length > 0 && (
              <section className="p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent payments (last 7 days)
                </h3>
                <ul className="mt-3 space-y-3">
                  {data.recentPayments.slice(0, 5).map((payment) => (
                    <li key={payment.id} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p className="font-semibold">{payment.studentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {payment.className} · {payment.date} ·{" "}
                          <span className="rounded bg-muted px-1.5 py-0.5">{payment.method}</span>
                        </p>
                      </div>
                      <Money value={payment.amount} className="shrink-0 font-bold text-success" />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
        {data && (
          <footer className="flex items-center justify-between gap-3 border-t border-border px-5 py-4 text-xs text-muted-foreground">
            <span>
              Last updated{" "}
              {new Date(data.generatedAt).toLocaleTimeString("en-NG", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            <Link
              to="/finance"
              onClick={onClose}
              className="font-semibold text-primary hover:underline"
            >
              View full finance report →
            </Link>
          </footer>
        )}
      </section>
    </>
  );
}
