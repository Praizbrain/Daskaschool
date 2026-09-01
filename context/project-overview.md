# Project Overview

## About the Project

**Praiseland Finance Hub** (product name shown in-app: **Divine Sources Finance OS**) is a
school finance and bookkeeping web app for **Divine Sources Praiseland High School**, Benin
City, Edo State, Nigeria. It replaces manual/notebook bookkeeping with a simple online tool the
school owner and her bursar/secretary can use daily.

It is explicitly **not** a general school management system (no attendance, no timetabling, no
gradebook, no parent portal). It is a finance control system: fees, payments, class-linked
teacher salaries, expenses, and profit — nothing else.

## The Problem It Solves

The school owner was doing bookkeeping by hand — tracking who paid school fees, what students
bought (books, uniforms, sneakers), what the school spent, and what profit each class/section
was actually generating after paying that class's teacher. This was slow, error-prone, and gave
no real-time picture of cash flow or outstanding balances. It also made it hard to know what
revenue figure to use for tax compliance.

This app gives the owner a live dashboard of expected vs. collected revenue, lets the
bursar/secretary record payments and expenses quickly, and automatically calculates
class-level profit (revenue − direct expenses − teacher salary).

## Users

Two roles in v1. No parent, guardian, or student accounts — internal staff only.

| Role | Who | Can do |
|---|---|---|
| **Super Admin** | The school owner | Everything: full dashboard, all financial detail, manage classes/fees/discounts/school settings, manage staff records, everything Staff can do |
| **Staff** | Bursar / secretary | Record payments, add students, add expenses, view students/classes/dashboard. Cannot change fee structure, discount rules, teacher salaries, or school settings |

HM and Teacher read-only views are **explicitly deferred** — see "Full Scope" below. Do not
build them yet; this is a role decision separate from the page-scope decision.

## Pages (Full Scope)

```
/ (index)              → Auth page (Supabase Auth, email + password)
/dashboard             → Financial overview
/students              → Student list + search/filter
/students/new          → Add student form
/students/$studentId   → Student profile: info, payment history, record payment
/classes                → Class list with revenue/salary/profit per class
/classes/$classId      → Class detail: students in class, revenue, teacher salary, profit
/finance/record-payment → Record a payment (also reachable from student profile)
/expenses               → Expense list + add expense form
/inventory              → Stock management: item counts, cost price, sold units, price list
/staff                  → Staff HR directory: teacher records, status, salary
/reports                → Multi-format reports (PDF/Excel/CSV export)
/targets                → Collection targets, deadlines, progress tracking
/settings               → School profile, session/term, fee structure, discounts, audit log — Super Admin only
```

Every page from the original Lovable prototype ships — see "Full Scope" below for why build
*order* differs from this list even though nothing is cut.

## Navigation (Full Scope)

Sidebar, matching the Lovable prototype's visual style and full page list:

```
Dashboard
Students
Classes
Finance (Record Payment)
Inventory
Expenses
Staff
Reports
Targets
Settings          (Super Admin only)
---
Profile
Logout
```

## Core User Flow

1. Staff or Super Admin logs in via Supabase Auth (email + password). Accounts are provisioned
   directly in the Supabase dashboard/SQL by the developer for now — no public sign-up.
2. Dashboard shows expected revenue, collected revenue, outstanding, estimated profit,
   today's revenue/expenses, and section-level (KG/Primary/JSS/SS) collection progress.
3. Staff searches for a student (or adds a new one), opens their profile, and records a
   payment — selecting which items were paid for (school fees, books, uniform, sneakers,
   exam fee, lesson fee), amount, and method (Cash/Transfer/POS).
4. Every payment updates: the student's outstanding balance, the class's collected revenue,
   and the dashboard totals — in real time, computed from the database, never hardcoded.
5. Expenses (salaries, utilities, maintenance, etc.) are logged separately and feed into the
   Estimated Profit calculation.
6. Super Admin can review Classes to see, per class: expected revenue, collected revenue,
   the assigned teacher's salary, direct class expenses, and net class profit.

## Core Business Logic

This is the single most important calculation in the product — it must be computed live from
the database, never hardcoded or cached as a static number:

```
Expected Revenue (per student) = Class Fee (tuition + books + other charges) − Discount
Expected Revenue (per class)   = Σ Expected Revenue of students in that class
Collected Revenue (per class)  = Σ payments.amount for students in that class
Outstanding (per class)        = Expected Revenue − Collected Revenue
Class Net Profit                = Collected Revenue − Class Direct Expenses − Teacher Salary
```

Dashboard totals are the sum of these across all classes, plus school-wide (non-class-specific)
expenses subtracted for the school-wide Estimated Net Profit figure.

## Full Scope — All Lovable Prototype Pages Are In Scope

**Decision: nothing from the original Lovable prototype is cut.** Inventory (real stock
tracking — counts, cost price, sold units), Staff (full HR directory), Reports (multi-format
exports), and Targets (collection goals/deadlines) are all real, planned features of this
product — not speculative extras to skip. Do not treat any of them as descoped.

**What changes is build order, not scope.** The core financial loop (auth, dashboard, students,
classes, record payment, expenses) ships first because every later feature depends on that data
being real: Reports has nothing to report on until payments/expenses exist for real, Targets
has nothing to track progress against until collection is real, Staff's salary-vs-revenue view
depends on classes/payments being real, Inventory's stock-vs-sold view depends on payments
being real. Building the full page list in the Lovable prototype's original order, before the
underlying data model is real, would mean building UI against nothing. See `build-plan.md` for
the actual phase sequence — every phase ships something clickable and real before the next
phase starts.

**HM and Teacher roles remain deferred** — Super Admin and Staff are the only roles in this
build. That's a genuinely separate decision from the full-page-scope one above (it's about
who can log in, not what pages exist) and isn't being revisited here.

## Success Criteria

- The school owner and bursar can log in and use the app without training — it must be at
  least as simple as the notebook system it replaces, ideally simpler.
- Recording a payment takes under 60 seconds from opening the app.
- The dashboard numbers (expected, collected, outstanding, profit) are always live and correct
  — computed from actual `payments` and `expenses` rows, never stale or hardcoded.
- Class-level profit correctly reflects revenue minus that class's direct expenses and teacher
  salary.
- The app runs entirely on Supabase's free tier with room to spare — this school has roughly
  400 students and a handful of staff accounts, nowhere close to its free-tier limits (500MB
  DB, 50,000 MAU).
