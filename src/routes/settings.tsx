import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/components/fin/app-shell";
import { KeyValue, PageHeader, Panel, StatusBadge } from "@/components/fin/primitives";
import { BANK_ACCOUNTS, CURRENT_USER, EXPENSE_CATEGORIES, INVENTORY, SCHOOL, naira } from "@/lib/school-data";

const TABS = ["school", "academic", "fees", "inventory", "expenses", "banks", "users", "audit"] as const;
const LABELS: Record<(typeof TABS)[number], string> = {
  school: "School profile",
  academic: "Sessions & terms",
  fees: "Fee structure",
  inventory: "Inventory categories",
  expenses: "Expense categories",
  banks: "Bank accounts",
  users: "User management",
  audit: "Audit logs",
};

export const Route = createFileRoute("/settings")({
  validateSearch: z.object({ tab: z.enum(TABS).optional() }),
  head: () => ({
    meta: [
      { title: "Settings — Divine Sources Finance OS" },
      { name: "description", content: "Configure school profile, sessions, terms, fee structure, discounts, categories, bank accounts, users and audit logs." },
      { property: "og:title", content: "Settings — Divine Sources Finance OS" },
      { property: "og:description", content: "Super Admin configuration for the school finance system." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { tab = "school" } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <AppShell>
      <PageHeader title="Settings" subtitle="Only Super Admins can change configuration. Admins have read-only access here." />

      <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
        <nav className="surface h-fit p-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => navigate({ search: { tab: t } })}
              className={`block w-full rounded-md px-4 py-3 text-left text-sm font-semibold transition-colors ${
                tab === t ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {LABELS[t]}
            </button>
          ))}
        </nav>

        <Panel title={LABELS[tab]}>
          {tab === "school" && (
            <dl className="grid gap-6 sm:grid-cols-2">
              <KeyValue label="School name" value={SCHOOL.name} />
              <KeyValue label="Application name" value={SCHOOL.app} />
              <KeyValue label="Address" value={SCHOOL.address} />
              <KeyValue label="Phone" value={SCHOOL.phone} />
            </dl>
          )}

          {tab === "academic" && (
            <ul className="space-y-3 text-sm">
              {[
                `${SCHOOL.session} — First Term (closed)`,
                `${SCHOOL.session} — Second Term (active)`,
                `${SCHOOL.session} — Third Term (upcoming)`,
                "2024 / 2025 — archived",
              ].map((s) => (
                <li key={s} className="flex items-center justify-between rounded-md border border-border px-5 py-4">
                  {s}
                  {s.includes("active") && <StatusBadge tone="success">Current</StatusBadge>}
                </li>
              ))}
            </ul>
          )}

          {tab === "fees" && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Section", "Term fee", "Exam fee", "Lesson fee"].map((h) => (
                    <th key={h} className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["KG", 78_000, 5_000, 8_000],
                  ["Primary", 96_000, 7_500, 12_000],
                  ["JSS", 126_000, 12_000, 16_000],
                  ["SS", 168_000, 15_000, 18_000],
                ].map(([s, f, e, l]) => (
                  <tr key={s as string}>
                    <td className="py-4 font-semibold">{s}</td>
                    <td className="num py-4">{naira(f as number)}</td>
                    <td className="num py-4">{naira(e as number)}</td>
                    <td className="num py-4">{naira(l as number)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "inventory" && (
            <div className="flex flex-wrap gap-2">
              {INVENTORY.map((i) => (
                <StatusBadge key={i.id} tone="primary">{i.category}</StatusBadge>
              ))}
            </div>
          )}

          {tab === "expenses" && (
            <div className="flex flex-wrap gap-2">
              {EXPENSE_CATEGORIES.map((c) => (
                <StatusBadge key={c} tone="gold">{c}</StatusBadge>
              ))}
            </div>
          )}

          {tab === "banks" && (
            <ul className="space-y-3 text-sm">
              {BANK_ACCOUNTS.map((a) => (
                <li key={a} className="rounded-md border border-border px-5 py-4 font-medium">{a}</li>
              ))}
            </ul>
          )}

          {tab === "users" && (
            <ul className="space-y-3">
              {[
                { name: CURRENT_USER.name, role: "Super Admin" },
                { name: "Mr. Sunday Okoro", role: "Admin (Secretary)" },
                { name: "Mr. Isaac Nwafor", role: "Admin (HM)" },
              ].map((u) => (
                <li key={u.name} className="flex items-center justify-between rounded-md border border-border px-5 py-4 text-sm">
                  <span className="font-semibold">{u.name}</span>
                  <StatusBadge tone={u.role.startsWith("Super") ? "primary" : "neutral"}>{u.role}</StatusBadge>
                </li>
              ))}
            </ul>
          )}

          {tab === "audit" && (
            <ul className="space-y-3 text-sm">
              {[
                "Grace Adeyemi recorded payment RCP-10488 — today, 10:24",
                "Sunday Okoro added expense EXP-2213 — yesterday, 16:05",
                "Grace Adeyemi updated SS 1B fee structure — 18 Feb 2026",
                "Isaac Nwafor exported outstanding report — 16 Feb 2026",
              ].map((l) => (
                <li key={l} className="rounded-md border border-border px-5 py-4 text-muted-foreground">{l}</li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
