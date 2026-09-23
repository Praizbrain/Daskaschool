import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase-client";
import { Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";
import { SCHOOL } from "@/lib/school-data";
import { naira } from "@/lib/school-data";
import { ThemeToggle } from "@/components/fin/theme-toggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — DaskaSchool" },
      {
        name: "description",
        content:
          "Staff sign-in for DaskaSchool — the simple operating system for Nigerian schools.",
      },
      { property: "og:title", content: "Sign in — DaskaSchool" },
      {
        property: "og:description",
        content: "Internal staff access to school fees, revenue, expenses and reports.",
      },
    ],
  }),
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setAuthError("That email or password isn't right. Please try again.");
        setIsSubmitting(false);
        return;
      }

      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error("[routes/index/onSubmit]", err);
      setAuthError("Something went wrong signing you in. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="absolute top-5 right-5 sm:top-6 sm:right-6 z-20">
        <ThemeToggle />
      </div>
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-[52%] lg:px-20">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="flex items-center">
            <img
              src="/primary-horizontal-logo.png"
              alt="DaskaSchool"
              className="h-14 w-auto object-contain"
            />
          </div>

          <h1 className="mt-12 text-5xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Sign in to manage fees, payments and school finances for{" "}
            <span className="font-medium text-foreground">{SCHOOL.name}</span>.
          </p>

          <form className="mt-10 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {authError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {authError}
              </div>
            )}

            <div>
              <label htmlFor="email" className="text-sm font-semibold">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className="mt-2 h-12 w-full rounded-md border border-input bg-card px-4 text-sm outline-none transition-colors focus:border-primary"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-semibold">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password")}
                  className="h-12 w-full rounded-md border border-input bg-card px-4 pr-12 text-sm outline-none transition-colors focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="size-[18px]" />
                  ) : (
                    <Eye className="size-[18px]" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-deep disabled:opacity-60"
            >
              {isSubmitting ? "Signing in…" : "Sign in"} <ArrowRight className="size-4" />
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
            <IllustrationCard
              label="Expected revenue this term"
              value={naira(48_650_000)}
              bar={100}
              tone="primary"
            />
            <IllustrationCard
              label="Collected so far"
              value={naira(33_420_000)}
              bar={69}
              tone="primary"
            />
            <IllustrationCard label="Outstanding" value={naira(15_230_000)} bar={31} tone="gold" />
            <IllustrationCard
              label="Estimated net profit"
              value={naira(14_240_000)}
              bar={48}
              tone="olive"
            />
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
