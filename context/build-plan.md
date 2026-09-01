# Build Plan

## Core Principle

The Lovable prototype already gave us full UI with mock data for every one of these pages —
reuse and adapt it rather than rebuilding from a blank page. For any net-new UI, build it with
mock data first, verify visually, then wire real logic. Every feature must be clickable and
testable before moving to the next. No invisible backend phases.

**Nothing here is descoped** — Inventory, Staff, Reports, and Targets are all real, planned
phases below, not cut features. They're sequenced later only because they depend on the core
financial data (students, classes, payments, expenses) being real first — see
`project-overview.md` "Full Scope" for why.

---

## Phase 1 — Foundation

### 01 Supabase Auth Setup

- Create Supabase project (done — see progress-tracker.md).
- Install `@supabase/supabase-js`.
- Build the sign-in form (index route) using `supabase.auth.signInWithPassword(...)`.
- `onAuthStateChange` in the root layout to drive auth guards on every protected route —
  redirect to `/` (the login page) if signed out.
- Manually create two Supabase Auth users (Super Admin, Staff).

### 02 Database Setup

- Create all tables from `architecture.md`: `profiles`, `school_settings`, `classes`,
  `students`, `payments`, `expenses`, `price_list`.
- Add the `handle_new_user` trigger (see `architecture.md`) so every new `auth.users` row gets
  a matching `profiles` row automatically, defaulting to `role = 'staff'`.
- Manually set the Super Admin account's `profiles.role` to `'super_admin'`.
- Enable RLS on every table, including `profiles` itself. Write policies per the pattern in
  `library-docs.md`.
- Seed `school_settings` with the real school info, `classes` with the real 12 classes
  (KG 1/2, Primary 1–6, JSS 1–3, SS 1–3 or whatever the mother's actual class list is — confirm
  exact list with Praise before seeding), and `price_list` with the real item prices.

### 03 Root Layout + Role-Gated Navigation

- Sidebar with the full nav: Dashboard, Students, Classes, Finance, Inventory, Expenses, Staff,
  Reports, Targets, Settings (Settings hidden entirely for Staff role — the rest are visible to
  both roles even before their real data is wired, per the phase order below).
- Topbar: current session/term (from `school_settings`), user menu (profile + logout, backed by
  `supabase.auth.signOut()`).

---

## Phase 2 — Dashboard

### 04 Dashboard UI

Reuse the existing Lovable dashboard layout (`src/routes/dashboard.tsx`) — it already matches
the target design. Metric cards: Expected Revenue, Collected Revenue, Outstanding Revenue,
Estimated Net Profit, Today's Revenue, Today's Expenses. Section collection progress (KG /
Primary / JSS / SS). Recent Payments, Recent Expenses. Quick actions (Add Student, Record
Payment, Add Expense).

### 05 Dashboard — Real Data

- `src/server/dashboard.ts` — aggregate queries computing every metric live from `classes`,
  `students`, `payments`, `expenses` (formulas in `project-overview.md`).
- Replace all reads from `src/lib/school-data.ts` on this page with real queries.
- Empty states for a brand-new school with no data yet.

---

## Phase 3 — Students

### 06 Students List + Profile UI

Reuse existing student table and profile layout. Simplify Add Student from the original 6-step
wizard to one scrollable form (per `ui-rules.md`).

### 07 Students — Real Data

- `src/server/students.ts` — list, get by id, create, update.
- Student list shows computed `outstanding` and `status` (Paid / Part Payment / Owing) derived
  from `classes` fee fields + `students.discount` + `sum(payments.amount)` — never stored.
- Discount field editable by Super Admin only.

---

## Phase 4 — Classes

### 08 Classes List + Detail UI

Reuse existing class cards. Each shows: students count, expected revenue, collected revenue,
outstanding, collection %. Detail page adds: teacher name/salary, direct class expenses, net
class profit.

### 09 Classes — Real Data

- `src/server/classes.ts` — list, get by id, update (Super Admin only — fee structure, teacher
  salary).
- Class profit formula from `project-overview.md`, computed live.

---

## Phase 5 — Finance / Record Payment

### 10 Record Payment UI

Reuse existing form: search student, checkboxes for item types (pulling default amounts from
`price_list`), amount, method, receipt number, note.

### 11 Record Payment — Real Data

- `src/server/payments.ts` — create payment (Staff and Super Admin both allowed), list payments
  for a student.
- On save: invalidate student, class, and dashboard queries so numbers update everywhere
  immediately.
- Generate a simple on-screen receipt view after saving (print-friendly, no PDF library needed
  for v1 — browser print is enough).

---

## Phase 6 — Expenses

### 12 Expenses UI

Reuse existing expense table + add-expense form (category, amount, description, date, paid to,
method, optional class attribution).

### 13 Expenses — Real Data

- `src/server/expenses.ts` — create, list.
- Feeds directly into Estimated Net Profit on the Dashboard and, when class-attributed, into
  that class's net profit.

---

## Phase 7 — Settings (Super Admin only)

### 14 Settings UI + Logic (Core)

- School profile (name, address, phone) — edit form.
- Current session/term — edit form.
- Per-class fee structure and teacher salary — edit form (reuses Class detail edit logic).
- Full audit log, multi-bank-account config, and self-service user management UI are built in
  Phase 11 (Settings — Full), once the core loop is proven — see below. This phase ships the
  essentials Settings needs from day one; it isn't the final Settings page.

---

## Phase 8 — Inventory

### 15 Inventory UI

Reuse existing Lovable inventory layout. Item list: name, category, stock count, cost price,
sell price, sold units. Add/edit item form. Low-stock indicator.

### 16 Inventory — Real Data

- `src/server/inventory.ts` — list, create, update items; record a "sold" decrement when a
  payment includes that item (link to Record Payment's item checkboxes).
- Item prices here are what actually populates the Record Payment form's default amounts —
  replaces the placeholder `price_list` table introduced in Phase 1 (migrate that data into
  real inventory items here, then the `price_list` table can be retired).
- Low-stock alerts on the Dashboard's quick-glance area (optional add-on once base data flows).

---

## Phase 9 — Staff

### 17 Staff Directory UI

Reuse existing Lovable staff layout. Staff list: name, role/position, status, contact info,
assigned class(es) if a teacher. Add/edit staff form.

### 18 Staff — Real Data

- `src/server/staff.ts` — list, create, update. Distinct from `profiles` (login accounts) —
  `staff` is the HR record (can include non-login staff like cleaners or security, who never
  need app access); a `profiles.id` foreign key links a staff record to a login account only
  when that staff member actually has one.
- Class `teacher_name`/`teacher_salary` fields (Phase 4) become a proper foreign key into
  `staff` once this phase ships, rather than free-text — update Classes accordingly.

---

## Phase 10 — Reports

### 19 Reports UI

Reuse existing Lovable reports layout. Report type selector (revenue, expenses, outstanding
balances, class profitability, etc.), date range picker, results table/chart.

### 20 Reports — Real Data + Export

- `src/server/reports.ts` — each report type as its own query against real
  `payments`/`expenses`/`students`/`classes` data, date-range filtered.
- PDF export (see `/mnt/skills/public/pdf` skill), Excel/CSV export (see `/mnt/skills/public/xlsx`
  skill) — read the relevant skill before implementing either.

---

## Phase 11 — Targets

### 21 Targets UI

Reuse existing Lovable targets layout. Collection target per class/section/term, deadline,
progress ring/bar.

### 22 Targets — Real Data

- `src/server/targets.ts` — create/list targets, compute live progress from actual collected
  revenue against the target amount and deadline.
- Dashboard quick-glance: highlight classes falling behind their target.

---

## Phase 12 — Settings (Full)

### 23 Settings — Full Admin Panel

- Audit log: a `audit_log` table capturing who changed what (fee structure, discounts, salary,
  school settings) and when — append-only, Super Admin read access.
- Multi-bank-account configuration, if the school actually banks with more than one account —
  confirm this is genuinely needed with Praise before building it.
- Self-service user management UI (create/deactivate staff login accounts, assign role) —
  replaces the manual Supabase-dashboard account creation used since Phase 1.

---

## Phase Gate

After each phase: update `progress-tracker.md`, update `ui-registry.md` for any new/changed
components, and confirm the feature is clickable end-to-end with real data before starting the
next phase.

## Feature Count

| Phase | Features |
|---|---|
| Phase 1 — Foundation | 3 |
| Phase 2 — Dashboard | 2 |
| Phase 3 — Students | 2 |
| Phase 4 — Classes | 2 |
| Phase 5 — Finance | 2 |
| Phase 6 — Expenses | 2 |
| Phase 7 — Settings (Core) | 1 |
| Phase 8 — Inventory | 2 |
| Phase 9 — Staff | 2 |
| Phase 10 — Reports | 2 |
| Phase 11 — Targets | 2 |
| Phase 12 — Settings (Full) | 1 |
| **Total** | **23** |
