# Akademia — Complete Code Walkthrough for Beginners

This document explains every single folder and file in the Akademia project
from first principles. You don't need prior experience — each concept is
explained before the code that uses it.

---

## How to read this document

- Concepts are explained in plain language first, then tied back to the code.
- Code snippets are included with line-by-line commentary.
- The document follows the same folder structure as the repo so you can open
  any file side-by-side while reading.

---

## Big picture — what does the project actually do?

Akademia is a **web application** for managing schools. Think of it as software
a school secretary, headmaster, and teachers use every day — enrolling students,
taking attendance, collecting fees, entering grades, and printing report cards.

Because multiple schools use the same software, it is "multi-tenant": every
school gets its own private space inside one shared database.

The project is split into two halves that talk to each other over the internet:

```
Browser (client)  ──── HTTP requests ────►  Server
React + Tailwind                            Node.js + Express + PostgreSQL
```

- The **client** is what you see in the browser. It is built with React.
- The **server** is the brain — it reads/writes the database and enforces rules.
- The **database** lives on Supabase (a free PostgreSQL cloud service).

---

## The root folder

```
akademia/
├── server/          The Node.js backend API
├── client/          The React frontend
├── docs/            Documentation (you are here)
├── package.json     Monorepo script shortcuts
├── README.md        Quick-start guide
└── .gitignore       Files Git should not track
```

### `package.json` (root)

Every Node.js project has a `package.json`. This one is at the very top level
and just defines shortcut scripts so you can type `npm run dev:server` instead
of `cd server && npm run dev`. You won't edit this much.

### `.gitignore`

Tells Git (the version-control tool) to skip certain files — like `node_modules`
(downloaded libraries that are huge and re-creatable) and `.env` files
(contain passwords that should never be committed).

---

## The `server/` folder

This is the Node.js application that handles all business logic, talks to the
database, sends emails, and exposes an HTTP API.

```
server/
├── src/
│   ├── index.js          Entry point — starts the web server
│   ├── app.js            Express app — routes, middleware pipeline
│   ├── config/           Configuration and connections
│   ├── middleware/        Request guards (auth, tenant, roles…)
│   ├── routes/            URL definitions
│   ├── controllers/       Request handlers — read request, call service, send response
│   ├── services/          Business logic — the real rules of the app
│   └── utils/             Small helper tools
├── prisma/
│   ├── schema.prisma      Database table definitions
│   ├── seed.js            Script that fills the database with demo data
│   └── migrations/        Auto-generated SQL migration history
├── package.json           Dependencies and scripts
├── nodemon.json           Auto-restart config for development
└── .env.example           Template for your environment variables
```

---

### What is Node.js?

Node.js lets you run JavaScript outside the browser — on a server. Normally
JavaScript only runs inside Chrome, Firefox, etc. Node.js broke that limit.

### What is Express?

Express is a small library that makes it easy to build an HTTP server in
Node.js. You tell it: "when someone visits `/api/v1/students`, run this
function."

### What is Prisma?

Prisma is an **ORM** (Object-Relational Mapper). Instead of writing raw SQL
(`SELECT * FROM students WHERE ...`), you write JavaScript:
`prisma.student.findMany({ where: { tenantId } })`. Prisma translates that
into SQL for you.

### What is PostgreSQL?

PostgreSQL is a relational database — it stores data in tables with rows and
columns, like Excel but much more powerful. Akademia's database is hosted free
on Supabase.

---

### `server/src/index.js` — the entry point

This is the very first file Node.js runs when you type `npm run dev`.

```js
import 'dotenv/config';          // Loads the .env file into process.env
import { env } from './config/env.js';   // Validated env variables
import app from './app.js';              // The Express application
import prisma, { connectDb } from './config/db.js';
import logger from './utils/logger.js';

async function main() {
  // 1. Try to connect to the database first
  await connectDb();

  // 2. Start the HTTP server on the configured port (default 5000)
  const server = app.listen(env.PORT, () => {
    logger.info(`Akademia API listening on port ${env.PORT}`);
  });

  // 3. When the process is killed (Ctrl+C), close cleanly
  const shutdown = async (signal) => {
    server.close(async () => {
      await prisma.$disconnect();  // Release database connection
      process.exit(0);
    });
  };

  process.on('SIGINT',  () => shutdown('SIGINT'));   // Ctrl+C
  process.on('SIGTERM', () => shutdown('SIGTERM'));  // Docker stop / server kill
}

main();
```

The key idea: always connect to the database *before* listening for HTTP
requests. If the database is down, there's no point starting.

---

### `server/src/app.js` — the Express application

This file creates the Express `app` object and wires up all the middleware
and routes. Think of it as the **plumbing diagram** — it says which pipes
connect to which.

```js
import express from 'express';
import cors    from 'cors';
import helmet  from 'helmet';
import morgan  from 'morgan';

const app = express();

// Security headers — adds ~30 HTTP headers that block common attacks
app.use(helmet());

// CORS — allows the browser on localhost:5173 to call this API
// Without CORS, browsers block cross-origin requests by default
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Paystack webhooks send a raw body that we must NOT parse as JSON yet —
// if we do, the cryptographic signature check would fail.
// So this raw-body handler is registered BEFORE express.json().
app.use('/api/v1/subscriptions/webhook', express.raw({ type: '*/*' }));

// Parse incoming JSON bodies into req.body
app.use(express.json());

// Log every HTTP request in development (GET /api/v1/students 200 12ms)
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Health check — used by deploy platforms to verify the server is alive
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Mount all route groups
app.use('/api/v1/auth',          authRoutes);
app.use('/api/v1/tenants',       tenantRoutes);
app.use('/api/v1/students',      studentRoutes);
// ... and so on

// 404 handler — if no route matched, return Not Found
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// Global error handler — last middleware, catches anything thrown
app.use(errorMiddleware);

export default app;
```

Every HTTP request flows through middlewares from top to bottom before
reaching its route handler. If any middleware throws an error, Express
skips straight to the error handler at the bottom.

---

## `server/src/config/` — Configuration files

### `config/env.js` — Environment variable validation

**What is an environment variable?**
It is a value stored *outside* the code — in a `.env` file — so you can run
the same code with different settings (development vs production) without
changing the code itself. Examples: database password, API keys.

**What is Zod?**
Zod is a validation library. You describe what a value *should* look like
(a string, a number, a specific set of allowed values), and Zod checks that
it actually is that. If not, it tells you exactly what's wrong.

```js
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(5000),
  // z.coerce.number() means "convert to number even if it's a string"
  // .default(5000) means "use 5000 if PORT isn't set"

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // .min(1) means "must be at least 1 character — can't be empty"

  EMAIL_PROVIDER: z.enum(['resend', 'smtp']).default('resend'),
  // z.enum means "only these exact values are allowed"
});

const parsed = schema.safeParse(process.env);
// safeParse returns { success: true, data: {...} } or { success: false, error: ... }

if (!parsed.success) {
  console.error('Invalid environment configuration');
  process.exit(1);  // Crash immediately rather than running broken
}

export const env = Object.freeze(parsed.data);
// Object.freeze prevents accidental mutation — env.PORT = 9999 will silently fail
```

This file means the server will refuse to start if any required environment
variable is missing or wrong. Far better than a confusing crash later.

---

### `config/db.js` — Prisma client singleton

**What is a singleton?**
A design pattern where you create a class or object only once and reuse that
same instance everywhere. Creating a new database connection is expensive
(it takes ~500ms), so you want to create it once and keep it.

```js
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;
// globalThis is the "global scope" of Node.js — like a shared storage room

export const prisma =
  globalForPrisma.prisma ??   // Use the existing one if it exists…
  new PrismaClient({ ... });  // …otherwise create a new one

// In development, store it globally so hot-reload doesn't create duplicates
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

The `connectDb` function tries to connect up to 5 times, waiting longer
between each attempt (1s, 2s, 4s, 8s…). This is called **exponential
back-off** and handles the case where Supabase's free tier takes a few
seconds to wake up from sleep.

---

### `config/supabase.js` — Supabase admin client

**What is Supabase?**
Supabase is a cloud service that provides PostgreSQL (the database) plus
authentication (login/password management). It is free up to a limit.

The server uses two Supabase features:
1. **Supabase Auth** — to verify that a user's login token is genuine.
2. **Supabase Storage** — to store generated PDF report cards.

The "service role key" used here is a master key that bypasses all
permission checks. It is only used on the server and never sent to the
browser.

```js
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,  // All-powerful key — server-only!
  { auth: { autoRefreshToken: false, persistSession: false } }
  // No token auto-refresh needed on server — each request is independent
);
```

---

## `server/src/utils/` — Helper utilities

### `utils/ApiError.js` — Custom error class

**What is a class in JavaScript?**
A blueprint for creating objects that share the same shape and behaviour.
`class ApiError extends Error` means "ApiError is a special kind of Error
with extra properties."

```js
export class ApiError extends Error {
  constructor(statusCode, publicMessage, details) {
    super(publicMessage);      // Call the parent Error constructor
    this.statusCode = statusCode;     // e.g. 404, 403, 400
    this.publicMessage = publicMessage; // Safe to show to the user
    this.details = details;           // Optional extra info (Zod errors, etc.)
  }

  // Static methods — called on the class itself, not an instance
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }
  static badRequest(message = 'Bad request', details) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = 'Not authenticated') {
    return new ApiError(401, message);
  }
}
```

Usage anywhere in the codebase:
```js
throw ApiError.notFound('Student not found');
// This goes straight to errorMiddleware which formats and sends the response
```

Why have a custom error class instead of plain `Error`? So the error
middleware can check `err instanceof ApiError` and know exactly what HTTP
status code and message to send.

---

### `utils/logger.js` — Winston logger

**What is a logger?**
`console.log` is fine for quick debugging, but in production you want
structured, timestamped logs that can be sent to a log aggregation service.
Winston provides that.

```js
const logger = winston.createLogger({
  level: isProd ? 'info' : 'debug',
  // In production, only log info and above (not verbose debug messages)

  format: winston.format.combine(
    winston.format.timestamp(),  // Adds { timestamp: "2026-09-08T10:00:00Z" }
    isProd
      ? winston.format.json()    // JSON lines — easy to parse by tools
      : winston.format.simple()  // Human-readable in development
  ),
  transports: [new winston.transports.Console()],  // Print to terminal
});
```

Usage: `logger.info('Server started')`, `logger.error('DB failed', { err })`.

---

### `utils/phone.js` — Ghana phone normalizer

Phone numbers in Ghana can be written many ways:
- `0244123456` (local format)
- `233244123456` (country code without +)
- `+233244123456` (E.164 — the international standard)
- `024 412-3456` (with spaces and dashes)

SMS APIs require E.164 format (`+233XXXXXXXXX`). This function converts
any of the above into that standard form.

```js
export function normalizeGhanaPhone(raw) {
  if (!raw || typeof raw !== 'string') return null;

  // Strip spaces, dashes, parentheses — keep only digits and the + sign
  const digits = raw.replace(/[^\d+]/g, '');

  // Each regex tests for a different input format:
  if (/^\+233\d{9}$/.test(digits)) return digits;           // Already correct
  if (/^233\d{9}$/.test(digits))   return `+${digits}`;     // Add the +
  if (/^0\d{9}$/.test(digits))     return `+233${digits.slice(1)}`; // Replace 0
  if (/^\d{9}$/.test(digits))      return `+233${digits}`;  // Bare 9 digits

  return null;  // Unrecognized format
}
```

`/^\+233\d{9}$/` is a **regular expression** (regex). The `^` means "start
of string", `\d{9}` means "exactly 9 digits", `$` means "end of string".
`.test(str)` returns `true` if the string matches the pattern.

---

### `utils/phone.test.js` — Tests for the phone normalizer

**What is a test?**
Code that automatically checks that other code works correctly. You run
`npm test` and it tells you if everything passes or fails.

```js
import { test } from 'node:test';   // Node's built-in test runner
import assert from 'node:assert/strict';  // Assertion library
import { normalizeGhanaPhone } from './phone.js';

test('normalizes local 0-prefixed numbers', () => {
  // assert.equal(actual, expected) — throws if they don't match
  assert.equal(normalizeGhanaPhone('0244123456'), '+233244123456');
});

test('rejects invalid numbers', () => {
  assert.equal(normalizeGhanaPhone('12345'), null);
  assert.equal(normalizeGhanaPhone(null),    null);
});
```

If `normalizeGhanaPhone` is ever changed in a way that breaks these cases,
`npm test` will immediately report the failure.

---

## `server/src/middleware/` — Request guards

**What is middleware?**

Middleware is a function that runs *between* the HTTP request arriving and the
controller function running. Express calls middleware in the order they are
registered. Each middleware either:
- Calls `next()` to pass control to the next middleware/controller, or
- Throws an error (which goes to the error handler), or
- Sends a response directly (which ends the chain).

Think of it as a series of security checkpoints at an airport before you
reach the departure gate (controller).

---

### `middleware/auth.middleware.js` — requireAuth

This is the "are you logged in?" checkpoint.

```js
export async function requireAuth(req, res, next) {
  // The browser sends: Authorization: Bearer <token>
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  // Reject if the header is missing or malformed
  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized();
  }

  // Ask Supabase: "Is this token valid? Who does it belong to?"
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) throw ApiError.unauthorized();

  // Look up the user's profile in our own database to get their role
  const profile = await prisma.user.findUnique({
    where: { supabaseId: data.user.id }
  });
  if (!profile) throw ApiError.unauthorized();

  // Attach the profile to the request object so later code can use it
  req.user = {
    id:        profile.id,
    tenantId:  profile.tenantId,
    role:      profile.role,
    fullName:  profile.fullName,
    email:     profile.email,
  };

  next();  // All good — continue to next middleware
}
```

After this runs, any code further down the chain can read `req.user` and
know who is making the request.

---

### `middleware/tenant.middleware.js` — attachTenant

This is the "are you associated with a school?" checkpoint.

`SUPER_ADMIN` users have no tenant — they manage all schools. Every other
user belongs to exactly one school (tenant). This middleware copies the
tenant ID onto the request so controllers don't have to think about it.

```js
export function attachTenant(req, res, next) {
  if (!req.user) throw ApiError.unauthorized();

  if (!req.user.tenantId) {
    // Super Admin hits routes that don't use attachTenant
    throw ApiError.forbidden('This account is not associated with a school');
  }

  req.tenantId = req.user.tenantId;  // Makes it convenient to read
  next();
}
```

This is described in the code as "the most security-critical file" because
every single database query in the controllers uses `req.tenantId` to
filter results. If this were bypassed, one school could read another school's
data.

---

### `middleware/role.middleware.js` — requireRole

This is the "are you allowed to do this?" checkpoint.

```js
export function requireRole(...allowedRoles) {
  // This function RETURNS another function — a middleware
  return function (req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }
    next();
  };
}
```

Usage in a route: `requireRole('SCHOOL_ADMIN')` — only school admins get
through. `requireRole('STAFF', 'SCHOOL_ADMIN')` — either role is fine.

The `...allowedRoles` syntax is called **rest parameters** — it means
"collect all arguments into an array called allowedRoles".

---

### `middleware/subscription.middleware.js` — requireActiveSubscription

This enforces the **subscription/licensing** gate. Every school pays a
yearly fee. If they haven't paid, they get locked out.

Three possible states:
1. `ACTIVE` — subscription is valid → proceed normally.
2. `EXPIRED_IN_GRACE` — expired but within the grace period (default 14 days) → proceed, but set a warning flag on the request.
3. `EXPIRED_LOCKED` — grace period also ended → reject with 402 (Payment Required).

```js
export async function requireActiveSubscription(req, res, next) {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId: req.tenantId }
  });

  const now = new Date();

  // Still active and not expired
  if (subscription.status === 'ACTIVE' && subscription.expiresAt > now) {
    return next();
  }

  // Calculate when the grace period ends
  const graceEndsAt = subscription.graceEndsAt ??
    new Date(subscription.expiresAt.getTime() + GRACE_DAYS * 86400000);

  if (now <= graceEndsAt) {
    // In grace — let them through but attach a warning
    req.subscriptionWarning = { status: 'EXPIRED_IN_GRACE', graceEndsAt };
    // Also update the database record to EXPIRED_IN_GRACE if not yet done
    return next();
  }

  // Grace period over — lock them out
  throw new ApiError(402, 'Your subscription has expired. Please renew.');
}
```

---

### `middleware/validate.js` — validate

This middleware runs Zod validation on the request body, query string, or URL
parameters *before* the controller runs. If anything fails validation, the
request is rejected immediately with a clear error message.

```js
export function validate(schemas) {
  return function (req, res, next) {
    for (const key of ['body', 'query', 'params']) {
      const schema = schemas[key];
      if (!schema) continue;

      const result = schema.safeParse(req[key]);
      if (!result.success) {
        throw ApiError.badRequest('Validation failed', result.error.flatten());
      }

      // Replace req.body/query/params with the parsed & coerced values
      // e.g., "?page=2" becomes req.query.page = 2 (number, not string)
      req[key] = result.data;
    }
    next();
  };
}
```

Usage: `validate({ body: createStudentSchema })` — the schema is defined
at the top of the controller file using Zod.

---

### `middleware/error.middleware.js` — the global error handler

**The last line of defence.** Every uncaught error in any controller or
service ends up here. It figures out the right HTTP status code and formats
a clean JSON response.

```js
export function errorMiddleware(err, req, res, next) {
  let statusCode = 500;
  let publicMessage = 'Something went wrong. Please try again.';

  if (err instanceof ApiError) {
    // Our own typed error — use its status and message directly
    statusCode = err.statusCode;
    publicMessage = err.publicMessage;

  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Database errors have known codes:
    if (err.code === 'P2025') {
      statusCode = 404;
      publicMessage = 'Resource not found';  // Record doesn't exist
    } else if (err.code === 'P2002') {
      statusCode = 409;
      publicMessage = 'A record with that value already exists';  // Duplicate
    }
  }

  // Always log the full stack trace internally for debugging
  logger.error(err.message, { statusCode, stack: err.stack });

  // Send only the safe public message to the browser
  res.status(statusCode).json({ message: publicMessage });
}
```

The four-argument signature `(err, req, res, next)` is how Express recognises
an error handler. It is always the last `app.use()` call.

---

## `server/src/routes/` — URL definitions

Each route file does one thing: define which URLs exist and which middlewares
and controller functions handle them. Route files contain *no business logic*.

Here's the pattern used consistently across all route files:

```js
import { Router } from 'express';
import { requireAuth }               from '../middleware/auth.middleware.js';
import { attachTenant }              from '../middleware/tenant.middleware.js';
import { requireRole }               from '../middleware/role.middleware.js';
import { requireActiveSubscription } from '../middleware/subscription.middleware.js';
import { validate }                  from '../middleware/validate.js';
import * as controller               from '../controllers/student.controller.js';

const router = Router();

// Apply these middlewares to ALL routes in this file
router.use(requireAuth, attachTenant, requireActiveSubscription);

// GET /api/v1/students — list students (any authenticated, active-subscription user)
router.get('/', validate({ query: controller.listQuerySchema }), controller.list);

// POST /api/v1/students — create student (only SCHOOL_ADMIN)
router.post('/', requireRole('SCHOOL_ADMIN'), validate({ body: controller.createStudentSchema }), controller.create);

// GET /api/v1/students/:id — get one student
router.get('/:id', controller.getById);

export default router;
```

### Route files summary

| File | URL prefix | Who can use it |
|---|---|---|
| `auth.routes.js` | `/api/v1/auth` | Super Admin (register), any logged-in user (me) |
| `tenant.routes.js` | `/api/v1/tenants` | Super Admin only |
| `student.routes.js` | `/api/v1/students` | All authenticated school users |
| `staff.routes.js` | `/api/v1/staff-members` | School Admin only |
| `attendance.routes.js` | `/api/v1/attendance` | Staff + School Admin |
| `fee.routes.js` | `/api/v1/fees` | School Admin (write), all school users (read) |
| `grade.routes.js` | `/api/v1/grades` | Staff (own assignments) + School Admin |
| `reportcard.routes.js` | `/api/v1/report-cards` | School Admin (publish), all (read/download) |
| `communication.routes.js` | `/api/v1/communications` | All school users |
| `subscription.routes.js` | `/api/v1/subscriptions` | School Admin (renew), Paystack (webhook) |

---

## `server/src/controllers/` — Request handlers

Controllers are the "traffic directors". They:
1. Read validated data from `req.body`, `req.params`, `req.query`.
2. Call service functions to do the actual work.
3. Send a JSON response.

Controllers should not contain complex business logic — that belongs in
services.

---

### `controllers/auth.controller.js`

Handles two endpoints:

`POST /auth/register-tenant` — Super Admin creates a new school and its
first admin account. Delegates to `tenant.service.createTenantWithAdmin`.

`GET /auth/me` — Returns the currently logged-in user's profile. Because
`requireAuth` already loaded it into `req.user`, this is literally:
```js
export async function me(req, res) {
  res.json({ user: req.user });
}
```

---

### `controllers/tenant.controller.js` — Super Admin: manage schools

Provides CRUD (Create, Read, Update, Delete) for school tenants.

```js
// List all schools with student/user counts and subscription status
export async function list(req, res) {
  const tenants = await prisma.tenant.findMany({
    include: {
      subscription: true,
      _count: { select: { students: true, users: true } }
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ tenants });
}
```

Also handles `updateSubscription` — lets a Super Admin manually adjust a
tenant's subscription dates (e.g. after an offline payment).

---

### `controllers/student.controller.js` — Student CRUD

Key points:

**Pagination** in `list`:
```js
const { page, pageSize } = req.query;  // e.g. page=2, pageSize=20

// Skip the first (page-1)*pageSize records, take pageSize records
const students = await prisma.student.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
});
```
This means if `page=2` and `pageSize=20`, you skip the first 20 students
and return students 21–40.

**Search** uses a Prisma `OR` clause:
```js
OR: [
  { fullName:        { contains: search, mode: 'insensitive' } },
  { admissionNumber: { contains: search, mode: 'insensitive' } },
]
```
`mode: 'insensitive'` means the search ignores case ("kofi" finds "Kofi").

**Guardian linking** in `addGuardian`:
A guardian (parent) is created first, then linked to the student via the
`StudentGuardian` join table. This allows one guardian to be linked to
multiple children.

---

### `controllers/staff.controller.js` — Teacher management

The most complex controller. Manages two things:

**1. Teacher accounts** — creating/deactivating teachers.

Creating a teacher is a two-step process:
```js
// Step 1: Create a Supabase Auth account (for the password / login)
const { data: authData } = await supabaseAdmin.auth.admin.createUser({
  email, password, email_confirm: true,
});

// Step 2: Create the matching profile in our Prisma database
const teacher = await prisma.user.create({
  data: { tenantId, role: 'STAFF', fullName, email,
          supabaseId: authData.user.id }
});
```

If Step 2 fails (e.g. database error), the code **rolls back** Step 1:
```js
} catch (err) {
  // Delete the Supabase user so we don't have a "ghost" login
  await supabaseAdmin.auth.admin.deleteUser(supabaseUserId).catch(() => {});
  throw err;
}
```
This prevents the situation where someone can log in via Supabase but has
no profile in Akademia.

**2. Teacher-Class-Subject assignments** — controlling who can grade what.

A `TeacherClassSubject` record says "Teacher A can enter grades for Class B,
Subject C." The grade controller checks for this record before allowing a
teacher to save grades.

---

### `controllers/attendance.controller.js` — Daily attendance

`submit` accepts an array of attendance records and processes them all at
once using a **database transaction**:

```js
const results = await prisma.$transaction(
  records.map((r) =>
    prisma.attendance.upsert({
      where: { studentId_date: { studentId: r.studentId, date } },
      // "upsert" = insert if not exists, update if exists
      create: { studentId: r.studentId, date, status: r.status },
      update: { status: r.status },
    })
  )
);
```

A **transaction** means all records are saved at once or none are — you
can't end up with half the class marked and the other half missing.

`forClass` returns a "roster" — every student in the class with their
attendance status for a given day (or `null` if not yet marked).

`forStudent` returns a student's full attendance history plus a summary:
total days, days present, and the attendance percentage.

---

### `controllers/fee.controller.js` — Fees and payments

**createStructure** — defines the fee amount for a term. Optionally, if a
`classId` is provided, it automatically charges all students in that class.

**getStudentAccount** — returns a student's fee account (how much charged,
how much paid, what the balance is).

**createPayment** — records that a student paid. Checks for duplicate
references to prevent recording the same payment twice.

**outstanding** — returns all students who still owe money, sorted by
largest balance first.

**override** — allows an admin to set a student's fee to zero (waiver/
scholarship). Records an audit log entry with a required reason.

---

### `controllers/grade.controller.js` — Grading

Grades have three components:
- **CA (Continuous Assessment)** — class tests, quizzes, homework (30%)
- **Midterm** — mid-semester exam (20%)
- **Exam** — end-of-term exam (50%)

The **bulk sheet** pattern is the main way grades are entered — like a
spreadsheet where you fill in all students for a class/subject/term at once:

```
GET  /grades/sheet/:classId/:subjectId/:termId   — load the sheet
POST /grades/sheet                               — save the whole sheet
POST /grades/finalize/:classId/:subjectId/:termId — lock grades from editing
```

**Permission check** — before any teacher can read or write grades, the
system verifies that they are assigned to that class and subject:

```js
async function assertTeacherPermission({ userId, role, classId, subjectId }) {
  if (role === 'SCHOOL_ADMIN') return;  // Admins bypass — they manage everything

  const assignment = await prisma.teacherClassSubject.findFirst({
    where: { teacherId: userId, classId, subjectId },
  });
  if (!assignment) throw ApiError.forbidden('You have not been assigned to this class');
}
```

**Finalizing** locks all grades for a class/subject/term. Once finalized,
no further edits are allowed. This ensures grades are not changed after
report cards are printed.

---

### `controllers/reportcard.controller.js` — Report cards & the Result-Fee Intercept

This is the most important business rule in Akademia:

> **If a student has an outstanding fee balance, their report card is
> withheld. Once fees are fully paid, the report card is released.**

The `publish` function implements this:

```js
export async function publish(req, res) {
  const { balance } = await getStudentBalance(studentId);

  if (balance === 0) {
    // Student has paid in full:
    // 1. Generate a PDF report card
    const pdfBuffer = await generateReportCardPdf({ ... });
    // 2. Upload it to Supabase Storage
    const pdfPath = await uploadReportCard({ ... });
    // 3. Mark the report card as RELEASED in the database
    await prisma.reportCard.upsert({ ..., data: { status: 'RELEASED' } });
    // 4. Email and SMS the guardian
    await notifyRelease({ ... });
    return res.json({ status: 'RELEASED' });
  }

  // Student still owes fees:
  // 1. Mark the report card as WITHHELD
  await prisma.reportCard.upsert({ ..., data: { status: 'WITHHELD' } });
  // 2. Email and SMS the guardian with the outstanding amount
  await notifyWithheld({ ... });
  res.json({ status: 'WITHHELD', balance });
}
```

The notification calls use `Promise.allSettled` (not `Promise.all`). The
difference: `allSettled` waits for all promises to complete *even if some
fail*, whereas `all` stops at the first failure. A failed SMS should not
prevent the report card from being marked released.

---

### `controllers/subscription.controller.js` — Subscription renewal

Two ways to confirm a payment:

**1. verifyByReference** (client-side polling):
After Paystack processes the payment, the browser is redirected to a
callback URL with `?reference=xxxxx`. The frontend calls this endpoint
with that reference. The server verifies with Paystack's API and extends
the subscription.

**2. webhook** (Paystack calls the server directly):
In production, Paystack sends an HTTP POST to the server when any payment
succeeds. The server verifies the cryptographic signature to prove the
request genuinely came from Paystack (not a hacker pretending to pay).

Both paths call `activateSubscription(tenantId, reference)` which:
- Extends the expiry by one year from the current expiry (not from today —
  so paying early doesn't lose time).
- Sets status to `ACTIVE`.

---

### `controllers/communication.controller.js` — Communication log

`list` — Returns all past email and SMS dispatches for a school, paginated,
with optional filters for channel (EMAIL/SMS) and status (SENT/FAILED).

`retry` — Re-sends a previously failed message. For SMS, it just calls the
SMS service again. For emails that carried a PDF attachment (result releases),
it throws an error explaining that re-publishing the report card is required
(because the PDF must be re-generated fresh).

---

## `server/src/services/` — Business logic

Services are pure business logic functions. They don't deal with HTTP
(`req`/`res`). They receive plain data, do work, and return results.
This separation makes them easy to test in isolation.

---

### `services/tenant.service.js` — createTenantWithAdmin

Creates a new school in one atomic operation using a **Prisma transaction**:

```js
return await prisma.$transaction(async (tx) => {
  const tenant = await tx.tenant.create({ data: { name, schoolLevel } });
  const admin  = await tx.user.create({ data: { tenantId: tenant.id, ... } });
  const subscription = await tx.subscription.create({
    data: { tenantId: tenant.id, status: 'ACTIVE', expiresAt }
  });
  return { tenant, admin, subscription };
});
```

A transaction here means: if creating the subscription fails (e.g. a database
constraint is violated), the tenant and admin records are also rolled back.
You never get a school with no subscription, or an admin with no school.

If the Supabase user creation succeeds but the Prisma transaction fails, the
Supabase user is deleted to avoid orphaned accounts.

---

### `services/fee.service.js` — Fee calculations

**computeBalance** — the formula:

```
Outstanding Balance = Total Charged − Sum of VALIDATED payments
```

Only **validated** payments count. A payment is `validated: true` when the
controller records it. The `validated` flag exists so a payment gateway
integration could create an "unvalidated" payment that only becomes validated
after the gateway confirms it.

```js
export function computeBalance(account) {
  if (!account) return 0;
  const validatedPaid = (account.payments || [])
    .filter(p => p.validated)
    .reduce((sum, p) => sum + p.amount, 0);
  return Math.max(account.totalCharged - validatedPaid, 0);
  // Math.max(..., 0) ensures it never goes negative (overpayment = 0 balance)
}
```

**getOrCreateFeeAccount** — lazy creation: if a student doesn't have a fee
account yet (new student), it creates one on first access.

---

### `services/grade.service.js` — Grade aggregation

```js
export function computeAggregate({ caScore, midtermScore, examScore }) {
  if (caScore == null && midtermScore == null && examScore == null) return null;

  let weighted = 0;
  let totalWeight = 0;

  if (caScore      != null) { weighted += caScore      * 0.30; totalWeight += 0.30; }
  if (midtermScore != null) { weighted += midtermScore * 0.20; totalWeight += 0.20; }
  if (examScore    != null) { weighted += examScore    * 0.50; totalWeight += 0.50; }

  // Scale to 100 so partial entry still shows a sensible number
  // e.g. if only caScore=80 is entered: (80*0.3)/0.3 = 80
  const raw = totalWeight > 0 ? weighted / totalWeight : 0;
  return Math.round(raw * 100) / 100;  // Round to 2 decimal places
}
```

`letterGrade` converts a number to A/B/C/D/E/F. `gradeRemark` converts it
to Excellent / Very Good / Good / Average / Below Average / Fail.

---

### `services/audit.service.js` — Audit logging

Records every important action — who did what, to which record, and why.
Used for accountability and dispute resolution.

```js
export async function recordAudit({ tenantId, actorId, action, targetType, targetId, reason, metadata }) {
  try {
    await prisma.auditLog.create({ data: { ... } });
  } catch (err) {
    // IMPORTANT: Audit failures must never block the action being audited.
    // Log the error but do not re-throw it.
    logger.error('Failed to write audit log', { ... });
  }
}
```

The `try/catch` that swallows the error is intentional — if the audit log
table is temporarily unavailable, the fee override or teacher deactivation
should still succeed.

---

### `services/email.service.js` — Email sending

Supports two providers: **Resend** (modern email API) and **SMTP**
(traditional email protocol, e.g. Gmail, Mailtrap).

The internal `send` function:
1. Tries to send via the configured provider.
2. On success: writes a `SENT` record to the `Communication` table.
3. On failure: writes a `FAILED` record and re-throws the error (so the
   caller can handle it).

Two exported functions:
- `sendResultEmail` — attaches the PDF and tells the guardian the report
  card is ready.
- `sendFeeReminderEmail` — tells the guardian how much is owed.

---

### `services/sms.service.js` — SMS sending

Same pattern as email but for text messages. Supports **Arkesel** (Ghanaian
SMS provider) and **Hubtel**.

Uses `normalizeGhanaPhone` before sending. If the phone number is invalid,
it logs a FAILED communication and throws without even trying to send.

---

### `services/payment.service.js` — Payment processing

Handles subscription renewal via **Paystack** or **Flutterwave**.

**Initialization** — creates a checkout session on the payment provider's
servers and returns a URL to redirect the user to:
```js
const reference = `akademia_${tenantId}_${Date.now()}_${randomHex}`;
// The reference embeds the tenantId so the webhook knows which school paid
```

**Verification** — asks the payment provider "did reference X actually succeed?"

**Webhook signature verification** — uses HMAC-SHA512 (a cryptographic
function) to prove the request came from Paystack and not a forger:
```js
const hash = crypto
  .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
  .update(rawBody)
  .digest('hex');
return hash === signatureHeader;
```

---

### `services/pdf.service.js` — Report card PDF generation

Uses **PDFKit** to draw the report card programmatically — like drawing on a
canvas with code.

```js
export function generateReportCardPdf({ tenantName, student, term, grades, ... }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    // PDFKit streams data out in chunks as it renders
    doc.on('data', (chunk) => chunks.push(chunk));
    // When it's done, combine all chunks into one Buffer (binary data)
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text(tenantName, { align: 'center' });
    doc.text(`Student: ${student.fullName}`);
    // ... draw the grade table, attendance summary, etc.

    doc.end();  // Trigger the 'end' event
  });
}
```

Returns a `Buffer` — raw binary data representing the PDF file. This buffer
is then either emailed as an attachment or uploaded to Supabase Storage.

---

### `services/storage.service.js` — File storage

Uploads and downloads PDF files to/from Supabase Storage:

```js
function reportCardPath(tenantId, studentId, termId) {
  return `${tenantId}/${studentId}/${termId}.pdf`;
  // Files are organized in a folder structure: tenantId/studentId/termId.pdf
}

export async function uploadReportCard({ tenantId, studentId, termId, pdfBuffer }) {
  const path = reportCardPath(tenantId, studentId, termId);
  await supabaseAdmin.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(path, pdfBuffer, { contentType: 'application/pdf', upsert: true });
  return path;
}
```

`upsert: true` means "overwrite if a file already exists at this path" — so
re-publishing a report card replaces the old PDF.

---

### `services/communication.service.js` — Communication log helper

A tiny shared function called by both `email.service.js` and `sms.service.js`
to write a record to the `Communication` table:

```js
export async function logCommunication({ tenantId, channel, recipient, templateKey, status, providerResponse, payload }) {
  await prisma.communication.create({ data: { ... } });
}
```

Errors in logging are swallowed (just like audit logging) — a failure to log
a communication must not prevent the communication from being sent.

---

## `server/prisma/` — Database definition and setup

### `prisma/schema.prisma` — The data model

This file defines every table in the database using Prisma's Schema Language.
Think of it as a precise description of every spreadsheet in the app.

**Key models and what they represent:**

```prisma
model Tenant {
  // One row per school
  id          String      @id @default(uuid())
  // @id = primary key (unique identifier for each row)
  // @default(uuid()) = auto-generate a UUID when a row is created
  name        String
  schoolLevel SchoolLevel  // PRIMARY | JHS | SHS (an enum)
  createdAt   DateTime    @default(now())

  // Relations — these aren't real columns, they tell Prisma how tables connect
  users       User[]      // A school has many users
  students    Student[]   // A school has many students
  subscription Subscription?  // A school has one subscription (optional — ?)
}
```

```prisma
model Student {
  id              String    @id @default(uuid())
  tenantId        String    // Which school this student belongs to
  admissionNumber String
  fullName        String
  active          Boolean   @default(true)

  // Every student can have:
  guardians   StudentGuardian[]    // Linked parents/guardians
  enrollments Enrollment[]         // Which class they are in
  attendance  Attendance[]         // Daily attendance records
  grades      Grade[]              // Grades per subject per term
  feeAccount  StudentFeeAccount?   // Their fee ledger (one account)
  reportCards ReportCard[]         // One report card per term

  @@unique([tenantId, admissionNumber])
  // Can't have two students with the same admission number in the same school
}
```

```prisma
model Grade {
  // One row per student × subject × term
  studentId    String
  subjectId    String
  termId       String
  caScore      Float?   // ? means nullable (the score might not be entered yet)
  midtermScore Float?
  examScore    Float?
  aggregate    Float?   // Computed by grade.service.computeAggregate
  finalized    Boolean  @default(false)

  @@unique([studentId, subjectId, termId])
  // A student can only have one grade record per subject per term
}
```

**Enums** define a fixed set of allowed values:
```prisma
enum Role {
  SUPER_ADMIN
  SCHOOL_ADMIN
  STAFF
}
```
Using an enum means the database itself rejects any value not in the list.

---

### `prisma/seed.js` — Demo data

A script that populates the database with realistic demo data so you can
log in and try the app immediately without entering data manually.

It creates:
- A `SUPER_ADMIN` user: `superadmin@akademia.app` / `ChangeMe123!`
- A demo school: "Demo Primary School"
- A `SCHOOL_ADMIN` for that school: `admin@demoschool.app` / `Admin123!`
- A teacher: `teacher@demoschool.app` / `Staff123!`
- An academic year, a term, a class, three subjects
- Three demo students with fee accounts and attendance records

Users are created in Supabase Auth first (for the password), then the profile
is created in the Prisma database (for the role and tenant).

---

## The `client/` folder

The React frontend. Everything here runs in the user's browser.

```
client/
├── src/
│   ├── main.jsx          Entry point — mounts React into index.html
│   ├── App.jsx           Router — maps URLs to page components
│   ├── index.css         Global CSS styles (Tailwind + custom)
│   ├── api/              Functions that call the server API
│   ├── context/          Shared state (authentication)
│   ├── routes/           Route guards (protected routes)
│   ├── layouts/          Page shells (sidebar + header + content area)
│   ├── pages/            The actual screens of the app
│   ├── components/ui/    Reusable UI building blocks
│   ├── hooks/            Custom React hooks (reusable logic)
│   └── lib/              Third-party client initializations
├── public/               Static files served as-is (favicon, etc.)
├── index.html            The single HTML file React renders into
├── vite.config.js        Vite build tool configuration
├── tailwind.config.js    Tailwind CSS design tokens
└── .env.example          Client environment variable template
```

---

### What is React?

React is a JavaScript library for building user interfaces. Instead of
manually updating the HTML when data changes, you describe *what the UI
should look like* given the current data, and React updates the page
automatically.

The building blocks are **components** — JavaScript functions that return
HTML-like syntax called JSX:

```jsx
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}
// Using: <Greeting name="Kofi" />  →  renders: Hello, Kofi!
```

### What is Tailwind CSS?

Instead of writing a separate CSS file, Tailwind provides utility classes
you apply directly in the HTML/JSX:

```jsx
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
  Save
</button>
```

Each class name does one thing: `bg-blue-600` = background colour, `px-4` =
horizontal padding, `rounded-lg` = rounded corners.

### What is Vite?

Vite is the build tool. In development, it serves your React code instantly
with hot reloading (the page updates as you save files without a full refresh).
For production, it bundles and minifies everything into small, fast files.

---

### `client/src/main.jsx` — React entry point

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import App from './App.jsx';
import './index.css';

// Mount the React app into the <div id="root"> in index.html
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>   {/* Warns about common mistakes in development */}
    <BrowserRouter>    {/* Enables client-side routing (no full page reloads) */}
      <AuthProvider>   {/* Makes authentication state available everywhere */}
        <App />
        <Toaster ... /> {/* Global toast notification system */}
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

Wrapping everything in providers is called the **Provider Pattern**. It makes
shared state (auth, routing) available anywhere in the component tree without
passing it as props through every level.

---

### `client/src/App.jsx` — The router

Defines which component renders for which URL. Uses React Router v6:

```jsx
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/"      element={<RootRedirect />} />

      {/* Protected routes — only accessible to specific roles */}
      <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/super-admin" element={<TenantsDashboard />} />
        </Route>
      </Route>
    </Routes>
  );
}
```

The nesting is meaningful: `ProtectedRoute` checks if you are logged in with
the right role. `DashboardLayout` renders the sidebar + header shell.
The page component fills the content area.

`RootRedirect` checks your role after login and sends you to the right
dashboard automatically.

---

### `client/src/context/AuthContext.jsx` — Authentication state

**What is Context?**
React Context is a way to share data between components without passing it
as props through every level. `AuthContext` makes the current user available
to any component in the app.

```jsx
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);    // null = not logged in
  const [loading, setLoading] = useState(true);    // true while restoring session

  // On first load: check if the user was already logged in (from a previous visit)
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAccessToken(session.access_token);  // Give axios the token
        await loadProfile();                    // Fetch role etc. from the API
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    // 1. Sign in with Supabase (validates email + password)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    // 2. Give the token to axios so every future API call includes it
    setAccessToken(data.session.access_token);

    // 3. Load our own profile from the Akademia API (role, tenantId, etc.)
    const profile = await loadProfile();
    return profile;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — lets any component access auth state with one line:
// const { user, login, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
```

---

### `client/src/routes/ProtectedRoute.jsx` — Route guard

```jsx
export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  // Show a loading spinner while restoring the session
  if (loading) return <LoadingScreen />;

  // Not logged in → redirect to login page
  if (!user) return <Navigate to="/login" replace />;

  // Wrong role → redirect to the user's own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleDashboard(user.role)} replace />;
  }

  // Correct role → render the nested route
  return <Outlet />;
}
```

`<Outlet />` is a React Router concept — it renders whatever child route
matched. The `ProtectedRoute` wraps a group of routes in `App.jsx`.

---

### `client/src/layouts/DashboardLayout.jsx` — The app shell

This is the persistent chrome around every page — the sidebar, the top bar,
and the content area. It uses `<Outlet />` to render the current page in
the content area.

Key parts:
- **Sidebar** — collapses on desktop, slides in from left on mobile.
- **Navigation links** — `getNav(role)` returns different nav items based
  on whether you are a Super Admin, School Admin, or Staff.
- `NavLink` from React Router highlights the active link automatically.
- **User avatar** — shows the user's initials in a coloured circle.
- **Logout button** — calls `useAuth().logout()` then navigates to `/login`.
- **HelpDrawer** — a slide-in panel with usage instructions.
- **FirstTimeOverlay** — shown once on first login to orient new users.
- **BreadCrumb** — reads the current URL and turns it into a readable page
  title: `/admin/students` → "Students".

---

### `client/src/lib/supabaseClient.js` — Supabase browser client

```js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY  // The PUBLIC (anon) key — safe to ship
);
```

`import.meta.env` is how Vite reads environment variables in the browser.
Variables must start with `VITE_` to be accessible in the browser.

The **anon key** is not a secret — it is designed to be public. It allows
the browser to use Supabase Auth (login/logout) but gives no access to the
database directly. All database access goes through the Akademia API server.

---

### `client/src/api/axiosClient.js` — The HTTP client

**What is Axios?**
Axios is a library for making HTTP requests from the browser (like `fetch`
but with a nicer API and automatic JSON parsing).

```js
let _accessToken = null;
export function setAccessToken(token) { _accessToken = token; }

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
});

// Interceptor — runs before EVERY request
axiosClient.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
    // Attaches the token so the server knows who we are
  }
  return config;
});

// Interceptor — runs after EVERY response
axiosClient.interceptors.response.use(
  (response) => response,  // Success — pass through
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid → redirect to login
      setAccessToken(null);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

Every API module in `src/api/` imports this client and uses it.

---

### `client/src/api/` — API function modules

Each file in this folder is a thin wrapper around the HTTP endpoints:

```js
// api/students.js
import api from './axiosClient';

export const studentsApi = {
  list:       (params) => api.get('/students', { params }),
  get:        (id)     => api.get(`/students/${id}`),
  create:     (data)   => api.post('/students', data),
  update:     (id, data) => api.patch(`/students/${id}`, data),
  deactivate: (id)     => api.delete(`/students/${id}`),
  addGuardian:(id, data) => api.post(`/students/${id}/guardians`, data),
};
```

Page components import these and call them:
```js
const { data } = await studentsApi.list({ page: 1, search: 'Kofi' });
```

The other API files follow the exact same pattern:
- `auth.js` — `me()` (get own profile)
- `tenants.js` — CRUD for school tenants (Super Admin)
- `staff.js` — teacher management and assignments
- `attendance.js` — submit and query attendance
- `fees.js` — fee structures, payments, balances
- `grades.js` — grade sheet load/save/finalize
- `reportcards.js` — publish, get, download PDF
- `communications.js` — list and retry
- `subscriptions.js` — status, renew, verify payment

---

## `client/src/pages/` — The screens

### Auth pages

**`pages/Auth/Login.jsx`**
The login page. Has a form with email and password fields. On submit, calls
`useAuth().login(email, password)`. On success, React Router redirects to
the role-appropriate dashboard. Quick-fill buttons for demo accounts make
testing faster.

---

### Super Admin pages

**`pages/SuperAdmin/TenantsDashboard.jsx`**
Lists all schools registered on the platform with their subscription status,
student count, and user count. Has a modal form to create new schools.

**`pages/SuperAdmin/TenantDetail.jsx`**
Detailed view of one school. Shows its users, subscription details, and
allows editing the subscription dates.

---

### School Admin pages

**`pages/SchoolAdmin/AdminDashboard.jsx`**
Overview dashboard with stat cards (student count, today's attendance %, fee
collection, recent communications).

**`pages/SchoolAdmin/Students.jsx`**
A searchable, paginated table of all students. Includes modals for:
- Adding a new student
- Viewing/editing a student record
- Adding a guardian
- Deactivating a student

**`pages/SchoolAdmin/StaffManagement.jsx`**
Manage teachers. List of all teachers with their class/subject assignments.
Modals for adding a new teacher and assigning them to class/subject pairs.

**`pages/SchoolAdmin/Attendance.jsx`**
Read-only attendance overview for the admin. Filters by class and date. Shows
the full roster with each student's status.

**`pages/SchoolAdmin/Fees.jsx`**
Two sections:
1. Create a fee structure for a term (the amount charged per student).
2. Record a payment for a specific student.
Also shows the outstanding balance list.

**`pages/SchoolAdmin/Grades.jsx`**
The admin's view of the grade sheet. Selects class, subject, and term, then
shows the grid loaded from `GET /grades/sheet/:classId/:subjectId/:termId`.
Admins can edit and finalize from here.

**`pages/SchoolAdmin/PublishResults.jsx`**
For each student, triggers `POST /report-cards/publish/:studentId/:termId`.
Shows whether the card was RELEASED or WITHHELD and the outstanding balance.

**`pages/SchoolAdmin/Communications.jsx`**
Log of all sent emails and SMS messages. Filters by channel and status.
Retry button for failed communications.

**`pages/SchoolAdmin/Subscription.jsx`**
Shows current subscription status and days remaining. Has a "Renew" button
that calls Paystack to initiate payment. After payment, calls
`/subscriptions/renew/verify?reference=xxx` to activate the extension.

---

### Staff pages

**`pages/Staff/StaffDashboard.jsx`**
Simplified dashboard for teachers. Shows their class assignments and a
summary of today's attendance if they've marked it.

**`pages/Staff/Attendance.jsx`**
The attendance marking screen. Teacher selects a class and date, then sees
a roster where they click PRESENT / ABSENT / TARDY for each student.
Submits all at once to `POST /attendance`.

**`pages/Staff/GradeEntry.jsx`**
The grade entry spreadsheet. Teacher selects one of their assigned
class/subject combinations. A table loads all students with input fields
for CA, midterm, and exam scores. The aggregate is computed live as they
type. A "Save All" button submits the whole sheet at once. A "Finalize"
button locks all grades.

---

## `client/src/components/ui/` — Shared UI components

These are reusable building blocks used across many pages.

**`Button.jsx`** — A styled button with variant support (primary, secondary,
danger) and a loading spinner state.

**`Input.jsx`** — A styled form input with a label and optional error message.

**`Modal.jsx`** — A dialog overlay. Accepts a title, body content, and footer
buttons. Closes on backdrop click or Escape key.

**`DataTable.jsx`** — A table component that accepts columns and rows. Handles
empty states with a friendly message.

**`StatCard.jsx`** — A dashboard stat widget. Shows an icon, a label, and a
large number (e.g. "Total Students — 142").

**`StatusBadge.jsx`** — A coloured pill that shows a status. ACTIVE = green,
EXPIRED_LOCKED = red, WITHHELD = amber, etc.

**`Logo.jsx`** — The Akademia logo SVG. Accepts a `size` prop.

**`Tooltip.jsx`** — Shows a small floating text label when hovering over
an element.

**`HelpDrawer.jsx`** — A slide-in panel from the right that explains how
to use the current section. Opened by the "Help" button in the top bar.

**`FirstTimeOverlay.jsx`** — A full-screen welcome walkthrough shown once
to new users to orient them. Stored in `localStorage` so it only shows once.

---

## `client/src/hooks/` — Custom React hooks

**What is a hook?**
A React hook is a function whose name starts with `use`. Hooks let you
reuse stateful logic between components. For example, instead of writing
the same "fetch data, handle loading, handle error" code on every page,
you write it once in a `useFetch` hook and call it everywhere.

The `hooks/README.md` describes hooks that are planned or can be added here
as the project grows — for example `usePagination`, `useStudents`,
`useDebounce`.

---

## `server/prisma/migrations/` — Database migration history

**What is a migration?**
When you change the database schema (add a table, add a column), you can't
just edit `schema.prisma` — the database on Supabase still has the old
structure. A migration is a SQL file that describes *how to change* the
existing database to match the new schema.

Running `npx prisma migrate dev` generates a new SQL file and runs it
against the database. The `migrations/` folder is the history of all
such changes — never delete these files.

---

## How a request flows through the system — end to end

Let's trace what happens when a School Admin saves attendance:

```
Teacher clicks "Save Attendance" in the browser
    │
    ▼
GradeEntry.jsx calls attendanceApi.submit({ date, records })
    │
    ▼
axiosClient.js adds Authorization: Bearer <token> to the request
    │
    ▼
POST http://localhost:5000/api/v1/attendance  arrives at the server
    │
    ▼
app.js Express pipeline:
  1. helmet()             — adds security headers
  2. cors()               — checks origin is allowed
  3. express.json()       — parses the body from JSON text to a JS object
  4. morgan()             — logs "POST /api/v1/attendance 201 23ms"
    │
    ▼
attendance.routes.js:
  5. requireAuth          — verifies the Bearer token with Supabase,
                            loads the user profile, attaches to req.user
  6. attachTenant         — copies req.user.tenantId → req.tenantId
  7. requireActiveSubscription — checks the school's subscription is valid
  8. requireRole('STAFF', 'SCHOOL_ADMIN') — checks the user has permission
  9. validate({ body: submitSchema }) — validates date and records array
    │
    ▼
attendance.controller.js → submit():
  10. Verifies all studentIds belong to this tenant
  11. prisma.$transaction() — upserts all attendance records atomically
  12. res.status(201).json({ attendance: results })
    │
    ▼
Response arrives back in the browser
    │
    ▼
React updates the UI to show success
toast.success("Attendance saved!")
```

Every step is protected. A compromised token → step 5 rejects it. Wrong
role → step 8 rejects it. Invalid data → step 9 rejects it. Wrong tenant →
step 10 rejects it.

---

## Glossary

| Term | Meaning |
|---|---|
| API | Application Programming Interface — a set of URLs the server exposes for the client to call |
| Async/Await | JavaScript syntax for handling operations that take time (DB queries, HTTP calls) without blocking |
| Buffer | Raw binary data — used for PDF files, webhook bodies |
| CRUD | Create, Read, Update, Delete — the four basic database operations |
| ENV variable | A value stored outside the code, typically in a `.env` file |
| ESM / import | Modern JavaScript module system (`import x from 'y'` instead of `require('y')`) |
| HTTP status codes | 200=OK, 201=Created, 400=Bad Request, 401=Unauthorized, 403=Forbidden, 404=Not Found, 409=Conflict, 500=Server Error |
| JWT | JSON Web Token — a signed token the browser sends to prove identity |
| Middleware | A function in Express that runs between request and response |
| Migration | A versioned SQL change to the database schema |
| Multi-tenancy | Many organisations (schools) sharing one deployed application |
| ORM | Object-Relational Mapper — Prisma translates JS to SQL |
| Pagination | Splitting large lists into pages to avoid loading thousands of rows |
| Regex | Regular Expression — a pattern for matching text |
| REST | Representational State Transfer — the style of API design used here |
| Singleton | An object created only once and reused throughout the application |
| Transaction | A group of database operations that all succeed or all fail together |
| Upsert | Insert if the record doesn't exist, update if it does |
| UUID | Universally Unique Identifier — a random 36-character ID like `f47ac10b-...` |

---

*Akademia TUTOR.md · Last updated September 2026*
