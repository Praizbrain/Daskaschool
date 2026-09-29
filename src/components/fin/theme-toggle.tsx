import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: "default" | "sm";
}

export function ThemeToggle({ className, size = "default" }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative flex items-center justify-center rounded-md border border-border text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        size === "default" ? "size-11" : "size-9",
        className,
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun
        className={cn(
          "size-[18px] transition-all duration-300",
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0 absolute",
        )}
      />
      <Moon
        className={cn(
          "size-[18px] transition-all duration-300",
          isDark ? "rotate-90 scale-0 opacity-0 absolute" : "rotate-0 scale-100 opacity-100",
        )}
      />
    </button>
  );
}

export function ThemeToggleRow({
  className,
  onToggle,
}: {
  className?: string;
  onToggle?: () => void;
}) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const handleClick = () => {
    toggleTheme();
    onToggle?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="flex items-center gap-3">
        {isDark ? (
          <Sun className="size-[18px] shrink-0" />
        ) : (
          <Moon className="size-[18px] shrink-0" />
        )}
        <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
      </div>
      <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
}
