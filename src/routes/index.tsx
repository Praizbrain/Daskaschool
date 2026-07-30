import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { School, Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";
import { SCHOOL } from "@/lib/school-data";
import { naira } from "@/lib/school-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Divine Sources Finance OS" },
      {
        name: "description",
        content:
          "Staff sign-in for Divine Sources Finance OS, the finance and operations system for Divine Sources Praiseland High School.",
      },
      { property: "og:title", content: "Sign in — Divine Sources Finance OS" },
      {
        property: "og:description",
        content: "Internal staff access to school fees, revenue, expenses and reports.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-[52%] lg:px-20">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <School className="size-6" />
            </span>
            <div>
              <p className="text-sm font-bold leading-tight">{SCHOOL.app}</p>
              <p className="text-xs text-muted-foreground">{SCHOOL.subtitle}</p>
            </div>
          </div>

          <h1 className="mt-12 text-4xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Sign in to manage fees, payments and school finances for{" "}
            <span className="font-medium text-foreground">{SCHOOL.name}</span>.
          </p>

          <form
            className="mt-10 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/dashboard" });
            }}
          >
            <div>
              <label htmlFor="email" className="text-sm font-semibold">
                Email address
              </label>
              <input
                id="email"
                type="email"
                defaultValue="grace@divinesources.ng"
                className="mt-2 h-12 w-full rounded-md border border-input bg-card px-4 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-semibold">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  defaultValue="divinesources"
                  className="h-12 w-full rounded-md border border-input bg-card px-4 pr-12 text-sm outline-none transition-colors focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  defaultChecked
                  className="size-4 accent-[color:var(--primary)]"
                />
                Remember me
              </label>
              <Link to="/" className="text-sm font-semibold text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-deep"
            >
              Sign in <ArrowRight className="size-4" />
            </button>
          </form>

          <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            Internal staff access only. All activity is recorded in the audit log.
          </p>
        </div>
      </div>

      <div className="relative hidden flex-1 items-center justify-center border-l border-border bg-card lg:flex">
        <div className="w-full max-w-md px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {SCHOOL.session} · {SCHOOL.term}
          </p>
          <h2 className="mt-4 text-2xl font-bold leading-snug">
            One clear picture of every naira the school earns and spends.
          </h2>

          <div className="mt-10 space-y-4">
            <IllustrationCard label="Expected revenue this term" value={naira(48_650_000)} bar={100} tone="primary" />
            <IllustrationCard label="Collected so far" value={naira(33_420_000)} bar={69} tone="primary" />
            <IllustrationCard label="Outstanding" value={naira(15_230_000)} bar={31} tone="gold" />
            <IllustrationCard label="Estimated net profit" value={naira(14_240_000)} bar={48} tone="olive" />
          </div>

          <div className="mt-10 flex items-end gap-2">
            {[52, 68, 44, 76, 61, 88, 72, 95].map((h, i) => (
              <span
                key={i}
                className="w-full rounded-sm"
                style={{
                  height: `${h}px`,
                  backgroundColor:
                    i % 3 === 0 ? "var(--primary)" : i % 3 === 1 ? "var(--gold)" : "var(--olive)",
                  opacity: 0.9,
                }}
              />
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Term collection trend · September to February
          </p>
        </div>
      </div>
    </div>
  );
}

function IllustrationCard({
  label,
  value,
  bar,
  tone,
}: {
  label: string;
  value: string;
  bar: number;
  tone: "primary" | "gold" | "olive";
}) {
  const color = { primary: "var(--primary)", gold: "var(--gold)", olive: "var(--olive)" }[tone];
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="num text-sm font-bold">{value}</p>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${bar}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
