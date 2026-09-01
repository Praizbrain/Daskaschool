import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { naira } from "@/lib/school-data";

/* --------------------------------- Layout --------------------------------- */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("surface overflow-hidden", className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn("p-6", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ------------------------------- Metric card ------------------------------ */

export function MetricCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
  footer,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "primary" | "gold" | "success" | "danger";
  icon?: ReactNode;
  footer?: ReactNode;
}) {
  const tones = {
    default: "bg-muted text-foreground",
    primary: "bg-primary-soft text-primary",
    gold: "bg-gold-soft text-gold",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-destructive",
  } as const;

  return (
    <div className="surface p-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {icon && (
          <span className={cn("flex size-9 items-center justify-center rounded-md", tones[tone])}>
            {icon}
          </span>
        )}
      </div>
      <p className="num mt-4 text-3xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}

/* ------------------------------ Status badge ------------------------------ */

type BadgeTone = "success" | "warning" | "danger" | "neutral" | "primary" | "gold";

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const map: Record<BadgeTone, string> = {
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-[color:var(--warning)]",
    danger: "bg-danger-soft text-destructive",
    neutral: "bg-muted text-muted-foreground",
    primary: "bg-primary-soft text-primary",
    gold: "bg-gold-soft text-gold",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold",
        map[tone],
      )}
    >
      {children}
    </span>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function paymentTone(status: string): BadgeTone {
  if (status === "Paid") return "success";
  if (status === "Part Payment") return "warning";
  return "danger";
}

/* ------------------------------- Progress -------------------------------- */

export function ProgressBar({
  value,
  tone = "primary",
  className,
}: {
  value: number;
  tone?: "primary" | "gold" | "olive" | "slate";
  className?: string;
}) {
  const bg = {
    primary: "bg-primary",
    gold: "bg-gold",
    olive: "bg-olive",
    slate: "bg-slate",
  }[tone];
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", bg)}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 200,
  stroke = 16,
  label,
  caption,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  caption?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(value, 100) / 100) * c;
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke="var(--muted)"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="var(--primary)"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-4xl font-bold">{value}%</span>
        {label && (
          <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        )}
        {caption && <span className="mt-2 num text-xs text-muted-foreground">{caption}</span>}
      </div>
    </div>
  );
}

/* -------------------------------- Avatar --------------------------------- */

const AVATAR_TONES = [
  "bg-primary-soft text-primary",
  "bg-gold-soft text-gold",
  "bg-muted text-slate",
  "bg-success-soft text-success",
];

export function InitialAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .replace(/^(Mr\.|Mrs\.|Miss|Dr\.|Pastor|Alhaji|Mal\.)\s*/i, "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  const tone = AVATAR_TONES[name.length % AVATAR_TONES.length];
  const sizes = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-20 text-2xl" };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold",
        sizes[size],
        tone,
      )}
    >
      {initials}
    </span>
  );
}

/* ------------------------------- Empty state ------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && (
        <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          {icon}
        </span>
      )}
      <p className="text-base font-semibold">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* -------------------------------- Data row ------------------------------- */

export function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium">{value}</dd>
    </div>
  );
}

export function Money({ value, className }: { value: number; className?: string }) {
  return <span className={cn("num", className)}>{naira(value)}</span>;
}
