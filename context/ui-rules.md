# UI Rules

Concise rules for building/extending the Praiseland Finance Hub UI. The Lovable prototype
already established most visual patterns — these rules keep new work consistent with it and
fill in gaps the prototype didn't need to answer (since it had no real data or interaction
logic yet).

---

## Layout

- Sidebar navigation, persistent on desktop. Matches the trimmed nav in
  `context/project-overview.md` — do not add nav items for descoped pages (Inventory, Targets,
  Reports, Staff directory).
- Page content max-width and padding: match whatever the existing `__root.tsx` / route layout
  already establishes — check before introducing a new layout wrapper.
- Every content section lives in a card: white surface, `border-border`, `16px` radius, subtle
  shadow (see `ui-tokens.md`).

## Navbar / Sidebar

- Active item: primary color (`text-primary`), medium weight.
- Inactive item: `text-text-secondary`.
- Settings link only renders for Super Admin — check role before rendering, not just before
  allowing the action (a Staff user should not even see a Settings link they can't use).

## Tables

- No alternating row colors — white rows, separated by `border-border` between rows.
- Column headers: uppercase, small, muted (`text-text-secondary`).
- Row hover state: light background tint.
- Every table that can be empty needs an empty state (short muted text, optional CTA) — e.g.
  "No students yet — add your first student" on the Students page before any data exists.

## Forms

- Use `react-hook-form` + `zod` for every form (already dependencies) — do not hand-roll form
  state.
- Every required field is validated before submit; show inline errors, not just a toast.
- The Record Payment form's item checkboxes (School Fees, Books, Uniform, Sneakers, Exam Fee,
  Lesson Fee) pull default amounts from the `price_list` table — never hardcode these defaults
  in the component.
- Add Student is a **single form**, not a multi-step wizard. The original Lovable prototype
  spec called for a 6-step wizard (Bio → Guardian → Class → Fee Structure → Discount → Review)
  — this is unnecessary friction for a bursar entering one student at a time. Use logical
  section headings within one scrollable form instead.

## Buttons

- Primary action: filled, `bg-primary` (Deep Emerald), white text.
- Secondary action: outline, white background, border.
- Destructive action (e.g. delete a payment): red, and always behind a confirmation dialog —
  never a single-click destructive action anywhere in this app, since this is financial data.

## Money Formatting

- Always Naira, always formatted with `naira()` helper (already in `src/lib/school-data.ts` —
  keep this helper when the file is otherwise being replaced with real data, or move it to
  `src/lib/utils.ts`).
- Never show raw unformatted numbers for currency anywhere in the UI.

## Loading & Empty States

- Every data-fetching component has a loading state (skeleton or spinner) and an explicit empty
  state — never a blank card while data loads or when there's genuinely nothing yet.

## Role-Gated UI

- Anything Staff cannot do (edit fee structure, edit discounts, edit teacher salary, access
  Settings) must be **not rendered at all** for Staff users, not rendered-but-disabled. A
  disabled button inviting a click it can't perform is confusing for non-technical users —
  simply don't show it.

## Do Nots

- Never use `position: fixed` — use normal flow layout.
- Never stack more than 2 levels of border radius inside each other.
- Never show a raw Postgres/Supabase error message to the user — always a human-readable toast
  (sonner).
- Never build a feature's UI before its data model exists in `context/architecture.md` — if a
  page needs a field that isn't in the schema yet, stop and flag it rather than inventing a
  shadow data shape in the component.
