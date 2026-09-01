# Code Standards

Implementation rules and conventions for this project. Follow these in every session without
exception — they prevent pattern drift across AI agent sessions.

---

## Engineering Mindset

- **Think before implementing** — understand what's being built and why before writing a line.
- **Read context files first** — never assume, always verify against `architecture.md` and
  `project-overview.md`.
- **Scope is sacred** — only build what the current `build-plan.md` phase requires. Never
  resurrect a descoped Lovable-prototype feature (Inventory stock, Targets, Reports exports,
  full Settings/audit-log panel, Staff HR directory) without an explicit decision to do so.
- **Every feature must be testable** — if it can't be clicked through and verified right after
  building, it's incomplete.
- **Clean over clever** — simple, readable code a junior developer could follow.
- **One thing at a time** — finish one feature fully before starting the next.
- **Failures are expected** — every Supabase call wrapped in try/catch, every failure surfaced
  as a human-readable toast, never a crash.

---

## TypeScript

- Strict mode — no exceptions.
- Never use `any` — use `unknown` and narrow.
- Never use type assertions (`as SomeType`) unless unavoidable, and comment why.
- All function parameters and return types explicitly typed.
- `type` for object shapes/unions; `interface` only for extendable component props.
- All async functions have proper error handling — never a floating unhandled promise.
- `const` by default; `let` only when reassignment is genuinely needed.

---

## TanStack Start Conventions

- File-based routing in `src/routes/` via TanStack Router — do not introduce Next.js App
  Router conventions (`app/`, `next/navigation`, Server Components/Client Components split).
  This project has no such split; check TanStack Start's actual docs before assuming an API,
  since it is a fast-moving framework and training data may be outdated.
- Data loading happens in route loaders, calling functions from `src/server/` — never fetch
  directly inside a route component's render body.
- Mutations go through `src/server/` functions, called from components via TanStack Query
  mutations (`useMutation`) — not inline `fetch` calls.
- After a mutation, invalidate the relevant TanStack Query key so the UI reflects the new data
  — never manually patch local state as a substitute for refetching.

---

## File and Folder Naming

- Folders: kebab-case.
- Component files: PascalCase — `StudentTable.tsx`, `RecordPaymentForm.tsx`.
- Utility files: camelCase — `utils.ts`, `supabase-client.ts`.
- Server function files: camelCase, grouped by domain — `students.ts`, `payments.ts`.
- One component per file — never export multiple components from one file.
- Index files only in `components/ui/` — never barrel-export from other folders.

---

## Component Structure

```typescript
// 1. External imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Internal imports
import { StudentTable } from "@/components/students/StudentTable";

// 3. Type definitions
type Props = {
  classId: string;
};

// 4. Component
export function ComponentName({ classId }: Props) {
  // state
  // derived values
  // handlers
  // return JSX
}
```

- Named exports only — never default exports for components.
- Props type defined directly above the component, not in a separate file unless shared across
  multiple components.
- No inline styles — Tailwind classes using tokens from `ui-tokens.md` only.

---

## Server Functions

```typescript
// src/server/payments.ts
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const recordPayment = createServerFn({ method: "POST" })
  .validator((input: RecordPaymentInput) => input)
  .handler(async ({ data }) => {
    try {
      const supabase = createClient(/* url, service role key */);
      const { data: { user } } = await supabase.auth.getUser(/* token from request */);
      if (!user) throw new Error("Not authenticated");
      // Staff and Super Admin can both record payments — no role check needed here.
      // Roles that need restriction (e.g. editing fee structure) DO look up
      // profiles.role === "super_admin" before writing (see library-docs.md).

      // ... Supabase write

      return { success: true, data: result };
    } catch (error) {
      console.error("[server/payments/recordPayment]", error);
      return { success: false, error: "Failed to record payment. Please try again." };
    }
  });
```

- Every server function has a try/catch.
- Every server function validates its input (zod) before processing.
- Errors are logged with a `[server/domain/functionName]` prefix.
- Always return `{ success: boolean, data?: T, error?: string }` — never return raw data or
  throw uncaught from a server function.
- Every write-type server function checks the caller's role where the action is
  Super-Admin-only (fee structure, discounts, teacher salary, school settings) — even though
  RLS is also enabled, never rely on RLS alone when using a service-role Supabase client
  server-side.

---

## Error Handling

- Never an empty catch block — always log or handle.
- Console errors always prefixed with context: `[component/function name]`.
- User-facing errors are human-readable — never a raw Postgres/Supabase message.
- API/server errors return a generic message to the client; log the real error server-side.

---

## Environment Variables

| Variable | Used In |
|---|---|
| `VITE_SUPABASE_URL` | `src/lib/supabase-client.ts` |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase-client.ts` (client-side, RLS-scoped) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — `src/server/` functions. **Never** expose to the client, never prefix with `VITE_`. |

`VITE_` prefix means the variable is exposed to the browser bundle. Never add it to a secret
key.

---

## Comments

- No comments explaining what code does — code should be self-explanatory.
- Comments only for *why* — a non-obvious decision (e.g. why a field is nullable, why an
  invariant from `architecture.md` is being enforced here).
- Never leave TODO comments in committed code — either do it, or track it in
  `progress-tracker.md`.

---

## Dependencies

Never install a new package without a clear reason. Check first:
1. Does shadcn/ui already have this component?
2. Does the existing dependency list already cover this?
3. Is there a simpler native solution?

**Already approved** (from the existing `package.json` — do not remove without reason):
`@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/react-query`, `react-hook-form`,
`@hookform/resolvers`, `zod`, `recharts`, `date-fns`, `sonner`, `lucide-react`, `tailwindcss`,
`@tailwindcss/vite`, all `@radix-ui/*` primitives, `class-variance-authority`, `clsx`,
`tailwind-merge`.

**To be added for this phase of work** — see `library-docs.md` for usage patterns:
`@supabase/supabase-js` (auth, database, and storage — the only backend dependency this project
needs).

Do not install any other package without updating this list first.
