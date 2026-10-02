import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, LogOut, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/fin/primitives";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSchoolSettings } from "@/hooks/use-settings";

export const Route = createFileRoute("/hub")({
  head: () => ({
    meta: [
      { title: "Platform Hub | DaskaSchool" },
      { name: "description", content: "Choose a DaskaSchool platform to continue your work." },
    ],
  }),
  component: HubPage,
});

function HubPage() {
  const { profile, email, loading, signOut } = useAuth();
  const {
    data: schoolSettings,
    isError: settingsError,
    isLoading: settingsLoading,
  } = useSchoolSettings();
  const name = profile?.full_name || email || "DaskaSchool staff";
  const role = profile?.role === "super_admin" ? "Super Admin" : "Staff";

  const showStudentManagementNotice = () => {
    toast.info(
      "Student Management is in development. Finance platform is fully live. Click ‘Open Finance Platform’ to continue.",
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5">
        <p className="text-sm text-muted-foreground" role="status">
          Loading your platforms…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#hub-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to platform choices
      </a>
      <header className="border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
            <img
              src="/main-logo.png"
              alt="DaskaSchool"
              className="size-12 object-contain dark:brightness-[1.85]"
            />
            <div>
              <p className="text-lg font-bold tracking-tight">DaskaSchool</p>
              <p className="text-sm text-muted-foreground">Run the whole school from one place.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
            <div className="text-right">
              <p className="text-sm font-semibold">{name}</p>
              <StatusBadge tone={role === "Super Admin" ? "primary" : "neutral"}>
                {role}
              </StatusBadge>
            </div>
            <Button variant="outline" className="min-h-11" onClick={signOut}>
              <LogOut aria-hidden="true" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main
        id="hub-content"
        className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-5 py-10 sm:px-8 lg:px-10 lg:py-16"
      >
        <section className="mx-auto w-full max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Platform Hub
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Choose where you want to work
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Your school operations are organised into focused platforms, so every task has a clear
            home.
          </p>
        </section>

        <section
          aria-label="DaskaSchool platforms"
          className="mx-auto mt-10 grid w-full max-w-6xl gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          <article className="surface flex min-h-full flex-col border-primary/30 p-6 shadow-lift">
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-12 items-center justify-center rounded-md bg-primary-soft text-primary">
                <Wallet className="size-6" aria-hidden="true" />
              </span>
              <StatusBadge tone="success">Live</StatusBadge>
            </div>
            <h2 className="mt-7 text-xl font-bold">Finance Management</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Fees, payments, expenses, classes and financial reporting for Divine Sources
              Praiseland High School.
            </p>
            <Button asChild className="mt-8 min-h-11 w-full sm:w-auto">
              <Link to="/dashboard">Open Finance Platform →</Link>
            </Button>
          </article>

          <article className="surface flex min-h-full flex-col bg-muted/30 p-6 opacity-90">
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <GraduationCap className="size-6" aria-hidden="true" />
              </span>
              <StatusBadge tone="neutral">Coming soon</StatusBadge>
            </div>
            <h2 className="mt-7 text-xl font-bold">Student Management</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Results, attendance, timetables, subject assignments and academic records.
            </p>
            <Button
              variant="outline"
              className="mt-8 min-h-11 w-full sm:w-auto"
              onClick={showStudentManagementNotice}
            >
              View roadmap
            </Button>
          </article>

          <article className="surface flex min-h-full flex-col bg-muted/50 p-6 opacity-75">
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Users className="size-6" aria-hidden="true" />
              </span>
              <StatusBadge tone="neutral">Planned</StatusBadge>
            </div>
            <h2 className="mt-7 text-xl font-bold">Parent Portal</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Parents access fee statements, results and communicate with the school.
            </p>
            <Button variant="outline" disabled className="mt-8 min-h-11 w-full sm:w-auto">
              Coming soon
            </Button>
          </article>
        </section>
      </main>

      <footer className="border-t border-border px-5 py-6 text-center sm:px-8">
        <p className="text-sm font-semibold">DaskaSchool · Powered by Praise Brain</p>
        <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
          {settingsLoading
            ? "Loading current session and term…"
            : settingsError
              ? "Current session and term are unavailable."
              : `${schoolSettings?.currentSession} · ${schoolSettings?.currentTerm}`}
        </p>
      </footer>
    </div>
  );
}
