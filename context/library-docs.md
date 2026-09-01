# Library Docs

Project-specific usage patterns for the third-party libraries in this project. Covers how we
use each one in Praiseland Finance Hub specifically — not general documentation.

Read the relevant section before implementing any feature that touches these libraries.

---

## Before Using Any Library

1. **Check AGENTS.md** for any installed Supabase skills.
2. **Check for an MCP server** for that library if one is configured.
3. **Read this file** for project-specific patterns that override general knowledge.
4. TanStack Start is fast-moving — package names and APIs shift. Verify against current docs
   (tanstack.com/start) before trusting general training knowledge, especially for exact import
   paths.

---

## Clerk — Tried and Reverted, Do Not Reintroduce

This project briefly used Clerk for auth (Supabase for DB only). It was **reverted** after
Clerk's client JS — loaded dynamically from a per-app `*.clerk.accounts.dev` subdomain — failed
DNS resolution (`ERR_NAME_NOT_RESOLVED`) on the developer's network. Same class of issue
previously hit with Context7 CLI, fixable only with a system-wide VPN — not acceptable for this
app's real users (school owner, bursar; non-technical, no VPN). **Do not reintroduce Clerk**
without confirming the underlying network issue is genuinely fixed first. All auth now runs
through Supabase Auth exclusively — see below.

(One incidental lesson from that attempt, kept in case Clerk is ever revisited: Clerk shipped a
breaking "Signal API" redesign of its hooks in 2026 that most tutorials/training data don't
reflect yet — `useSignIn()` returns `{ signIn, errors, fetchStatus }`, not the older
`{ isLoaded, signIn, setActive }` shape. Verify against current docs if this ever comes back.)

---

## Supabase (Auth + Database + Storage — Everything)

**Package**: `@supabase/supabase-js` only. One client, one dependency — handles auth session
management, Postgres queries, RLS, and file storage.

### Client Setup

```typescript
// src/lib/supabase-client.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
);
```

One client, imported wherever needed — `supabase-js` handles session storage/refresh itself
once someone's signed in.

### Sign In / Sign Out

```typescript
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
await supabase.auth.signOut();
```

Check current session with `supabase.auth.getSession()`, or subscribe to changes with
`supabase.auth.onAuthStateChange(...)` — use the latter in the root layout to drive route
guards (redirect to `/` if signed out, redirect away from `/` if already signed in).

### Role Storage

Roles are **not** part of Supabase Auth's built-in user object — they live in the `profiles`
table (see `architecture.md`), one row per `auth.users` row, auto-created via a Postgres trigger
on signup, defaulting to `'staff'`. The Super Admin account's role is set manually (Supabase
table editor or SQL) — no self-service role management UI in v1.

```typescript
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user?.id)
  .single();
```

**Rules:**
- Never trust a client-side role check alone for a Super-Admin-only write — always re-check
  `profiles.role` server-side in the `src/server/` function too.
- No Supabase "Organizations" or multi-project features — single school, single tenant, small
  fixed set of named accounts.

### RLS Policy Pattern

Native Supabase Auth — `auth.uid()` works directly, no custom claim wiring needed:

```sql
create policy "super_admin_full_access_classes"
on classes for all
using (
  exists (select 1 from profiles where id = auth.uid() and role = 'super_admin')
);

create policy "staff_can_read_classes"
on classes for select
using (true); -- any authenticated user can read; write is Super Admin only above
```

For tables scoped by "who created this row" (e.g. `payments.received_by`):

```sql
create policy "staff_can_insert_own_payments"
on payments for insert
with check (auth.uid() = received_by);
```

**Rules:**
- Enable RLS on every table — no exceptions, even for `school_settings` and `profiles` itself.
- Always handle the `error` return from every Supabase call — never assume success.
- Use `.single()` only when exactly one row is expected.
- Never query without considering whether the result should be role-scoped.

### Storage

Only used if/when receipt attachments or similar are added — not required for v1 scope. If
added later: `insforge`-style bucket pattern doesn't apply here; use
`supabase.storage.from(bucket).upload(...)` with `upsert` set deliberately (true only when
overwriting is intended), and always save the resulting path/URL back to the relevant table row.

---

## TanStack Start / TanStack Router

**Check first**: tanstack.com/start docs — this framework changes quickly and is easy to
confuse with Next.js patterns from general training knowledge.

### Server Functions

```typescript
import { createServerFn } from "@tanstack/react-start";

export const listStudents = createServerFn({ method: "GET" })
  .validator((input: { classId?: string }) => input)
  .handler(async ({ data }) => {
    // ...
  });
```

Call from a component via TanStack Query, not directly in render:

```typescript
const { data } = useQuery({
  queryKey: ["students", classId],
  queryFn: () => listStudents({ data: { classId } }),
});
```

### Route Loaders

Use `beforeLoad` for auth/role gating (redirect to `/login` if no `userId`; redirect away from
Settings if role isn't `super_admin`), and `loader` for data fetching that should be ready
before the route renders.

**Rules:**
- Never fetch data directly inside a route component's render body — always via loader or
  TanStack Query.
- Never assume Next.js file-routing conventions — TanStack Router's file-based routing has its
  own naming rules (already in use in this repo — see existing `src/routes/*.tsx` files for the
  established pattern before adding new routes).

---

## react-hook-form + zod

Standard pattern, already a dependency:

```typescript
const schema = z.object({
  fullName: z.string().min(1, "Required"),
  classId: z.string().uuid(),
  discount: z.number().min(0).default(0),
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
});
```

Every form in this app (Add Student, Record Payment, Add Expense, Settings) uses this pattern
— no hand-rolled form state.

---

## Recharts

Already a dependency, used for dashboard charts (revenue trend, revenue mix, section
collection progress). Colors always come from the chart token order in `ui-tokens.md`
(Emerald, Gold, Olive, Slate) — never default recharts colors.

---

## sonner (Toasts)

Already a dependency. Every server function failure surfaces via `toast.error(message)` with
the human-readable `error` string returned by the server function — never the raw thrown error.
