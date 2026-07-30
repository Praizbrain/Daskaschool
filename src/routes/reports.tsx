import { createFileRoute } from "@tanstack/react-router";
import { FileSpreadsheet, FileText, FileDown } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/fin/app-shell";
import { PageHeader, Panel } from "@/components/fin/primitives";
import { FINANCE, naira } from "@/lib/school-data";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Divine Sources Finance OS" },
      { name: "description", content: "Daily, weekly, monthly, term, profit, outstanding, expense and inventory reports with PDF, Excel and CSV export." },
      { property: "og:title", content: "Reports — Divine Sources Finance OS" },
      { property: "og:description", content: "Export school finance reports for owners and stakeholders." },
    ],
  }),
  component: ReportsPage,
});

const REPORTS = [
  { name: "Daily revenue", desc: "Money collected today across all payment methods", value: naira(FINANCE.todayRevenue) },
  { name: "Weekly revenue", desc: "Rolling seven-day collection summary", value: naira(3_140_000) },
  { name: "Monthly revenue", desc: "February collections by section and class", value: naira(5_920_000) },
  { name: "Term report", desc: "Full second term financial statement", value: naira(FINANCE.collectedRevenue) },
  { name: "Profit report", desc: "Revenue less salaries and expenses", value: naira(FINANCE.collectedRevenue - FINANCE.totalExpenses) },
  { name: "Outstanding report", desc: "Debtors list by class and guardian", value: naira(FINANCE.outstandingRevenue) },
  { name: "Expense report", desc: "Expenses grouped by category and payee", value: naira(FINANCE.totalExpenses) },
  { name: "Inventory report", desc: "Stock levels, sales and item profitability", value: naira(2_980_000) },
];

function ReportsPage() {
  return (
    <AppShell>
      <PageHeader title="Reports" subtitle="Generate a report, then export it for the school owner or auditor" />

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((r) => (
          <div key={r.name} className="surface p-6">
            <h2 className="text-base font-bold">{r.name}</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{r.desc}</p>
            <p className="num mt-5 text-2xl font-bold">{r.value}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { label: "PDF", icon: <FileText className="size-3.5" /> },
                { label: "Excel", icon: <FileSpreadsheet className="size-3.5" /> },
                { label: "CSV", icon: <FileDown className="size-3.5" /> },
              ].map((f) => (
                <button
                  key={f.label}
                  onClick={() => toast.success(`${r.name} exported`, { description: `${f.label} file ready to download.` })}
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary"
                >
                  {f.icon} {f.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Panel className="mt-6" title="Scheduled reports" description="Sent automatically to the school owner">
        <ul className="space-y-3 text-sm">
          {[
            "Daily collection summary — every day at 5:00pm via WhatsApp",
            "Weekly outstanding fees list — every Monday at 8:00am via email",
            "Term profit statement — end of term via email (PDF)",
          ].map((s) => (
            <li key={s} className="rounded-md border border-border px-5 py-4">{s}</li>
          ))}
        </ul>
      </Panel>
    </AppShell>
  );
}
