import { PageLoadingSkeleton } from "@/components/fin/loading-skeleton";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { GraduationCap, Users } from "lucide-react";
import { AppShell } from "@/components/fin/app-shell";
import { PageHeader, Panel, ProgressBar, StatusBadge } from "@/components/fin/primitives";
import { naira } from "@/lib/school-data";
import { useClasses } from "@/hooks/use-classes";

export const Route = createFileRoute("/classes/")({
  head: () => ({
    meta: [
      { title: "Classes — Divine Sources Finance OS" },
      {
        name: "description",
        content: "Class-by-class expected revenue, collections, and outstanding balances.",
      },
    ],
  }),
  component: ClassesPage,
});

function ClassesPage() {
  const { data: classes, isLoading, error } = useClasses();

  const sections = useMemo(() => {
    if (!classes) return [];
    const map = new Map<string, { students: number; expected: number; collected: number }>();
    for (const c of classes) {
      const entry = map.get(c.section) ?? { students: 0, expected: 0, collected: 0 };
      entry.students += c.studentCount;
      entry.expected += c.expected;
      entry.collected += c.collected;
      map.set(c.section, entry);
    }
    return Array.from(map.entries()).map(([name, v]) => ({ name, ...v }));
  }, [classes]);

  const totalExpected = classes?.reduce((s, c) => s + c.expected, 0) ?? 0;
  const totalCollected = classes?.reduce((s, c) => s + c.collected, 0) ?? 0;
  const overallPct = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  if (isLoading) {
    return (
      <AppShell>
        <PageLoadingSkeleton metricCards={0} />
      </AppShell>
    );
  }

  if (error || !classes) {
    return (
      <AppShell>
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-semibold text-destructive">Couldn't load classes.</p>
          <p className="text-xs text-muted-foreground">Please refresh the page.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Classes"
        subtitle={`${classes.length} classes · ${overallPct}% of ${naira(totalExpected)} collected`}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sections.map((s) => {
          const p = s.expected > 0 ? Math.round((s.collected / s.expected) * 100) : 0;
          return (
            <div key={s.name} className="surface flex items-center gap-4 p-5">
              <span className="flex size-11 items-center justify-center rounded-md bg-primary-soft text-primary">
                <GraduationCap className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold">{s.name} section</p>
                <p className="num text-xs text-muted-foreground">
                  {s.students} students · {p}% collected
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {classes.length === 0 ? (
        <Panel className="mt-6">
          <p className="py-8 text-center text-sm text-muted-foreground">No classes yet.</p>
        </Panel>
      ) : (
        <>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {classes.map((c) => (
              <Link
                key={c.id}
                to="/classes/$classId"
                params={{ classId: c.id }}
                className="surface block p-6 transition-shadow hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{c.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.teacherName ?? "No teacher assigned"}
                    </p>
                  </div>
                  <StatusBadge
                    tone={
                      c.collectionPct >= 80
                        ? "success"
                        : c.collectionPct >= 65
                          ? "warning"
                          : "danger"
                    }
                  >
                    {c.collectionPct}%
                  </StatusBadge>
                </div>

                <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="size-4" /> {c.studentCount} students · {c.section}
                </p>

                <ProgressBar
                  className="mt-5"
                  value={c.collectionPct}
                  tone={c.collectionPct >= 80 ? "primary" : "gold"}
                />

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
                    <dd className="num font-semibold text-destructive">{naira(c.outstanding)}</dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>

          <Panel
            className="mt-6"
            title="Collection league table"
            description="Ranked by collection percentage"
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {["Class", "Students", "Expected", "Collected", "Collection %"].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...classes]
                    .sort((a, b) => b.collectionPct - a.collectionPct)
                    .map((c) => (
                      <tr key={c.id} className="hover:bg-muted/60">
                        <td className="px-6 py-4 font-semibold">{c.name}</td>
                        <td className="num px-6 py-4">{c.studentCount}</td>
                        <td className="num px-6 py-4">{naira(c.expected)}</td>
                        <td className="num px-6 py-4 text-success">{naira(c.collected)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <ProgressBar value={c.collectionPct} className="w-28" />
                            <span className="num text-xs font-semibold">{c.collectionPct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </AppShell>
  );
}
