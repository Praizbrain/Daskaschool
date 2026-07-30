import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/fin/app-shell";
import { PageHeader, Panel, ProgressBar, ProgressRing, StatusBadge } from "@/components/fin/primitives";
import { FINANCE, SECTIONS, naira, pct } from "@/lib/school-data";

export const Route = createFileRoute("/targets")({
  head: () => ({
    meta: [
      { title: "Collection targets — Divine Sources Finance OS" },
      { name: "description", content: "Term collection target with section-by-section expected, collected, outstanding and completion percentage." },
      { property: "og:title", content: "Collection targets — Divine Sources Finance OS" },
      { property: "og:description", content: "Track fee collection against the term target." },
    ],
  }),
  component: TargetsPage,
});

const TONES = ["primary", "gold", "olive", "slate"] as const;

function TargetsPage() {
  const overall = pct(FINANCE.collectedRevenue, FINANCE.expectedRevenue);
  return (
    <AppShell>
      <PageHeader title="Payment targets" subtitle="How close the school is to collecting all expected revenue this term" />

      <Panel className="mt-8" title="Overall collection target" bodyClassName="p-8">
        <div className="flex flex-wrap items-center justify-center gap-12">
          <ProgressRing value={overall} size={240} stroke={20} label="Collected" caption={`${naira(FINANCE.collectedRevenue, { compact: true })} of ${naira(FINANCE.expectedRevenue, { compact: true })}`} />
          <dl className="grid flex-1 gap-4 sm:grid-cols-2">
            <div className="rounded-md bg-muted p-5">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target</dt>
              <dd className="num mt-2 text-xl font-bold">{naira(FINANCE.expectedRevenue)}</dd>
            </div>
            <div className="rounded-md bg-success-soft p-5">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Collected</dt>
              <dd className="num mt-2 text-xl font-bold text-success">{naira(FINANCE.collectedRevenue)}</dd>
            </div>
            <div className="rounded-md bg-danger-soft p-5">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outstanding</dt>
              <dd className="num mt-2 text-xl font-bold text-destructive">{naira(FINANCE.outstandingRevenue)}</dd>
            </div>
            <div className="rounded-md bg-gold-soft p-5">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Days left in term</dt>
              <dd className="num mt-2 text-xl font-bold">38</dd>
            </div>
          </dl>
        </div>
      </Panel>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {SECTIONS.map((s, i) => {
          const p = pct(s.collected, s.expected);
          return (
            <div key={s.name} className="surface p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{s.name}</h2>
                <StatusBadge tone={p >= 80 ? "success" : p >= 65 ? "warning" : "danger"}>{p}%</StatusBadge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{s.students} students</p>
              <ProgressBar className="mt-5" value={p} tone={TONES[i]} />
              <dl className="mt-5 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Expected</dt>
                  <dd className="num font-semibold">{naira(s.expected)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Collected</dt>
                  <dd className="num font-semibold text-success">{naira(s.collected)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Outstanding</dt>
                  <dd className="num font-semibold text-destructive">{naira(s.expected - s.collected)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Completion</dt>
                  <dd className="num font-semibold">{p}%</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
