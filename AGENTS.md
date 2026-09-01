<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## About This Repository

This is **Praiseland Finance Hub** (product name: **Divine Sources Finance OS**) — a school
bookkeeping and finance web app built specifically for Divine Sources Praiseland High School,
Benin City, Edo State, Nigeria. It is an internal-staff-only tool. There are no parent-facing
or student-facing features, and there is no multi-school support — this is a single-tenant app
for one school.

The Lovable-generated UI already exists in this repo as a **click-through prototype with
hardcoded dummy data** (`src/lib/school-data.ts`). That prototype was intentionally broader
than v1 — it explored 15 pages including Inventory stock management, Targets, multi-format
Reports, and a full Settings/audit-log panel. **We are not building all of that.** This repo is
now being turned into a real, working, database-backed app scoped to a deliberately trimmed
v1. See `context/project-overview.md` for exactly what's in and out of scope, and why.

The purpose of the product: help the school owner (Super Admin) and bursar/secretary (Staff)
track school fees, student payments, class-linked teacher salaries, and expenses — so the
owner can see revenue, outstanding balances, and profit at a glance, and stay compliant.

## Read Before Anything Else

Read in this exact order before any implementation:

1. .memory.md — the running session log. Read this FIRST — it tells you exactly what actually
   happened and where the last session stopped, which context/*.md alone won't tell you.
2. context/project-overview.md
3. context/architecture.md
4. context/ui-tokens.md
5. context/ui-rules.md
6. context/ui-registry.md
7. context/code-standards.md
8. context/library-docs.md
9. context/build-plan.md
10. context/progress-tracker.md

## Rules That Never Change

- Never use hardcoded hex values or raw Tailwind color classes — always use the CSS variable
  tokens defined in context/ui-tokens.md.
- Never hardcode a fee amount, discount, salary, or school-configuration value in a component —
  every figure comes from the database (classes, students, school_settings tables) via
  Supabase, never from a constant in code.
- Never add a feature or page that isn't in the current phase of context/build-plan.md yet,
  even though it's part of the full product scope — build order matters (see
  project-overview.md "Full Scope"). Inventory, Staff, Reports, and Targets are all in scope
  and will be built — just not ahead of the phase that precedes them in build-plan.md.
- Never add parent/guardian or student-facing login. This app is internal-staff-only.
- Row Level Security is the only access-control mechanism — every table must have RLS enabled
  and a policy scoped by role. Never rely on hiding UI elements alone to restrict access.
- Update context/progress-tracker.md and context/ui-registry.md after every feature.
- Add a new dated entry to the TOP of .memory.md after completing any feature, fixing any real
  bug, or making any decision worth remembering — see the instructions at the top of that file
  for exactly how. Never delete or rewrite old entries there — append-only.
- Before using any third-party library, check context/library-docs.md for the project-specific
  pattern first — general training knowledge on library APIs may be outdated.
- If the same problem persists after one corrective prompt — stop and flag it rather than
  trying a third and fourth approach blind.

## Stack Summary

React 19 + TanStack Start/Router + Vite + Tailwind v4 + shadcn/ui (Radix primitives) +
Supabase (Postgres, Auth, Storage) — see context/architecture.md for the full breakdown.
