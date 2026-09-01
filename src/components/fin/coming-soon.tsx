import type { ReactNode } from "react";
import { Clock } from "lucide-react";
import { AppShell } from "@/components/fin/app-shell";
import { PageHeader, Panel } from "@/components/fin/primitives";

export function ComingSoon({
  icon,
  title,
  subtitle,
  phaseLabel,
  whatItWillDo,
  whyNotYet,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  phaseLabel: string;
  whatItWillDo: string[];
  whyNotYet: string;
}) {
  return (
    <AppShell>
      <PageHeader title={title} subtitle={subtitle} />

      <div className="mt-8 flex justify-center">
        <Panel className="w-full max-w-2xl text-center" bodyClassName="p-10">
          <div className="flex flex-col items-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary">
              {icon}
            </span>
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="size-3.5" /> {phaseLabel} · Coming soon
            </span>
            <h2 className="mt-4 text-xl font-bold">{title} isn't built yet</h2>

            <div className="mt-6 w-full rounded-md border border-border bg-muted/40 p-5 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                What this page will do
              </p>
              <ul className="mt-3 space-y-2">
                {whatItWillDo.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-6 max-w-md text-xs leading-relaxed text-muted-foreground">
              {whyNotYet}
            </p>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
