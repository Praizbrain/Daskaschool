import { createFileRoute } from "@tanstack/react-router";
import { Boxes, Pencil, Plus } from "lucide-react";
import { AppShell } from "@/components/fin/app-shell";
import { MetricCard, Money, PageHeader, Panel, StatusBadge } from "@/components/fin/primitives";
import { INVENTORY, naira } from "@/lib/school-data";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — Divine Sources Finance OS" },
      {
        name: "description",
        content: "Stock levels, cost price, selling price and profit per item for books, uniforms, sneakers and stationery.",
      },
      { property: "og:title", content: "Inventory — Divine Sources Finance OS" },
      { property: "og:description", content: "Stock, pricing and profit for every school item." },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const stockValue = INVENTORY.reduce((s, i) => s + i.stock * i.cost, 0);
  const profit = INVENTORY.reduce((s, i) => s + (i.price - i.cost) * i.sold, 0);
  const revenue = INVENTORY.reduce((s, i) => s + i.price * i.sold, 0);

  return (
    <AppShell>
      <PageHeader
        title="Inventory"
        subtitle="Books, uniforms, sneakers and other items sold to students"
        actions={
          <button className="flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary-deep">
            <Plus className="size-4" /> Add item
          </button>
        }
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <MetricCard label="Stock value at cost" value={naira(stockValue)} tone="primary" icon={<Boxes className="size-4" />} />
        <MetricCard label="Sales revenue this term" value={naira(revenue)} tone="success" />
        <MetricCard label="Profit from item sales" value={naira(profit)} tone="gold" />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {INVENTORY.map((i) => {
          const unitProfit = i.price - i.cost;
          const low = i.stock < 100;
          return (
            <div key={i.id} className="surface p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{i.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{i.category}</p>
                </div>
                <StatusBadge tone={low ? "warning" : "success"}>{low ? "Low stock" : "In stock"}</StatusBadge>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-md bg-muted p-4">
                  <dt className="text-xs font-semibold text-muted-foreground">Stock left</dt>
                  <dd className="num mt-1 text-lg font-bold">{i.stock}</dd>
                </div>
                <div className="rounded-md bg-muted p-4">
                  <dt className="text-xs font-semibold text-muted-foreground">Sold this term</dt>
                  <dd className="num mt-1 text-lg font-bold">{i.sold}</dd>
                </div>
              </dl>

              <dl className="mt-5 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Cost price</dt>
                  <dd><Money value={i.cost} className="font-semibold" /></dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Selling price</dt>
                  <dd><Money value={i.price} className="font-semibold" /></dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Profit per unit</dt>
                  <dd><Money value={unitProfit} className="font-bold text-success" /></dd>
                </div>
              </dl>

              <button className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border text-sm font-semibold transition-colors hover:bg-muted">
                <Pencil className="size-4" /> Edit item
              </button>
            </div>
          );
        })}
      </div>

      <Panel className="mt-6" title="Stock and profitability table" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Item", "Stock", "Sold", "Cost", "Selling", "Unit profit", "Total profit"].map((h) => (
                  <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {INVENTORY.map((i) => (
                <tr key={i.id} className="hover:bg-muted/60">
                  <td className="px-6 py-4 font-semibold">{i.name}</td>
                  <td className="num px-6 py-4">{i.stock}</td>
                  <td className="num px-6 py-4">{i.sold}</td>
                  <td className="num px-6 py-4">{naira(i.cost)}</td>
                  <td className="num px-6 py-4">{naira(i.price)}</td>
                  <td className="num px-6 py-4">{naira(i.price - i.cost)}</td>
                  <td className="num px-6 py-4 font-bold text-success">{naira((i.price - i.cost) * i.sold)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
