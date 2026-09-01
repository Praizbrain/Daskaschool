import { createFileRoute } from "@tanstack/react-router";
import { FileBarChart } from "lucide-react";
import { ComingSoon } from "@/components/fin/coming-soon";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Divine Sources Finance OS" },
      {
        name: "description",
        content: "Detailed, exportable financial reports — coming in Phase 10.",
      },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <ComingSoon
      icon={<FileBarChart className="size-7" />}
      title="Reports"
      subtitle="Revenue, expenses, outstanding balances and class profitability, by date range"
      phaseLabel="Phase 10"
      whatItWillDo={[
        "Pick a report type — revenue, expenses, outstanding balances, class profitability",
        "Filter any report by a custom date range",
        "Export to PDF or Excel/CSV for printing or sending to your accountant",
      ]}
      whyNotYet="Reports need real payment and expense history to actually report on — the
        Dashboard already covers today/this-week/this-term at a glance in the meantime."
    />
  );
}
