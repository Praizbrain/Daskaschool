import { Link, useRouterState } from "@tanstack/react-router";
import { GlobalSearchBar } from "@/components/fin/search-bar";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import {
  Bell,
  Boxes,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  Target,
  Users,
  Users2,
  Wallet,
  FileBarChart,
  PanelLeftClose,
  PanelLeft,
  UserCircle2,
  Copy,
  Check,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageLoadingSkeleton } from "@/components/fin/loading-skeleton";
import { SCHOOL } from "@/lib/school-data";
import { useAuth } from "@/hooks/use-auth";
import { useSchoolSettings } from "@/hooks/use-settings";
import { useTheme } from "@/lib/theme-provider";
import { ThemeToggle, ThemeToggleRow } from "@/components/fin/theme-toggle";
import { InitialAvatar, StatusBadge } from "@/components/fin/primitives";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, superAdminOnly: false },
  { to: "/students", label: "Students", icon: Users, superAdminOnly: false },
  { to: "/classes", label: "Classes", icon: GraduationCap, superAdminOnly: false },
  { to: "/finance", label: "Finance", icon: Wallet, superAdminOnly: false },
  { to: "/inventory", label: "Inventory", icon: Boxes, superAdminOnly: false },
  { to: "/expenses", label: "Expenses", icon: Receipt, superAdminOnly: false },
  { to: "/staff", label: "Staff", icon: Users2, superAdminOnly: false },
  { to: "/reports", label: "Reports", icon: FileBarChart, superAdminOnly: false },
  { to: "/targets", label: "Targets", icon: Target, superAdminOnly: false },
  { to: "/settings", label: "Settings", icon: Settings, superAdminOnly: true },
] as const;

function StaffIdCopyRow({ staffId }: { staffId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(staffId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [staffId]);

  return (
    <span className="flex items-center gap-1 font-mono text-[11px] tracking-wide text-muted-foreground">
      <span>Staff ID: {staffId}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Copy Staff ID"
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      </button>
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, email, loading, signOut } = useAuth();
  const { data: schoolData } = useSchoolSettings();

  const isSuperAdmin = profile?.role === "super_admin";
  const visibleNav = NAV.filter((item) => !item.superAdminOnly || isSuperAdmin);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        {/* Sidebar skeleton — matches the real sidebar width */}
        <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
          <div className="animate-pulse px-5 py-6">
            <div className="flex items-center gap-3">
              <div className="size-10 shrink-0 rounded-md bg-muted" />
              <div className="space-y-2">
                <div className="h-3.5 w-24 rounded-md bg-muted" />
                <div className="h-3 w-16 rounded-md bg-muted" />
              </div>
            </div>
            <div className="mt-8 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-md px-3 py-2.5">
                  <div className="size-[18px] rounded bg-muted" />
                  <div
                    className="h-3.5 rounded-md bg-muted"
                    style={{ width: `${60 + (i % 3) * 20}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Content area skeleton */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar skeleton */}
          <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-[1440px] animate-pulse items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6 lg:px-10">
              <div className="size-10 shrink-0 rounded-md bg-muted sm:size-11 lg:hidden" />
              <div className="h-10 sm:h-11 flex-1 max-w-md rounded-md bg-muted" />
              <div className="ml-auto hidden items-center gap-2 md:flex">
                <div className="h-6 w-20 rounded-full bg-muted" />
                <div className="h-6 w-16 rounded-full bg-muted" />
              </div>
              <div className="flex items-center gap-2 sm:gap-3 ml-auto md:ml-0">
                <div className="size-10 sm:size-11 rounded-md bg-muted" />
                <div className="size-10 sm:size-11 rounded-md bg-muted" />
                <div className="h-10 w-10 sm:w-28 rounded-md bg-muted" />
              </div>
            </div>
          </header>

          {/* Main content skeleton */}
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-8 lg:px-10 lg:py-10">
            <PageLoadingSkeleton metricCards={4} />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col justify-between border-r border-sidebar-border bg-sidebar transition-all duration-300 lg:flex z-40 select-none",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <div
          className={cn(
            "flex items-center px-4 py-5 shrink-0 border-b border-sidebar-border/40",
            collapsed ? "flex-col gap-3 justify-center" : "justify-between gap-3",
          )}
        >
          <div className={cn("flex items-center min-w-0", collapsed && "justify-center")}>
            {collapsed ? (
              <span className="flex size-12 shrink-0 items-center justify-center rounded-md overflow-hidden">
                <img src="/main-logo.png" alt="DaskaSchool" className="size-12 object-contain" />
              </span>
            ) : (
              <img
                src="/primary-horizontal-logo.png"
                alt="DaskaSchool"
                className="h-10 w-auto object-contain dark:brightness-[1.85]"
              />
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="size-[18px]" />
            ) : (
              <PanelLeftClose className="size-[18px]" />
            )}
          </button>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto space-y-1 px-3 py-3">
          {visibleNav.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
                title={item.label}
              >
                <item.icon className="size-[18px] shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-sidebar-border p-3 shrink-0 bg-sidebar">
          {collapsed ? (
            <div className="flex justify-center py-1">
              <ThemeToggle size="sm" />
            </div>
          ) : (
            <ThemeToggleRow />
          )}
          <Link
            to="/settings"
            search={{ tab: "users" }}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
            title="Profile"
          >
            <UserCircle2 className="size-[18px] shrink-0" />
            {!collapsed && <span>Profile</span>}
          </Link>
          <button
            type="button"
            onClick={signOut}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-danger-soft hover:text-destructive",
              collapsed && "justify-center px-0",
            )}
            title="Logout"
          >
            <LogOut className="size-[18px] shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-0 bg-muted/60 text-foreground hover:bg-muted",
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="size-[18px]" />
            ) : (
              <>
                <PanelLeftClose className="size-[18px] shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[264px] bg-sidebar p-0 text-sidebar-foreground">
          <SheetHeader className="border-b border-sidebar-border px-5 py-6">
            <SheetTitle className="flex items-center gap-3 text-left">
              <img
                src="/primary-horizontal-logo.png"
                alt="DaskaSchool"
                className="h-10 w-auto object-contain dark:brightness-[1.85]"
              />
            </SheetTitle>
          </SheetHeader>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {visibleNav.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="size-[18px] shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="space-y-1 border-t border-sidebar-border p-3">
            <ThemeToggleRow onToggle={() => setMobileNavOpen(false)} />
            <button
              onClick={() => {
                setMobileNavOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-danger-soft hover:text-destructive"
            >
              <LogOut className="size-[18px] shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          isSuperAdmin={isSuperAdmin}
          name={profile?.full_name ?? "—"}
          email={email ?? ""}
          role={isSuperAdmin ? "Super Admin" : "Staff"}
          staffId={profile?.staff_id ?? null}
          session={schoolData?.currentSession ?? SCHOOL.session}
          term={schoolData?.currentTerm ?? SCHOOL.term}
          isSidebarCollapsed={collapsed}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onToggleDesktopSidebar={() => setCollapsed((c) => !c)}
          onSignOut={signOut}
        />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function TopBar({
  isSuperAdmin,
  name,
  email,
  role,
  staffId,
  session,
  term,
  isSidebarCollapsed,
  onOpenMobileNav,
  onToggleDesktopSidebar,
  onSignOut,
}: {
  isSuperAdmin: boolean;
  name: string;
  email: string;
  role: string;
  staffId: string | null;
  session: string;
  term: string;
  isSidebarCollapsed: boolean;
  onOpenMobileNav: () => void;
  onToggleDesktopSidebar: () => void;
  onSignOut: () => void;
}) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6 lg:px-10">
        <button
          onClick={onOpenMobileNav}
          className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:size-11 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-[18px]" />
        </button>

        {isSidebarCollapsed && (
          <button
            type="button"
            onClick={onToggleDesktopSidebar}
            className="hidden size-11 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeft className="size-[18px]" />
          </button>
        )}

        <GlobalSearchBar />

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <StatusBadge tone="primary">{session}</StatusBadge>
          <StatusBadge tone="gold">{term}</StatusBadge>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto md:ml-0">
          <ThemeToggle className="size-10 sm:size-11 shrink-0" />

          <button
            type="button"
            className="relative flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="size-[18px]" />
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-destructive" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 sm:gap-3 rounded-md border border-border px-2 py-1.5 sm:px-2.5 transition-colors hover:bg-muted">
                <InitialAvatar name={name} size="sm" />
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-semibold leading-tight">{name}</span>
                  <span className="block text-[11px] text-muted-foreground">{role}</span>
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-md">
              <DropdownMenuLabel className="space-y-1">
                <p className="text-sm font-semibold">{email}</p>
                {staffId && <StaffIdCopyRow staffId={staffId} />}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={toggleTheme}>
                {isDark ? <Sun className="mr-2 size-4" /> : <Moon className="mr-2 size-4" />}
                <span>{isDark ? "Switch to light mode" : "Switch to dark mode"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" search={{ tab: "users" }}>
                  My profile
                </Link>
              </DropdownMenuItem>
              {isSuperAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/settings" search={{ tab: "school" }}>
                    School settings
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onSignOut} className="text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
