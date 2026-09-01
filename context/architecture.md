# Architecture

## Stack

| Layer | Tool | Purpose |
|---|---|---|
| Framework | TanStack Start (React 19, Vite 8) | Full-stack framework — file-based routing via TanStack Router, server functions |
| Auth + Database + Storage | Supabase (Postgres) | Everything — auth, all app data, file storage. One system, one dependency |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix primitives) | UI components and styling — already scaffolded by Lovable |
| Charts | Recharts | Dashboard charts, already a dependency |
| Forms | react-hook-form + zod | Form state + validation |
| Language | TypeScript strict | Throughout |

This app does **not** use Next.js. It uses TanStack Start, which is already set up in this repo
(`src/routes/`, `src/router.tsx`, `src/server.ts`, `src/start.ts`). Do not introduce Next.js
patterns (App Router conventions, `next/navigation`, etc.) — always check TanStack Start's own
docs/conventions, which may differ from generic React SSR framework assumptions.

---

## Why Supabase Auth Only (Clerk reverted)

**This project briefly used Clerk for auth (Supabase for DB only) and reverted.** Reason:
Clerk's SDK loads its client JS from a per-app subdomain
(`*.clerk.accounts.dev`), and that domain failed to resolve (`ERR_NAME_NOT_RESOLVED`) on the
developer's ISP/network during testing — the same class of DNS-level block previously hit with
Context7 CLI, which was only fixable with a system-wide VPN. That's an unacceptable risk for
this app's actual users (a school owner and bursar, non-technical, cannot be expected to
configure a VPN just to log in). One backend, one DNS dependency, is the safer choice here.

**Do not reintroduce Clerk to this project** without a real fix for the underlying network
issue being confirmed first — this was a deliberate, considered reversal, not an oversight.

Supabase Auth user IDs **are** UUIDs and map directly to `auth.uid()` in RLS policies — this
is actually simpler than the Clerk integration would have been. See "Role Model" below for how
we store Super Admin / Staff role without Clerk's `publicMetadata`.

---

## Folder Structure

```
/
├── AGENTS.md
├── context/
│   ├── project-overview.md
│   ├── architecture.md
│   ├── ui-tokens.md
│   ├── ui-rules.md
│   ├── ui-registry.md
│   ├── code-standards.md
│   ├── library-docs.md
│   ├── build-plan.md
│   └── progress-tracker.md
├── src/
│   ├── routes/
│   │   ├── __root.tsx                     → Root layout, ClerkProvider, sidebar shell
│   │   ├── login.tsx                      → Clerk sign-in page
│   │   ├── dashboard.tsx                  → Financial overview
│   │   ├── students.index.tsx             → Student list
│   │   ├── students.new.tsx               → Add student form
│   │   ├── students.$studentId.tsx        → Student profile
│   │   ├── classes.index.tsx              → Class list
│   │   ├── classes.$classId.tsx           → Class detail
│   │   ├── finance.record-payment.tsx     → Record payment
│   │   ├── expenses.tsx                   → Expense list + add
│   │   └── settings.tsx                   → School profile, fees — Super Admin only
│   ├── components/
│   │   ├── ui/                            → shadcn/ui primitives only — do not hand-edit generated parts
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Topbar.tsx
│   │   ├── dashboard/
│   │   │   ├── MetricCards.tsx
│   │   │   ├── SectionProgress.tsx
│   │   │   └── RecentActivity.tsx
│   │   ├── students/
│   │   │   ├── StudentTable.tsx
│   │   │   ├── StudentForm.tsx
│   │   │   └── PaymentHistory.tsx
│   │   ├── classes/
│   │   │   └── ClassCard.tsx
│   │   ├── finance/
│   │   │   └── RecordPaymentForm.tsx
│   │   └── expenses/
│   │       └── ExpenseForm.tsx
│   ├── lib/
│   │   ├── supabase-client.ts             → Supabase client, wired to Clerk session token
│   │   ├── clerk.ts                       → Clerk config helpers (role lookup from publicMetadata)
│   │   ├── school-data.ts                 → LEGACY dummy data from Lovable prototype — being replaced table by table, do not add new dummy data here
│   │   └── utils.ts
│   ├── server/
│   │   ├── students.ts                    → Server functions: create/update student, list students
│   │   ├── payments.ts                    → Server functions: record payment, list payments
│   │   ├── classes.ts                     → Server functions: list/update classes
│   │   ├── expenses.ts                    → Server functions: create/list expenses
│   │   └── dashboard.ts                   → Server functions: aggregate dashboard metrics
│   ├── types/
│   │   └── index.ts                       → Shared TypeScript types (mirrors DB schema)
│   ├── router.tsx
│   ├── server.ts
│   └── start.ts
```

---

## System Boundaries

| Folder | Owns |
|---|---|
| `src/routes/` | Pages only. Route loaders call `src/server/` functions. No direct Supabase calls in route components. |
| `src/server/` | All server-side data access. Every function here validates the caller's role before writing. Nothing here imports React. |
| `src/components/` | UI only. No direct Supabase calls — components receive data via props or TanStack Query, and call `src/server/` functions for mutations. |
| `src/lib/` | Third-party client setup (Supabase, Clerk helpers) and small pure utilities only. |
| `src/types/` | Shared TypeScript types, kept in sync with the DB schema by hand until we add codegen. |

---

## Role Model

Roles live in a dedicated **`profiles`** table (see schema below), one row per
`auth.users` row, linked 1:1 by `id`. A Postgres trigger creates a `profiles` row automatically
whenever a new `auth.users` row is created (see below). Role defaults to `staff` on creation and
is changed manually (directly in the Supabase table editor, or via SQL) for the Super Admin
account — no self-service role management UI in v1.

---

## Supabase Auth Integration Pattern

**Client-side Supabase client** — a single client instance, auth state handled natively by
`@supabase/supabase-js`:

```typescript
// src/lib/supabase-client.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
);
```

No custom token plumbing needed — `supabase-js` manages the session (storage, refresh, etc.)
itself once `supabase.auth.signInWithPassword(...)` succeeds.

**RLS policies use `auth.uid()` directly** — this is native Supabase Auth, so user IDs are real
UUIDs and match `auth.uid()` out of the box:

```sql
-- Example: only Super Admins can update the classes table
create policy "super_admin_can_update_classes"
on classes for update
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'super_admin'
  )
);
```

**Auto-create a profile row on signup**, via trigger (run once in the Supabase SQL editor):

```sql
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 'staff');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

Server-side (in `src/server/` functions), use a Supabase client created with the service role
key for trusted writes where appropriate, but always check the caller's role first (query
`profiles` for the authenticated user's role) before performing the write — never rely on RLS
alone on the server path, since the service role key bypasses RLS entirely.

---

## Database Schema (Supabase / Postgres)

### `profiles`
One row per `auth.users` row (see trigger above). This is how role-based access works.

| Column | Type | Notes |
|---|---|---|
| id | uuid | references `auth.users.id`, primary key |
| full_name | text | |
| role | text | `'super_admin'` or `'staff'` — default `'staff'` |
| created_at | timestamptz | |

### `school_settings`
Single-row table (one school, one tenant).

| Column | Type | Notes |
|---|---|---|
| id | int | Always `1` |
| name | text | "Divine Sources Praiseland High School" |
| address | text | |
| phone | text | |
| current_session | text | e.g. "2025 / 2026" |
| current_term | text | e.g. "Second Term" |

### `classes`

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| name | text | e.g. "JSS 2A" |
| section | text | KG / Primary / JSS / SS |
| teacher_name | text | |
| teacher_salary | numeric | Per term |
| tuition_fee | numeric | Base fee, before discount |
| books_fee | numeric | |
| other_charges | numeric | |
| created_at | timestamptz | |

### `students`

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| full_name | text | |
| admission_no | text | unique |
| class_id | uuid | references `classes.id` |
| guardian_name | text | |
| guardian_phone | text | |
| gender | text | |
| dob | date | nullable |
| address | text | nullable |
| discount | numeric | default 0 — flat amount off the class fee total |
| joined_date | date | |
| created_at | timestamptz | |

Expected fee for a student = `classes.tuition_fee + classes.books_fee + classes.other_charges -
students.discount`. Never stored — always computed at query time or in a view.

### `payments`

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| student_id | uuid | references `students.id` |
| amount | numeric | |
| items | jsonb | `[{ "label": "School Fees", "amount": 40000 }, ...]` — itemized breakdown |
| method | text | Cash / Transfer / POS |
| receipt_no | text | |
| note | text | nullable |
| received_by | uuid | references `profiles.id` — staff who recorded it |
| created_at | timestamptz | |

Outstanding balance for a student = expected fee − `sum(payments.amount where student_id = X)`.

### `expenses`

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| category | text | Salaries / Utilities / Maintenance / Inventory Purchase / Transport / Feeding / Examination / Miscellaneous |
| class_id | uuid | nullable — set when the expense is directly attributable to one class (e.g. classroom repair); null for school-wide expenses |
| amount | numeric | |
| description | text | |
| paid_to | text | |
| method | text | Cash / Transfer / POS |
| added_by | uuid | references `profiles.id` |
| created_at | timestamptz | |

### `price_list` (temporary — used by Phases 1–7 until Inventory ships in Phase 8)

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| label | text | "Books", "Uniform", "Sneakers", "Exam Fee", "Lesson Fee" |
| amount | numeric | Default price shown when this item is checked in Record Payment — editable per payment |

Once Phase 8 (Inventory) ships, a real `inventory_items` table (name, category, stock count,
cost price, sell price, sold units) replaces this table as the source of Record Payment's
default item prices — migrate `price_list` rows into `inventory_items` at that point and retire
this table. Kept minimal for now purely so Record Payment (Phase 5) has real prices to work
with before Inventory's full stock-tracking logic exists.

### `staff` (added in Phase 9)

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| full_name | text | |
| position | text | e.g. "Teacher", "Cleaner", "Security" |
| status | text | Active / Inactive |
| phone | text | nullable |
| profile_id | uuid | nullable, references `profiles.id` — set only if this staff member has an app login account |
| created_at | timestamptz | |

Once this ships, `classes.teacher_name`/`teacher_salary` (currently free-text/number) becomes a
foreign key to `staff.id` instead — update the `classes` table and Phase 4 code accordingly.

### `inventory_items` (added in Phase 8)

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| name | text | |
| category | text | |
| stock_count | integer | |
| cost_price | numeric | |
| sell_price | numeric | This becomes Record Payment's source of default item prices, replacing `price_list` |
| sold_units | integer | default 0, incremented when a payment includes this item |

### `targets` (added in Phase 11)

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| class_id | uuid | nullable — null means a school-wide target |
| section | text | nullable — alternative to `class_id` for a section-wide target (KG/Primary/JSS/SS) |
| amount | numeric | The collection goal |
| deadline | date | |
| term | text | Which term this target applies to |
| created_at | timestamptz | |

### `audit_log` (added in Phase 12)

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| actor_id | uuid | references `profiles.id` |
| action | text | e.g. "updated_fee_structure", "updated_discount", "updated_school_settings" |
| target_table | text | Which table was changed |
| target_id | uuid | nullable — which row |
| details | jsonb | Before/after values or a human-readable summary |
| created_at | timestamptz | |

Append-only — never updated or deleted. Super Admin read access only.

---

## Data Flow

### UI Mutations (Server Functions)

```
User interaction in component
        ↓
TanStack Start server function in src/server/
        ↓
Role check (Clerk session, server-side)
        ↓
Supabase write (service role, since role already verified)
        ↓
TanStack Query cache invalidated → UI refetches
```

### Dashboard Aggregates

```
Dashboard route loader
        ↓
src/server/dashboard.ts — runs aggregate queries against
classes + students + payments + expenses
        ↓
Returns computed totals — never pre-stored, always live
```

---

## Invariants

Rules the AI agent must never violate:

- Route components in `src/routes/` contain no direct Supabase calls — always go through
  `src/server/`.
- `src/server/` functions never import from `src/components/`.
- Every write in `src/server/` checks the caller's role (query `profiles`) before writing — RLS
  is the safety net, not the only check, since server functions may use the service role key.
- Role checks always go through the `profiles` table — never invent a second source of truth
  for role.
- Never hardcode a fee, salary, or discount value in a component — always read from `classes`,
  `students`, or `school_settings`.
- No hardcoded hex values or raw Tailwind color classes in components — use CSS variable tokens
  from `context/ui-tokens.md`.
- Every Supabase write is wrapped in try/catch and surfaces a human-readable error via toast
  (sonner, already a dependency) — never a raw Postgres error message.
- `src/lib/school-data.ts` (the Lovable dummy data) is removed table-by-table as each real
  feature is wired up per `context/build-plan.md` — never add new dummy data to it.
