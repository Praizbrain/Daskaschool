import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Users } from "lucide-react";
import { AppShell } from "@/components/fin/app-shell";
import { PageHeader, Panel, ProgressBar, StatusBadge } from "@/components/fin/primitives";
import { CLASSES, SECTIONS, naira, pct } from "@/lib/school-data";

export const Route = createFileRoute("/classes/")({
  head: () => ({
    meta: [
      { title: "Classes — Divine Sources Finance OS" },
      {
        name: "description",
        content:
          "Class-by-class expected revenue, collections, outstanding balances and collection percentage.",
      },
      { property: "og:title", content: "Classes — Divine Sources Finance OS" },
      {
        property: "og:description",
        content: "Revenue performance for every class from KG to SS 3.",
      },
    ],
  }),
  component: ClassesPage,
});

function ClassesPage() {
  const totalExpected = CLASSES.reduce((s, c) => s + c.expected, 0);
  const totalCollected = CLASSES.reduce((s, c) => s + c.collected, 0);

  return (
    <AppShell>
      <PageHeader
        title="Classes"
        subtitle={`${CLASSES.length} classes · ${pct(totalCollected, totalExpected)}% of ${naira(totalExpected)} collected`}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SECTIONS.map((s) => (
          <div key={s.name} className="surface flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-md bg-primary-soft text-primary">
              <GraduationCap className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold">{s.name} section</p>
              <p className="num text-xs text-muted-foreground">
                {s.students} students · {pct(s.collected, s.expected)}% collected
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {CLASSES.map((c) => {
          const p = pct(c.collected, c.expected);
          const outstanding = c.expected - c.collected;
          return (
            <Link
              key={c.id}
              to="/classes/$classId"
              params={{ classId: c.id }}
              className="surface block p-6 transition-shadow hover:shadow-lift"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{c.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{c.teacher}</p>
                </div>
                <StatusBadge tone={p >= 80 ? "success" : p >= 65 ? "warning" : "danger"}>{p}%</StatusBadge>
              </div>

              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="size-4" /> {c.students} students · {c.section}
              </p>

              <ProgressBar className="mt-5" value={p} tone={p >= 80 ? "primary" : "gold"} />

              <dl className="mt-5 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Expected revenue</dt>
                  <dd className="num font-semibold">{naira(c.expected)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Collected</dt>
                  <dd className="num font-semibold text-success">{naira(c.collected)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Outstanding</dt>
                  <dd className="num font-semibold text-destructive">{naira(outstanding)}</dd>
                </div>
              </dl>
            </Link>
          );
        })}
      </div>

      <Panel className="mt-6" title="Collection league table" description="Ranked by collection percentage" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Class", "Students", "Expected", "Collected", "Collection %"].map((h) => (
                  <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...CLASSES]
                .sort((a, b) => pct(b.collected, b.expected) - pct(a.collected, a.expected))
                .map((c) => (
                  <tr key={c.id} className="hover:bg-muted/60">
                    <td className="px-6 py-4 font-semibold">{c.name}</td>
                    <td className="num px-6 py-4">{c.students}</td>
                    <td className="num px-6 py-4">{naira(c.expected)}</td>
                    <td className="num px-6 py-4 text-success">{naira(c.collected)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ProgressBar value={pct(c.collected, c.expected)} className="w-28" />
                        <span className="num text-xs font-semibold">{pct(c.collected, c.expected)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
