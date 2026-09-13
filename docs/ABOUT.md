# About Akademia

Akademia is a multi-tenant school management platform built for Ghanaian
Primary, JHS, and SHS schools. It handles the full administrative lifecycle
of a school — from student enrolment and daily attendance through fee
collection, grading, report cards, and parent communications — and packages
everything as a Windows desktop application via Tauri.

---

## What it does

| Module | What it covers |
|---|---|
| **Multi-tenancy** | Each school is an isolated tenant. All data — students, classes, fees, grades — is scoped to a tenant. A single deployment can serve many schools simultaneously. |
| **Authentication & RBAC** | Three roles: `SUPER_ADMIN` (platform owner), `SCHOOL_ADMIN` (per-school administrator), `STAFF` (teachers). Auth is handled through Supabase; the API issues short-lived JWTs with refresh tokens. |
| **Student records** | Admission numbers, personal details, guardian contacts, and class enrolments. Students can be linked to multiple guardians. |
| **Attendance** | Daily per-student attendance (`PRESENT`, `ABSENT`, `TARDY`), marked by staff and stored against a specific date. |
| **Fees** | Fee structures are defined per term. Each student has a fee account that tracks charges and payments. Payments are validated against Paystack (or Flutterwave). |
| **Grading** | Multi-component scores per subject per term: Continuous Assessment, Mid-term, and End-of-term exam. The service computes a weighted aggregate and allows teachers to finalise records. Teacher-class-subject assignments control who may enter grades. |
| **Report cards** | Term report cards are generated as PDFs and held in a `WITHHELD` state until fees are fully cleared — the *Result-Fee Intercept*. Once cleared, the card is released and a download link (stored in Supabase Storage) is sent to the guardian. |
| **Communications** | Templated messages dispatched over Email (Resend / SMTP) and SMS (Arkesel / Hubtel). Every dispatch is logged in the `Communication` table. |
| **Subscriptions & licensing** | Each tenant has a subscription with an expiry date and a configurable grace period. Expired-but-in-grace tenants get read-only access; fully expired tenants are locked out until they renew via Paystack. |
| **Audit log** | Every significant action records an actor, action type, target, and optional reason, giving schools a tamper-evident history. |

---

## Tech stack

### Server (`/server`)
- **Runtime:** Node.js 18+ (ESM)
- **Framework:** Express 4 with `express-async-errors`
- **Database:** PostgreSQL via **Prisma ORM** (hosted on Supabase free tier)
- **Auth:** Supabase Auth + custom JWT middleware
- **Validation:** Zod schemas on every route
- **Email:** Resend API (or Nodemailer/SMTP fallback)
- **SMS:** Arkesel API (or Hubtel fallback) — Ghana-focused
- **Payments:** Paystack (or Flutterwave) with webhook + polling-based verification
- **PDF generation:** PDFKit
- **File storage:** Supabase Storage
- **Logging:** Winston
- **Security:** Helmet, CORS, tenant isolation middleware, role guard middleware, subscription gate middleware

### Client (`/client`)
- **Framework:** React 18 (Vite)
- **Styling:** Tailwind CSS
- **Routing:** React Router v6 with role-based protected routes
- **HTTP:** Axios with an auto-refreshing token interceptor
- **UI icons:** Lucide React
- **Notifications:** react-hot-toast
- **Auth state:** Supabase JS client + React Context

### Desktop
- **Packaging:** Tauri — wraps the Vite build into a native Windows `.exe` / `.msi` installer
- **Config:** `client/src-tauri/tauri.conf.json` (window size, build targets, icons)
- **Shell:** `client/src-tauri/src/lib.rs` (Tauri builder + log plugin) and `main.rs` (entry point)
- **Docs:** See [docs/TAURI.md](TAURI.md) for full integration guide

---

## Data model overview

```
Tenant
 ├── Subscription          (one per tenant, tracks expiry & status)
 ├── Users                 (SUPER_ADMIN has no tenant; others do)
 ├── AcademicYears → Terms
 ├── Classes
 ├── Subjects
 ├── Students
 │    ├── Enrollments      (student ↔ class)
 │    ├── Guardians        (many-to-many via StudentGuardian)
 │    ├── Attendance       (one row per student per day)
 │    ├── Grades           (one row per student × subject × term)
 │    ├── StudentFeeAccount → Payments
 │    └── ReportCards      (one per student × term, with PDF URL)
 ├── TeacherClassSubject   (authorises a staff user to grade a class/subject)
 ├── Communications        (dispatched email/SMS log)
 └── AuditLogs
```

---

## Project layout

```
akademia/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma       — full data model
│   │   ├── seed.js             — demo data (super admin, demo school, students…)
│   │   └── migrations/
│   └── src/
│       ├── config/             — DB, Supabase, env validation
│       ├── middleware/         — auth, tenant, role, subscription, error, validate
│       ├── routes/             — one file per resource
│       ├── controllers/        — request/response handling
│       ├── services/           — business logic (fee, grade, email, SMS, PDF, payment…)
│       └── utils/              — ApiError, logger, phone helpers
├── client/
│   └── src/
│       ├── api/                — Axios wrappers per resource
│       ├── context/            — AuthContext (Supabase session)
│       ├── routes/             — ProtectedRoute (role checks)
│       ├── layouts/            — DashboardLayout (sidebar, nav)
│       ├── pages/
│       │   ├── Auth/           — Login page
│       │   ├── SuperAdmin/     — Tenant & subscription management
│       │   ├── SchoolAdmin/    — Students, staff, fees, report cards
│       │   └── Staff/          — Attendance & grade entry
│       ├── components/ui/      — Shared UI primitives
│       └── hooks/              — Custom React hooks
└── docs/
    ├── ABOUT.md                — this file
    └── TODO.md                 — setup & deployment checklist
```

---

## Roles at a glance

| Role | Scope | Key permissions |
|---|---|---|
| `SUPER_ADMIN` | Platform-wide | Create/manage tenants, manage subscriptions, view all audit logs |
| `SCHOOL_ADMIN` | Single tenant | Manage students, staff, classes, subjects, fees, report cards, communications |
| `STAFF` | Single tenant | Mark attendance, enter/finalise grades for assigned classes & subjects |

---

## Key business rules

- **Result-Fee Intercept:** A student's report card stays `WITHHELD` until their outstanding fee balance is zero. The release is triggered automatically when a payment clears, and a notification is sent to guardians.
- **Subscription gate:** API requests from tenants with status `EXPIRED_LOCKED` are rejected with `402 Payment Required`. `EXPIRED_IN_GRACE` tenants get read-only access.
- **Teacher assignment enforcement:** Only the staff member assigned to a `TeacherClassSubject` record — or any `SCHOOL_ADMIN` — may write grades for that class/subject combination.
- **Tenant isolation:** Every database query is scoped to `tenantId`. No data from one school is ever visible to another.
- **Grade aggregation:** Aggregate = (CA × 0.3) + (Mid-term × 0.2) + (Exam × 0.5), implemented in `grade.service.js`.

---

## External service dependencies

| Service | Purpose | Free tier |
|---|---|---|
| Supabase | PostgreSQL database + Auth + Storage | 500 MB / 2 shared CPU |
| Resend | Transactional email | 3,000 emails/month |
| Arkesel | SMS (Ghana numbers) | Test credits on signup |
| Paystack | Payment processing & subscription renewal | Test mode free |

---

## Build roadmap

1. ✅ Foundation scaffold
2. ✅ Multi-tenancy + Auth (RBAC, tenant middleware)
3. ✅ Student records
4. ✅ Attendance
5. ✅ Fees
6. ✅ Grading
7. ✅ Result dispatch (Result-Fee Intercept)
8. ✅ Subscription & licensing
9. ✅ Tauri desktop packaging
10. ⬜ Production hardening

---

*Akademia v1.0 · Last updated September 2026*
