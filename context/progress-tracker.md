# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately
know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 1 — Foundation, in progress.
**Last completed:** Real Supabase Auth sign-in working on the index route (`signInWithPassword`).
**Next:** Database Setup — create tables, trigger, RLS policies, seed real school data.

---

## Progress

### Phase 1 — Foundation

- [x] 01 Supabase Auth Setup — **confirmed working end-to-end**: real sign-in via
      `supabase.auth.signInWithPassword`, redirects to `/dashboard` successfully. Dashboard
      still shows Lovable's hardcoded dummy data — real data comes in Phase 2.
- [x] 02 Database Setup — next up: create tables, trigger, RLS, seed data
- [x] 03 Root Layout + Role-Gated Navigation + Dark Mode Theme Toggle (desktop & mobile)

### Phase 2 — Dashboard

- [ ] 04 Dashboard UI
- [ ] 05 Dashboard — Real Data

### Phase 3 — Students

- [ ] 06 Students List + Profile UI
- [ ] 07 Students — Real Data

### Phase 4 — Classes

- [ ] 08 Classes List + Detail UI
- [ ] 09 Classes — Real Data

### Phase 5 — Finance

- [ ] 10 Record Payment UI
- [ ] 11 Record Payment — Real Data

### Phase 6 — Expenses

- [ ] 12 Expenses UI
- [ ] 13 Expenses — Real Data

### Phase 7 — Settings (Core)

- [ ] 14 Settings UI + Logic (Core)

### Phase 8 — Inventory

- [ ] 15 Inventory UI
- [ ] 16 Inventory — Real Data

### Phase 9 — Staff

- [ ] 17 Staff Directory UI
- [ ] 18 Staff — Real Data

### Phase 10 — Reports

- [ ] 19 Reports UI
- [ ] 20 Reports — Real Data + Export

### Phase 11 — Targets

- [ ] 21 Targets UI
- [ ] 22 Targets — Real Data

### Phase 12 — Settings (Full)

- [ ] 23 Settings — Full Admin Panel

---

## Decisions Made During Build

- Auth: **Clerk was tried first, then reverted to Supabase Auth.** Clerk's client JS
  (`*.clerk.accounts.dev`) failed to resolve on the developer's network — same DNS-block pattern
  as the earlier Context7 CLI issue, only fixable with a system-wide VPN. Unacceptable for real
  users (school owner, bursar — non-technical). Supabase Auth used instead: one backend, one
  DNS dependency, no separate third-party auth domain.
- Database/Storage: Supabase.
- Framework: TanStack Start (already scaffolded by Lovable) — not Next.js.
- Scope: **full scope confirmed** — every page from the Lovable prototype ships (Dashboard,
  Students, Classes, Finance, Inventory, Expenses, Staff, Reports, Targets, Settings). An
  earlier trimmed-scope plan (cutting Inventory/Staff/Reports/Targets) was proposed and then
  explicitly overridden by Praise — nothing is descoped. What changed instead is build
  _order_: 12 phases / 23 features, core financial loop first since later phases (Reports,
  Targets, Staff salary view, Inventory sold-units tracking) all depend on that data being real.
  See `project-overview.md` "Full Scope" and `build-plan.md` for the phase sequence.
- Roles: Super Admin + Staff only in v1, stored in a `profiles` table (not a third-party auth
  provider's metadata). HM and Teacher roles deferred.

---

## Notes

- **Future framework decision (not urgent, don't act on this yet):** v1 (Divine Sources,
  single-tenant) stays on TanStack Start — it's the working foundation Lovable already built,
  and rebuilding it in another framework now isn't worth the time for an unglamorous CRUD app.
  If/when this becomes the multi-tenant "LedgerSchool" SaaS product (see the multi-tenancy
  discussion — `schools` table, `school_id` on every row, Clerk Organizations or equivalent),
  **the plan is to rebuild on Next.js** at that point — bigger ecosystem, more mature
  AI-agent/library support, and consistency with Praise's other projects (czar-web). Do not
  start that migration prematurely; this is a noted future decision, not a current task.

_Add notes here as the build progresses — workarounds, patterns, anything that differs from
the context files._
