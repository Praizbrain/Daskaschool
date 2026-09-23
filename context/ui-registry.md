# UI Registry

Living document. Updated after every component is built or meaningfully changed. Read this
before building any new component — match existing patterns exactly before inventing new ones.

Note: the Lovable prototype already built a full shadcn/ui component set in `src/components/ui/`
and a first pass of page-level components. As those are reused or rewired to real data, add
them here with their actual file path and any project-specific patterns worth remembering
(e.g. "StudentTable expects `Student[]` with computed `outstanding` field, not raw DB rows").

---

## How to Use

Before building any component:

1. Check if a similar component already exists here, or in `src/components/`.
2. If yes — match its exact patterns and props shape.
3. If no — build it following `ui-rules.md` and `ui-tokens.md`, then add it here.

After building or changing any component — update this file with the component name, file
path, props shape, and any non-obvious behavior.

---

## Components

### ThemeToggle & ThemeToggleRow
- **File**: `src/components/fin/theme-toggle.tsx`
- **Context/Hook**: `src/lib/theme-provider.tsx` (`useTheme()`)
- **Props**:
  - `ThemeToggle`: `{ className?: string; size?: "default" | "sm" }` — icon-only button with animated Sun/Moon transition, accessible aria-label and title.
  - `ThemeToggleRow`: `{ className?: string; onToggle?: () => void }` — full-width item with icon, label ("Dark Mode" / "Light Mode"), and current mode badge.
- **Behavior**: Toggles between light and dark modes, persists in `localStorage` under `daskaschool-theme`, applies `.dark` to `document.documentElement`, supports system preference, and includes anti-FOUC inline script in `__root.tsx`.

### AppShell
- **File**: `src/components/fin/app-shell.tsx`
- **Behavior**: Application chrome with responsive TopBar (hamburger, search, session/term badges, ThemeToggle, notifications Bell, user profile dropdown) and responsive collapsible desktop sidebar (`w-[264px]` expanded, `w-[76px]` collapsed with icon-only nav). `nav` has `min-h-0 overflow-y-auto` so sidebar footer and collapse/expand buttons remain pinned and visible on any viewport height. Sidebar toggle is also available in `TopBar` when collapsed.
