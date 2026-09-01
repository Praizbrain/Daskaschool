# UI Tokens

Design tokens for Praiseland Finance Hub. These are the tokens the Lovable prototype was
originally briefed with (see repo `README.md`) — "Deep Emerald + Warm Gold," a premium,
trustworthy financial-dashboard feel. Match these exactly; do not introduce new colors, and
never use raw Tailwind color classes.

---

## How to Use

Check `src/styles.css` first — Tailwind v4 tokens are defined via `@theme`, no
`tailwind.config.ts`. If a token below isn't yet defined there, add it to `@theme` rather than
hardcoding the hex value in a component.

```tsx
// Correct
className="bg-surface text-text-primary border-border"

// Never
className="bg-[#0F766E] text-[#111827]"

// Never
className="bg-emerald-700 text-gray-900"
```

---

## Color System

| Role | Token | Hex |
|---|---|---|
| Primary | `--color-primary` | `#0F766E` (Deep Emerald) |
| Secondary / accent | `--color-secondary` | `#C89B2B` (Warm Gold) |
| Page background | `--color-background` | `#F7F8F5` |
| Surface / card | `--color-surface` | `#FFFFFF` |
| Text primary | `--color-text-primary` | `#111827` |
| Text secondary | `--color-text-secondary` | `#6B7280` |
| Success | `--color-success` | `#15803D` |
| Warning | `--color-warning` | `#F59E0B` |
| Danger | `--color-danger` | `#DC2626` |
| Border | `--color-border` | Very soft gray — `#E5E7EB` |

**Chart colors** (recharts): Emerald, Gold, Olive, Slate — in that order for multi-series
charts (e.g. revenue by section).

**Never**: gradients, "AI blue," glassmorphism, neumorphism, playful/childish styling. This is
a financial dashboard for a school owner and bursar — minimal, professional, premium, clean.

---

## Border Radius

- Cards: `16px`
- Buttons / inputs: `8px`
- Badges: pill (`9999px`)

## Shadows

Subtle only — e.g. `0px 1px 3px rgba(0,0,0,0.08)`. Never heavy or colored shadows.

## Spacing

Large, generous spacing throughout — this is designed for office workers who are not
tech-savvy, not a dense data-analyst tool. Prefer more whitespace over cramming more on screen.

## Typography

- Modern sans-serif (match whatever the Lovable scaffold already imports — check
  `src/styles.css` before adding a new font).
- Large headings, excellent whitespace, readable tables, large clickable buttons.
- Stat numbers on the dashboard: largest text on the page, bold.

---

## Status Colors (Student Payment Status)

| Status | Background | Text |
|---|---|---|
| Paid | success-light | success |
| Part Payment | warning-light | warning |
| Owing | danger-light | danger |

## Invariants

- Never use hardcoded hex values in components — always CSS variable tokens.
- Never use Tailwind's built-in color palette (`bg-emerald-700`, `text-gray-600`, etc.) —
  project tokens only.
- Primary is always Deep Emerald, never blue. This was an explicit instruction in the original
  brief: "DO NOT use generic AI blue."
- No gradients on card backgrounds or buttons.
