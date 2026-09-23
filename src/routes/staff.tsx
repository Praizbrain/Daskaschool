import { createFileRoute } from "@tanstack/react-router";
import { Users2 } from "lucide-react";
import { ComingSoon } from "@/components/fin/coming-soon";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff — DaskaSchool" },
      {
        name: "description",
        content:
          "Full staff directory with teacher records, status and salary — coming in Phase 9.",
      },
    ],
  }),
  component: StaffPage,
});

function StaffPage() {
  return (
    <ComingSoon
      icon={<Users2 className="size-7" />}
      title="Staff"
      subtitle="Teacher records, status and class assignments"
      phaseLabel="Phase 9"
      whatItWillDo={[
        "Keep a full staff directory — name, position, status, contact info",
        "Link teachers directly to the classes they teach",
        "Replace the free-text teacher name/salary fields currently on each class",
        "Support non-login staff records too (e.g. cleaners, security) alongside teachers",
      ]}
      whyNotYet="A proper staff record needs Classes to already exist as real data, which it
        does — this phase is next in line after Reports and Targets, sequenced so the more
        foundational financial features ship first."
    />
  );
}
