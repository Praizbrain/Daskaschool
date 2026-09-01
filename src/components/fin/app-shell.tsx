import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  Bell,
  Boxes,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  School,
  Search,
  Settings,
  Target,
  Users,
  Users2,
  Wallet,
  FileBarChart,
  PanelLeftClose,
  PanelLeft,
  UserCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SCHOOL } from "@/lib/school-data";
import { useAuth } from "@/hooks/use-auth";
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

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, email, loading, signOut } = useAuth();

  const isSuperAdmin = profile?.role === "super_admin";
  const visibleNav = NAV.filter((item) => !item.superAdminOnly || isSuperAdmin);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 lg:flex",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <div className="flex items-center gap-3 px-5 py-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <School className="size-5" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight">Divine Sources</p>
              <p className="truncate text-[11px] text-muted-foreground">Finance OS</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-3">
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

        <div className="space-y-1 border-t border-sidebar-border p-3">
          <Link
            to="/settings"
            search={{ tab: "users" }}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <UserCircle2 className="size-[18px] shrink-0" />
            {!collapsed && <span>Profile</span>}
          </Link>
          <button
            onClick={signOut}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-danger-soft hover:text-destructive",
              collapsed && "justify-center px-0",
            )}
          >
            <LogOut className="size-[18px] shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? (
              <PanelLeft className="size-[18px]" />
            ) : (
              <>
                <PanelLeftClose className="size-[18px]" />
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
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <School className="size-5" />
              </span>
              <span className="min-w-0">
                <p className="truncate text-sm font-bold leading-tight">Divine Sources</p>
                <p className="truncate text-[11px] font-normal text-muted-foreground">Finance OS</p>
              </span>
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
          onOpenMobileNav={() => setMobileNavOpen(true)}
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
  onOpenMobileNav,
  onSignOut,
}: {
  isSuperAdmin: boolean;
  name: string;
  email: string;
  role: string;
  staffId: string | null;
  onOpenMobileNav: () => void;
  onSignOut: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-6 py-4 lg:px-10">
        <button
          onClick={onOpenMobileNav}
          className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-[18px]" />
        </button>

        <label className="relative flex h-11 flex-1 max-w-md items-center">
          <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search students, receipts, expenses…"
            className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </label>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <StatusBadge tone="primary">{SCHOOL.session}</StatusBadge>
          <StatusBadge tone="gold">{SCHOOL.term}</StatusBadge>
        </div>

        <button className="relative flex size-11 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Bell className="size-[18px]" />
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-destructive" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-md border border-border px-2.5 py-1.5 transition-colors hover:bg-muted">
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
              {staffId && (
                <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
                  Staff ID: {staffId}
                </p>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
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
    </header>
  );
}
