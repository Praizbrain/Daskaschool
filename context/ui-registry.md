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

_Empty. Components will be added here as they are wired to real data or newly built._
