import { createFileRoute } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import { ComingSoon } from "@/components/fin/coming-soon";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — Divine Sources Finance OS" },
      {
        name: "description",
        content:
          "Real stock tracking for books, uniforms, sneakers and other items — coming in Phase 8.",
      },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  return (
    <ComingSoon
      icon={<Boxes className="size-7" />}
      title="Inventory"
      subtitle="Books, uniforms, sneakers and other items sold to students"
      phaseLabel="Phase 8"
      whatItWillDo={[
        "Track real stock counts, cost price, and selling price for every item",
        "Automatically reduce stock when an item is included in a student's payment",
        "Show low-stock warnings and per-item profit, based on real sales",
        "Replace the temporary price list currently used on the Record Payment form",
      ]}
      whyNotYet="This is sequenced after the core payment flow because it needs real payment
        history to calculate sold units and profit — building it earlier would mean tracking
        stock against sales that don't exist yet."
    />
  );
}
