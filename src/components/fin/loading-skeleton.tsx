/**
 * Reusable skeleton loading state, shaped to roughly match the page it's
 * standing in for (title bar, metric cards, a table-like block) — replaces
 * plain "Loading…" text everywhere in the app.
 */
export function PageLoadingSkeleton({
  metricCards = 3,
  showTable = true,
}: {
  metricCards?: number;
  showTable?: boolean;
}) {
  return (
    <div className="animate-pulse">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="h-7 w-48 rounded-md bg-muted" />
          <div className="mt-3 h-4 w-72 rounded-md bg-muted" />
        </div>
        <div className="h-11 w-32 rounded-md bg-muted" />
      </div>

      {metricCards > 0 && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: metricCards }).map((_, i) => (
            <div key={i} className="rounded-md border border-border bg-card p-6">
              <div className="h-3 w-24 rounded-md bg-muted" />
              <div className="mt-4 h-7 w-32 rounded-md bg-muted" />
              <div className="mt-3 h-3 w-20 rounded-md bg-muted" />
            </div>
          ))}
        </div>
      )}

      {showTable && (
        <div className="mt-6 rounded-md border border-border bg-card p-0">
          <div className="border-b border-border p-5">
            <div className="h-4 w-40 rounded-md bg-muted" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="size-9 shrink-0 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 rounded-md bg-muted" />
                  <div className="h-3 w-1/4 rounded-md bg-muted" />
                </div>
                <div className="h-3.5 w-20 rounded-md bg-muted" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Smaller inline variant — for a single card/panel loading, not a whole page.
 */
export function InlineLoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3 p-6">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 rounded-md bg-muted" style={{ width: `${85 - i * 15}%` }} />
      ))}
    </div>
  );
}
