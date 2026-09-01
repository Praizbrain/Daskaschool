import { createFileRoute } from "@tanstack/react-router";
import { Target } from "lucide-react";
import { ComingSoon } from "@/components/fin/coming-soon";

export const Route = createFileRoute("/targets")({
  head: () => ({
    meta: [
      { title: "Targets — Divine Sources Finance OS" },
      {
        name: "description",
        content: "Collection targets, deadlines and progress tracking — coming in Phase 11.",
      },
    ],
  }),
  component: TargetsPage,
});

function TargetsPage() {
  return (
    <ComingSoon
      icon={<Target className="size-7" />}
      title="Targets"
      subtitle="Collection goals and deadlines, by class, section, or the whole school"
      phaseLabel="Phase 11"
      whatItWillDo={[
        "Set a collection target and deadline per class, per section, or school-wide",
        "Track live progress against each target as payments come in",
        "Highlight classes falling behind their target on the Dashboard",
      ]}
      whyNotYet="A target only means something once real collection numbers exist to measure
        progress against — this phase is sequenced right after Reports for the same reason."
    />
  );
}
