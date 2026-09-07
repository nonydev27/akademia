# Akademia — The Complete Beginner's Guide to This Codebase

You said you're new to programming, so this document explains **everything** —
every file, and what each part of the code is doing — in plain language.
It's long on purpose. Don't read it top to bottom in one sitting; use the
table of contents to jump to whatever file you're curious about.

---

## Table of Contents

1. [Programming concepts you'll see everywhere](#1-programming-concepts-youll-see-everywhere)
2. [The big picture: what this app does](#2-the-big-picture-what-this-app-does)
3. [The tech stack, explained](#3-the-tech-stack-explained)
4. [Folder map](#4-folder-map)
5. [The database (`prisma/schema.prisma`)](#5-the-database-prismaschemaprisma)
6. [The backend (`server/`), file by file](#6-the-backend-server-file-by-file)
7. [The frontend (`client/`), file by file](#7-the-frontend-client-file-by-file)
8. [Two full walkthroughs, traced end to end](#8-two-full-walkthroughs-traced-end-to-end)
9. [Where your secrets live, and how to run everything](#9-where-your-secrets-live-and-how-to-run-everything)

---

## 1. Programming concepts you'll see everywhere

Rather than re-explain these 80 times (once per file), here they are once.
Whenever you see one of these in a file below, come back here if you forget
what it means.

### JavaScript basics

- **`import X from 'y'`** — "go get the tool/value named `X` that another
  file exports, from the file/package called `y`." It's like plugging in a
  power tool someone else built, instead of building it yourself.
- **`export`** / **`export default`** — the opposite of import: "let other
  files use this thing I just built." `export default` means "this is the
  *one main thing* this file provides"; a plain `export const foo = ...`
  means "this is *one of possibly several* things this file provides."
- **`const` / `let`** — ways to create a variable (a named box that holds a
  value). `const` means the box can never be reassigned to hold something
  else; `let` means it can. This codebase almost never uses the old `var`.
- **Arrow functions** — `(a, b) => a + b` is a compact way to write a
  function. It's the same idea as `function(a, b) { return a + b; }`, just
  shorter. You'll see `() => setLoading(true)` a lot — "a function that,
  when called, sets loading to true."
- **Template literals** — `` `Hello ${name}` `` is a string with a variable
  spliced in. The backticks (`` ` ``) let you embed `${...}` expressions
  directly instead of gluing strings together with `+`.
- **Destructuring** — `const { id, name } = student` pulls `id` and `name`
  out of the `student` object into their own variables in one line, instead
  of writing `const id = student.id; const name = student.name;` twice.
- **Spread (`...`)** — `{ ...obj, extra: 1 }` makes a *new* object that's a
  copy of `obj` plus one more field. `[...arr, item]` makes a new array
  that's `arr` plus one more item at the end. React relies on this constantly
  because it never mutates state directly — it always creates fresh
  copies.
- **Optional chaining (`?.`)** — `user?.fullName` means "read `fullName` off
  `user`, but if `user` is `null`/`undefined`, just give me `undefined`
  instead of crashing." Saves you from writing `user && user.fullName`
  everywhere.
- **Nullish coalescing (`??`)** — `value ?? 'default'` means "use `value`,
  unless it's `null`/`undefined`, in which case use `'default'`."
- **`async` / `await`** — JavaScript often has to *wait* for something slow
  (a network request, a database query) without freezing the whole program.
  A function marked `async` can use `await somePromise` to pause *just that
  function* until the slow thing finishes, then continue with the result.
  Almost every database call and API call in this app is awaited.
- **Promises** — the object an `async` operation gives you immediately,
  which will later resolve (succeed) or reject (fail). `Promise.all([...])`
  runs several promises at once and waits for all of them.
- **`try { ... } catch (err) { ... }`** — "attempt this code; if anything in
  it throws an error, jump to the `catch` block instead of crashing the
  whole app." `finally { ... }` (used a lot here) always runs afterward,
  success or failure — perfect for "turn off the loading spinner no matter
  what happened."
- **Ternary (`condition ? a : b`)** — a one-line if/else: "if `condition` is
  true, use `a`, otherwise use `b`."

### React basics

React is a library for building user interfaces out of small, reusable
pieces called **components**. A component is just a JavaScript function that
returns a description of some HTML (written in a syntax called **JSX**,
which looks like HTML mixed into JavaScript).

- **JSX** — `<div className="card">{title}</div>` looks like HTML but it's
  actually JavaScript. `className` is JSX's name for HTML's `class`
  attribute (`class` is a reserved word in JS, hence the rename). Anything
  inside `{curly braces}` is a JavaScript expression being inserted into the
  markup.
- **Props** — the inputs to a component. `<StatCard label="Students" />`
  passes a prop called `label` into the `StatCard` component, the same way
  you'd pass an argument into a function.
- **`useState`** — the hook that gives a component memory.
  `const [count, setCount] = useState(0)` creates a piece of state called
  `count` starting at `0`, plus a function `setCount` to change it. Calling
  `setCount(5)` updates the value **and** tells React "please re-render this
  component so the screen reflects the new value."
- **`useEffect`** — "run this code after the component renders, and
  optionally again whenever certain values change." `useEffect(fn, [])` with
  an empty array means "run `fn` exactly once, right after the first
  render" — commonly used to fetch data when a page first loads.
  `useEffect(fn, [x])` means "run `fn` again whenever `x` changes."
- **`useCallback` / `useMemo`** — performance helpers that "remember" a
  function or value between renders instead of recreating it every time.
  You'll see `useCallback` a couple of times in this codebase; you can treat
  it as "a `useState`-friendly version of a function."
- **Hooks in general** — any function starting with `use` (`useState`,
  `useEffect`, `useAuth`, `useNavigate`...) is a "hook": a special function
  that only works inside a React component and lets that component tap into
  React features (memory, lifecycle, routing, etc).
- **Conditional rendering** — `{loading ? <Spinner /> : <Table />}` or
  `{error && <ErrorMessage />}` — showing different markup depending on
  state. `x && <Thing />` is a common shortcut: if `x` is false/null, nothing
  renders; if `x` is truthy, `<Thing />` renders.
- **Lists** — `{items.map((item) => <Row key={item.id} {...item} />)}`
  turns an array into a list of components. React requires a unique `key`
  on each item so it can efficiently track which row is which when the list
  changes.
- **Context** (`createContext`, `useContext`) — a way to share a piece of
  data (like "who is logged in") with *any* component in the tree, without
  manually passing it down through every layer of props. This app has one
  context: `AuthContext`.

### Backend / web basics

- **HTTP request/response** — a browser (or `axios`, see below) sends a
  request to a URL ("GET me the list of students"), and a server sends back
  a response (the data, or an error).
- **REST API** — a convention for organizing those URLs: `GET /students`
  lists students, `POST /students` creates one, `PATCH /students/:id`
  updates one, `DELETE /students/:id` removes one. This backend follows
  that convention throughout.
- **Express** — the Node.js library this backend uses to define those
  URLs ("routes") and what code runs for each one.
- **Middleware** — a function that runs *before* the real route handler,
  usually to check something or attach data to the request. This app chains
  several: "is this token valid?" → "which school does this user belong
  to?" → "is their subscription active?" → *then* the actual controller
  logic runs.
- **JWT (JSON Web Token)** — a signed, tamper-proof piece of text that
  proves "this is user X, and it was issued by a server we trust." Supabase
  issues these when someone logs in; our backend checks them on every
  request that needs to know who's asking.
- **ORM (Object-Relational Mapper)** — a library that lets you talk to a
  database using JavaScript objects and function calls instead of writing
  raw SQL by hand. This app uses **Prisma** as its ORM.
- **Environment variables (`.env`)** — secrets and settings (database
  passwords, API keys) that shouldn't be hard-coded into the source code or
  committed to git. They live in a `.env` file and are read at startup.

Keep this section open in another tab — the file walkthroughs below assume
you've read it once.

---

## 2. The big picture: what this app does

**Akademia** is software a school (or a company selling *to* schools) would
run to manage day-to-day operations:

- Multiple schools ("tenants") share the same running app and database, but
  each school's data is walled off from every other school's — this is
  called **multi-tenancy**.
- Three kinds of people log in, each with a different role and a different
  set of screens:
  - **Super Admin** — runs the whole platform. Creates new school accounts,
    manages each school's subscription/billing status.
  - **School Admin** — runs one school. Manages students, fees, publishes
    results, sends communications, handles that school's subscription.
  - **Staff** (teachers) — marks attendance and enters grades for their
    classes.
- The single most distinctive business rule in the whole app is the
  **Result-Fee Intercept**: a student's report card is only released if
  their fees are fully paid. If they still owe money, the report card is
  withheld and a payment reminder goes out instead. This is implemented in
  one place: `server/src/controllers/reportcard.controller.js`.
- Schools pay an annual subscription to keep using the platform. If it
  lapses, they get a grace period, then get locked out until they renew.

---

## 3. The tech stack, explained

| Piece | What it is | Why it's here |
|---|---|---|
| **React** | A JavaScript library for building the UI out of components | The whole `client/` app is built with it |
| **Vite** | A fast dev server + build tool for frontend projects | Runs `client/` locally (`npm run dev`) and bundles it for production |
| **Tailwind CSS** | A CSS framework where you style things with utility classes directly in your markup (`className="px-4 py-2 rounded-xl"`) instead of writing separate `.css` files per component | All the visual styling in `client/` |
| **lucide-react** | A library of ready-made icon components (`<Users />`, `<Wallet />`, etc.) | Every icon in the UI |
| **React Router** | Lets a single-page app show different "pages" at different URLs without a full page reload | `client/src/App.jsx` defines every route |
| **Node.js** | A JavaScript runtime that can run outside the browser | Powers the entire `server/` |
| **Express** | A minimal web framework for Node — defines URLs ("routes") and what runs for each | The backbone of `server/` |
| **Prisma** | An ORM — lets the server talk to the Postgres database using JS function calls instead of raw SQL, and defines the database's shape in one file (`schema.prisma`) | All database reads/writes |
| **PostgreSQL** | The actual database that stores every table (students, fees, grades, etc.) | Hosted for us by Supabase |
| **Supabase** | A hosted platform that gives you a Postgres database, a user-authentication system, and file storage, all managed for you | Provides the Postgres database, handles login/passwords (Supabase Auth), and stores generated PDF report cards (Supabase Storage) |
| **Zod** | A library for describing "what shape should this data be" and validating it | Every API endpoint validates its input with a Zod schema before touching the database |
| **axios** | A library for making HTTP requests from the browser to our API | `client/src/api/*.js` uses it for every network call |
| **react-hot-toast** | Small pop-up notification banners ("Saved!", "Something went wrong") | Used throughout the client for feedback |

---

## 4. Folder map

```
akademia/
├── client/                    React frontend (what runs in the browser)
│   ├── public/                Static files served as-is (favicon.svg)
│   ├── src/
│   │   ├── api/                One file per backend resource — wraps axios calls
│   │   ├── components/ui/      Small reusable building blocks (Button, Modal, ...)
│   │   ├── context/             App-wide shared state (who's logged in)
│   │   ├── layouts/            Page "frames" shared across many pages (sidebar + header)
│   │   ├── lib/                 Setup code for third-party libraries (Supabase client)
│   │   ├── pages/               One file per actual screen, grouped by role
│   │   ├── routes/              Logic that decides who's allowed to see what
│   │   ├── App.jsx             The route map: URL → which page component
│   │   ├── main.jsx             The very first file that runs — boots React
│   │   └── index.css            Tailwind setup + custom reusable CSS classes
│   └── index.html               The one real HTML file; React takes over inside it
│
└── server/                    Express backend (runs on a server, not in the browser)
    ├── prisma/
    │   ├── schema.prisma        Defines every database table and its columns
    │   └── seed.js              Script that fills a fresh database with demo data
    └── src/
        ├── config/              Setup code (database connection, Supabase clients, env vars)
        ├── middleware/          Checks that run before a route's real logic
        ├── routes/              Defines URLs, e.g. POST /api/v1/students
        ├── controllers/         The actual logic behind each URL
        ├── services/            Reusable business logic controllers call into
        ├── utils/               Small generic helpers (errors, logging, phone numbers)
        ├── app.js               Wires together middleware + all the routes
        └── index.js             The real entry point — starts the server listening
```

---

## 5. The database (`prisma/schema.prisma`)

This file is the single source of truth for what data the app stores. Each
`model` block becomes a real table in Postgres. Prisma reads this file and
generates a matching JavaScript API (`prisma.student.findMany()`,
`prisma.user.create()`, etc.) so the rest of the code never writes raw SQL.

A few Prisma syntax notes that apply to every model below:
- `@id @default(uuid())` — this column is the primary key, and if you don't
  supply a value, Prisma generates a random unique ID for you.
- `String?` (question mark) — this column is optional/nullable.
- `@relation(fields: [tenantId], references: [id])` — "this row links to a
  row in another table; the link is stored in the `tenantId` column, which
  points at that other table's `id`."
- `@unique` — no two rows can have the same value in this column.
- `@@index([tenantId])` — tells Postgres to build a fast lookup index on
  that column, since we filter by tenant constantly.
- `@@unique([a, b])` — the *combination* of columns `a` and `b` must be
  unique, even though neither is unique alone (e.g. a student's admission
  number must be unique *within their school*, not globally).

Walking through it top to bottom:

- **`enum Role { SUPER_ADMIN SCHOOL_ADMIN STAFF }`** — an enum is a fixed
  list of allowed values. A user's `role` can only ever be one of these
  three strings.
- **`enum SchoolLevel`**, **`SubscriptionStatus`**, **`AttendanceStatus`**,
  **`ReportCardStatus`**, **`CommunicationChannel`**, **`CommunicationStatus`**
  — same idea, each is a closed list of valid values for one column
  elsewhere in the schema.

- **`model Tenant`** — one row per school. Holds the school's name and
  level (Primary/JHS/SHS), and lists every other table that "belongs" to
  this school (its users, students, subscription, etc.) — those aren't
  columns, they're just Prisma's way of saying "you can also fetch these
  related rows through this tenant."
- **`model Subscription`** — one row per tenant (`@unique` on `tenantId`
  enforces "exactly one subscription per school"). Tracks whether it's
  `ACTIVE`, in a grace period, or locked, plus the expiry date.
- **`model User`** — a login account. `supabaseId` links this row to the
  matching account inside Supabase Auth (Supabase stores the actual
  password; we never do). `tenantId` is nullable because the Super Admin
  doesn't belong to any one school.
- **`model AcademicYear`** / **`model Term`** — a school's calendar. A term
  (e.g. "Term 1") belongs to an academic year and has start/end dates.
- **`model Class`** / **`model Enrollment`** — `Class` is something like
  "JHS 2." `Enrollment` is the join table connecting a `Student` to a
  `Class` (a student can, in principle, have multiple enrollment rows over
  time, e.g. across years).
- **`model Student`** — the actual pupil record. Connects out to guardians,
  enrollments, attendance, grades, a fee account, and report cards.
- **`model Guardian`** / **`model StudentGuardian`** — a parent/guardian's
  contact details, and the join table linking a guardian to one or more
  students (with an optional `relation` like "Mother").
- **`model Attendance`** — one row per student per day.
  `@@unique([studentId, date])` means you can't accidentally create two
  attendance records for the same student on the same day — marking
  attendance again just updates the existing row instead.
- **`model Subject`** / **`model Grade`** — a subject belongs to a school; a
  grade is one student's CA score, exam score, and computed aggregate for
  one subject in one term. `finalized` locks it from further edits once
  true.
- **`model FeeStructure`** — "this term costs this much" (optionally scoped
  to a class). **`model StudentFeeAccount`** — running totals of what one
  student has been charged vs. paid. **`model Payment`** — one payment
  record; `reference` must be globally unique so the same payment can never
  be recorded twice.
- **`model ReportCard`** — one per student per term, holding whether it's
  `WITHHELD` or `RELEASED`, and (after our Supabase Storage change)
  `pdfUrl` — the path to the generated PDF inside Supabase Storage.
- **`model Communication`** — a log entry for every email/SMS ever sent
  (or attempted), so the Communications page has something to show and
  retry.
- **`model AuditLog`** — a paper trail for sensitive manual actions (like a
  fee override), recording who did what, to what, and why.

---

## 6. The backend (`server/`), file by file

### `server/src/index.js` — the entry point

This is the file Node actually runs (`node src/index.js`). Its whole job is
to start things up in the right order and shut down cleanly.

```js
async function main() {
  try {
    await connectDb();
    logger.info('Connected to the database');
  } catch (err) {
    logger.error('Failed to connect to the database', { message: err.message });
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`Akademia API listening on port ${env.PORT}`);
  });
  ...
}
```
It first tries to connect to the database — if that fails, there's no point
starting the web server at all, so it logs the error and exits
(`process.exit(1)`, where `1` means "exited with an error," as opposed to
`0` for success). If the database connects fine, `app.listen(env.PORT, ...)`
starts Express actually listening for incoming HTTP requests on that port
(5000 by default).

The `shutdown` function and the two `process.on('SIGINT'/'SIGTERM', ...)`
lines handle graceful shutdown: when you press Ctrl+C or the process is
asked to stop, it closes the HTTP server and disconnects Prisma cleanly
instead of just dying mid-request.

### `server/src/app.js` — wiring everything together

This file builds the Express `app` object but never actually starts
listening (that's `index.js`'s job) — this separation makes it possible to
test the app without opening a real network port.

```js
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
```
`helmet()` sets a bunch of security-related HTTP headers automatically.
`cors(...)` controls which websites are allowed to call this API from a
browser — here, only our own frontend's URL.

```js
app.use('/api/v1/subscriptions/webhook', express.raw({ type: '*/*' }));
app.use(express.json());
```
Order matters here. Paystack's webhook needs the *raw, unparsed* request
body to verify a cryptographic signature, so that one specific route gets
`express.raw()` registered *before* the general `express.json()` — otherwise
`express.json()` would have already consumed and transformed the body by
the time the webhook handler sees it.

```js
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenants', tenantRoutes);
... (one line per resource) ...

app.use((req, res) => res.status(404).json({ message: 'Not found' }));
app.use(errorMiddleware);
```
`/health` is a trivial endpoint you can hit to check the server is alive.
Each `app.use('/api/v1/X', xRoutes)` mounts a whole router file under that
URL prefix — so everything inside `student.routes.js` automatically lives
under `/api/v1/students/...`. The catch-all 404 handler runs only if none
of the routes above matched. `errorMiddleware` is registered *last* — in
Express, an error-handling middleware (one with 4 arguments: `(err, req,
res, next)`) is only reached when something earlier calls `next(err)` or
throws; putting it last means it catches errors from *any* route above it.

### `server/src/config/env.js` — reading and validating settings

Reading `process.env.SOMETHING` directly, scattered across 20 files, is
fragile — a typo in a variable name would silently give you `undefined`
instead of an error. This file centralizes it:

```js
const schema = z.object({
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SUPABASE_URL: z.string().url('SUPABASE_URL is required'),
  ...
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error(...);
  process.exit(1);
}
export const env = Object.freeze(parsed.data);
```
It describes the *shape* every environment variable should have (a valid
URL, a number, a required non-empty string...) using Zod, then validates
`process.env` against that shape once, at startup. If anything's missing or
wrong, it prints exactly what's wrong and exits immediately — much better
than the app half-starting and failing mysteriously later. Every other file
imports `{ env }` from here instead of touching `process.env` directly, so
`env.SUPABASE_URL` is guaranteed to actually exist and be a valid URL by the
time any other code runs.

### `server/src/config/db.js` — the one Prisma client

```js
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ... });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```
Every file that needs the database imports `prisma` from here — never
creates its own `new PrismaClient()`. The `globalForPrisma` trick exists
because of how `nodemon` (the tool that restarts the server on file changes
during development) works: without it, every restart would create a brand
new database connection pool without closing the old one, eventually
exhausting the database's connection limit. Stashing the client on
`globalThis` in development means it survives hot-reloads.

### `server/src/config/supabase.js` — the Supabase admin client

```js
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
```
This creates one Supabase client using the **service role key** — a secret
key that can do *anything* on your Supabase project (verify any user's
token, create/delete auth users, upload files) with no restrictions. It
must never be sent to the browser. `autoRefreshToken`/`persistSession` are
turned off because those features exist for client-side apps that keep a
single logged-in user's session alive over time — this client is used
fresh, per-request, on the server, so none of that applies.

### `server/src/middleware/auth.middleware.js` — "who is making this request?"

```js
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized();
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) throw ApiError.unauthorized();

  const profile = await prisma.user.findUnique({ where: { supabaseId: data.user.id } });
  if (!profile) throw ApiError.unauthorized();

  req.user = { id: profile.id, supabaseId: profile.supabaseId, tenantId: profile.tenantId, role: profile.role, ... };
  next();
}
```
Every protected route runs this first. The frontend sends
`Authorization: Bearer <token>` on every API call; this reads that header
and splits it into the word `"Bearer"` and the actual token. If that header
is missing or malformed, it throws immediately (401 Unauthorized).
`supabaseAdmin.auth.getUser(token)` asks Supabase "is this token genuinely
one you issued, and if so, who is it for?" — this is the step that actually
proves the token wasn't forged. If Supabase confirms it, we still need
*our own* database's copy of that user (to know their role and which
school/tenant they belong to), so we look them up by `supabaseId`. Finally
it attaches everything the rest of the app will need onto `req.user`, and
calls `next()` to let the request continue to whatever route it was headed
to.

### `server/src/middleware/tenant.middleware.js` — enforcing "your school only"

```js
export function attachTenant(req, res, next) {
  if (!req.user) throw ApiError.unauthorized();
  if (!req.user.tenantId) {
    throw ApiError.forbidden('This account is not associated with a school tenant');
  }
  req.tenantId = req.user.tenantId;
  next();
}
```
This is deliberately tiny and boring — the comment at the top of the real
file calls it "the most security-critical file in the project," and that's
correct. Every query for students, grades, fees, etc. filters by
`req.tenantId`. Because this middleware sets `req.tenantId` from
`req.user.tenantId` — which itself came from *our own database*, populated
during `requireAuth` — a request can never claim to belong to a different
school by, say, passing a different `tenantId` in the URL or request body.
That would be a critical multi-tenancy bug (School A reading School B's
students), and this one small function is what prevents it everywhere.

### `server/src/middleware/role.middleware.js` — "are you allowed to do this?"

```js
export function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }
    next();
  };
}
```
This is a *function that returns a function* — a common pattern called a
"middleware factory." `requireRole('SCHOOL_ADMIN')` is called once, while
defining a route, and it returns a small middleware function pre-configured
to only allow that one role through. `requireRole('STAFF', 'SCHOOL_ADMIN')`
allows either. You'll see this used all over `routes/*.js`, e.g.
`router.post('/', requireRole('SCHOOL_ADMIN'), controller.create)`.

### `server/src/middleware/subscription.middleware.js` — enforcing the paywall

```js
export async function requireActiveSubscription(req, res, next) {
  const subscription = await prisma.subscription.findUnique({ where: { tenantId: req.tenantId } });
  ...
  if (subscription.status === 'ACTIVE' && subscription.expiresAt > now) {
    return next();
  }

  const graceEndsAt = subscription.graceEndsAt ?? new Date(subscription.expiresAt.getTime() + env.SUBSCRIPTION_GRACE_PERIOD_DAYS * 24*60*60*1000);

  if (now <= graceEndsAt) {
    req.subscriptionWarning = { status: 'EXPIRED_IN_GRACE', graceEndsAt };
    ... // update DB status to EXPIRED_IN_GRACE if it wasn't already
    return next();
  }

  ... // update DB status to EXPIRED_LOCKED
  throw new ApiError(402, "Your school's subscription has expired. Please renew to continue.");
}
```
This runs on almost every route that touches actual school data (students,
attendance, fees...). It looks up the school's subscription and does one of
three things: (1) it's active and not expired → let the request through;
(2) it expired, but we're still inside the configurable grace period (`14`
days by default) → let it through anyway, but flag a warning, and
persist that the subscription is now `EXPIRED_IN_GRACE` so it doesn't have
to be recalculated on every single request; (3) the grace period is also
over → mark it `EXPIRED_LOCKED` in the database and reject the request with
HTTP status `402 Payment Required`. Note it's deliberately *not* applied to
the subscription routes themselves (see `subscription.routes.js`) — a
locked-out school still needs to be able to check its own status and pay to
renew.

### `server/src/middleware/validate.js` — checking request data shape

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
      req[key] = result.data;
    }
    next();
  };
}
```
Another middleware factory. You call it like
`validate({ body: createStudentSchema })` when defining a route, and it
returns middleware that runs that Zod schema against the incoming request
body (or query string, or URL params) *before* your controller code ever
sees it. `safeParse` doesn't throw on bad data — it returns
`{ success: false, error }` instead, which lets this code turn it into a
clean 400 error with details about exactly which fields were wrong.
Importantly, `req[key] = result.data` replaces the raw input with Zod's
*parsed* version — so if a schema says a field should be a `number` but the
browser sent it as the string `"20"` (which happens constantly with URL
query strings), the controller receives an actual JavaScript number, not a
string.

### `server/src/middleware/error.middleware.js` — the single place errors become responses

```js
export function errorMiddleware(err, req, res, next) {
  let statusCode = 500;
  let publicMessage = 'Something went wrong. Please try again.';
  ...
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    publicMessage = err.publicMessage;
  } else if (err instanceof ZodError) {
    statusCode = 400; publicMessage = 'Validation failed'; ...
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') { statusCode = 404; ... }      // "record not found"
    else if (err.code === 'P2002') { statusCode = 409; ... } // "unique constraint violated"
  }

  logger.error(err.message, { statusCode, tenantId: req.tenantId, userId: req.user?.id, stack: err.stack });
  res.status(statusCode).json({ message: publicMessage, ...(details ? { details } : {}) });
}
```
Because of `express-async-errors` (imported at the top of `app.js`), any
error thrown *anywhere* inside an `async` route handler — a validation
failure, a `prisma.student.findUnique` that finds nothing, a manually
thrown `ApiError.notFound(...)` — automatically ends up here, instead of
you having to wrap every single controller in a `try/catch`. This function
figures out the right HTTP status code and a safe, generic message for
whatever kind of error it received, logs the *full* internal detail
server-side (so you can debug it), but only sends the *safe* message back
to the browser — you never want to accidentally leak a raw database error
message (which can reveal table/column names) to whoever's using the app.

### `server/src/utils/ApiError.js` — a custom error type

```js
export class ApiError extends Error {
  constructor(statusCode, publicMessage, details) {
    super(publicMessage);
    this.statusCode = statusCode;
    this.publicMessage = publicMessage;
    this.details = details;
  }
  static notFound(message = 'Resource not found') { return new ApiError(404, message); }
  static forbidden(message = 'Forbidden') { return new ApiError(403, message); }
  static badRequest(message = 'Bad request', details) { return new ApiError(400, message, details); }
  static unauthorized(message = 'Not authenticated') { return new ApiError(401, message); }
}
```
`class ApiError extends Error` means "this is a new type of error, built on
top of JavaScript's built-in `Error`, with two extra fields: a numeric
`statusCode` and the `publicMessage` that's safe to show a user." The
`static` methods are convenience shortcuts — instead of writing
`throw new ApiError(404, 'Student not found')` everywhere, controllers just
write `throw ApiError.notFound('Student not found')`.

### `server/src/utils/logger.js` — structured logging

```js
const logger = winston.createLogger({
  level: isProd ? 'info' : 'debug',
  format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), ...),
  transports: [new winston.transports.Console()],
});
```
`winston` is a logging library. Rather than every file calling
`console.log`, this sets up one shared logger that automatically stamps
every log line with a timestamp, and in production prints logs as JSON
(easy for log-collection tools to parse), while in development it prints
colorized, human-readable text instead.

### `server/src/utils/phone.js` — Ghana phone number normalization

```js
export function normalizeGhanaPhone(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const digits = raw.replace(/[^\d+]/g, '');

  if (/^\+233\d{9}$/.test(digits)) return digits;
  if (/^233\d{9}$/.test(digits)) return `+${digits}`;
  if (/^0\d{9}$/.test(digits)) return `+233${digits.slice(1)}`;
  if (/^\d{9}$/.test(digits)) return `+233${digits}`;

  return null;
}
```
SMS providers require phone numbers in one strict format (E.164, e.g.
`+233244123456`), but people type numbers all kinds of ways
(`024 412-3456`, `233244123456`, etc). `raw.replace(/[^\d+]/g, '')` uses a
**regular expression** (a pattern-matching mini-language) meaning "remove
every character that isn't a digit or a `+`," stripping spaces and dashes.
Each `if` line then checks one known shape with another regex and rewrites
it into the `+233...` form. If nothing matches, it returns `null` so the
caller (`sms.service.js`) knows the number was unusable and shouldn't be
sent to. `phone.test.js` (using Node's built-in test runner, `node --test`)
checks all of these cases automatically.

### `server/src/services/*.js` — reusable business logic

Services hold logic that's either reused by multiple controllers, or is
gnarly enough to deserve its own file and its own tests, kept separate from
the HTTP-handling code in controllers.

- **`fee.service.js`** — the single source of truth for "how much does this
  student owe?" `computeBalance(account)` is deliberately a tiny, pure
  function (no database access, just math) — `total charged` minus the sum
  of only the **validated** payments, floored at zero so an overpayment
  never shows as a negative balance. Being pure and separate from the
  database makes it trivial to unit test (see `fee.service.test.js`) without
  needing a real database connection. `recordPayment(...)` wraps the actual
  insert in `prisma.$transaction(...)` — meaning "create the account if
  missing, insert the payment row, and update the running total, all as one
  atomic operation" — if any step failed partway through, none of it would
  be saved, so the numbers can never drift out of sync.
- **`grade.service.js`** — same idea for grades: `computeAggregate` applies
  the fixed 30%/70% CA/exam weighting (returning `null` if either score is
  still missing, since you can't compute a real aggregate yet), and
  `letterGrade` converts a numeric aggregate into a letter band.
- **`audit.service.js`** — `recordAudit(...)` writes one row to the
  `AuditLog` table. Notice it wraps its own database call in `try/catch`
  and only logs a warning on failure instead of throwing — the comment at
  the top explains why: "a failed audit write must never block the primary
  action." E.g. if writing the audit trail for a fee override fails, the
  override itself should still succeed; you don't want a logging bug to
  break real functionality.
- **`communication.service.js`** — `logCommunication(...)` is the one place
  that writes to the `Communication` table, called by both the email and
  SMS services after every attempt (success or failure), so
  `communication.controller.js` has one consistent place to read delivery
  history from.
- **`email.service.js`** / **`sms.service.js`** — each abstracts away *which
  provider* actually sends the message (Resend or raw SMTP for email;
  Arkesel or Hubtel for SMS), selected by an environment variable
  (`EMAIL_PROVIDER`, `SMS_PROVIDER`). Each exposes two friendly, specific
  functions (`sendResultEmail`, `sendFeeReminderEmail` / `sendResultConfirmationSms`,
  `sendFeeReminderSms`) that build the actual message content, and both
  funnel through one shared internal `send(...)` helper that calls the
  provider, then always calls `logCommunication(...)` afterward — logging
  `'SENT'` on success or `'FAILED'` (with the error message) if the
  provider call throws, then re-throwing so the caller still knows it
  failed.
- **`payment.service.js`** — the same provider-abstraction pattern for
  subscription payments (Paystack or Flutterwave).
  `initializeRenewalPayment(...)` builds a unique `reference` string
  (`akademia_<tenantId>_<timestamp>_<random>`) and asks the provider to
  start a checkout session, returning a URL to redirect the school admin
  to. `verifyPayment(reference)` later asks the provider "did this
  reference actually get paid?" `verifyPaystackWebhookSignature` uses
  `crypto.createHmac` to recompute what Paystack's signature *should* be
  from our secret key and the raw request body, then compares it to what
  Paystack actually sent — this is how the webhook route proves an incoming
  "payment succeeded" notification really came from Paystack and wasn't
  forged by anyone who knows our webhook URL.
- **`pdf.service.js`** — `generateReportCardPdf(...)` uses the `pdfkit`
  library to draw an actual PDF document from scratch: it's a `Promise`
  that resolves to a `Buffer` (raw binary PDF data) once drawing is
  finished. Notice the pattern — `doc.on('data', chunk => chunks.push(chunk))`
  collects each piece of the PDF as it's generated, and `doc.on('end', ...)`
  fires once `doc.end()` is called, at which point `Buffer.concat(chunks)`
  glues all those pieces into one complete PDF buffer. Everything from
  `doc.fontSize(...)` down is just manually laying out text and a simple
  table of subjects/scores at fixed x/y coordinates.
- **`storage.service.js`** — the newest file, added when we switched to
  Supabase. `uploadReportCard(...)` builds a storage path like
  `<tenantId>/<studentId>/<termId>.pdf` and uploads the PDF buffer there
  via `supabaseAdmin.storage.from(bucket).upload(...)`, with `upsert: true`
  so re-publishing a report card overwrites the old file instead of
  erroring. `downloadReportCard(path)` does the reverse, returning `null`
  (instead of throwing) if the file isn't there, so the caller can decide
  to regenerate it.
- **`tenant.service.js`** — `createTenantWithAdmin(...)` is the one function
  both "Super Admin creates a school" and "register a brand-new tenant"
  funnel through. It first creates a *real Supabase Auth user* for the new
  school admin (`supabaseAdmin.auth.admin.createUser`), and only then opens
  a Prisma transaction to create the `Tenant`, the `User` row (linked via
  `supabaseId`), and the `Subscription` all together. If that database
  transaction fails for any reason, the `catch` block deletes the
  just-created Supabase Auth user again
  (`supabaseAdmin.auth.admin.deleteUser`) — otherwise you'd end up with an
  orphaned login that has no matching school profile.

### `server/src/controllers/*.js` — the actual request handlers

Every controller function has the same shape: `async function name(req, res) { ... }`.
It reads whatever it needs from `req` (already validated by `validate()`,
already carrying `req.user`/`req.tenantId` from the auth/tenant middleware),
does some Prisma calls, and calls `res.json({...})` or `res.status(...).json({...})`
to send the response. None of them need a `try/catch` for expected failures
— they just `throw ApiError.notFound(...)` etc. and `express-async-errors` +
`errorMiddleware` handle the rest.

- **`auth.controller.js`** — only two endpoints remain here after the
  Supabase migration: `registerTenant` (thin wrapper around
  `tenant.service.js`) and `me`, which simply echoes back
  `req.user` — the profile `auth.middleware.js` already looked up. All the
  actual "type your password" work now happens entirely in the browser via
  Supabase's own SDK; this backend never sees a password.
- **`tenant.controller.js`** — Super Admin's CRUD for schools:
  `create` (delegates to `tenant.service.js`), `list` (every tenant, plus a
  `_count` of students/users via Prisma's `include`), `getById`, `update`,
  and `updateSubscription` (directly edits a `Subscription` row — this is
  how a Super Admin manually extends or locks a school).
- **`student.controller.js`** — `list` builds a dynamic `where` clause: it
  always filters by `tenantId`, and *conditionally* adds a fuzzy
  case-insensitive name/admission-number search (`mode: 'insensitive'`) or a
  class filter, only if those query params were actually provided — the
  `...(condition ? {...} : {})` pattern spreads in extra filter keys only
  when needed. `create` checks for a duplicate admission number first (the
  schema's `@@unique([tenantId, admissionNumber])` would also catch this at
  the database level, but checking first lets us return a friendlier error
  message). `getById` also calls `getStudentBalance` from `fee.service.js`
  and merges the result onto the response so the frontend gets the fee
  balance without a second request. `findTenantStudent` is a small local
  helper reused by `getById`/`update`/`deactivate` to make sure the student
  being touched actually belongs to the caller's own school (defense in
  depth on top of the tenant middleware).
- **`attendance.controller.js`** — `submit` first checks that *every*
  student ID in the incoming batch actually belongs to this tenant
  (`validCount !== studentIds.length` catches any mismatch), then uses
  `prisma.$transaction([...])` with an *array* of upserts (rather than a
  callback function, which is Prisma's other transaction style) to save the
  whole day's roster atomically. `forClass` computes a day's start/end
  boundaries (midnight to 23:59:59.999) to query attendance "on this date"
  regardless of time-of-day. `forStudent` computes a running attendance
  percentage for one student's whole history.
- **`communication.controller.js`** — `list` supports optional
  channel/status filters the same dynamic-`where` way as students. `retry`
  re-sends a previously `FAILED` communication using the `payload` JSON
  that was stored alongside it at the time (this is why `email.service.js`/
  `sms.service.js` always pass a `retryPayload` — it's exactly the data
  needed to reconstruct the message later). Result-release emails can't be
  retried this way because they need the actual PDF, which isn't stored in
  the log — the comment explains you have to re-publish the report card
  instead.
- **`fee.controller.js`** — `createStructure` optionally accepts a
  `classId`; if given, it fetches every student enrolled in that class and
  calls `setFeeStructureCharge` for each of them, effectively "charge this
  fee to a whole class at once." `outstanding` fetches every fee account for
  the tenant, computes each one's balance in JavaScript (reusing
  `computeBalance`), filters to only those still owing money, and sorts
  highest balance first. `override` is the sensitive one — it zeroes a
  student's charge (`setFeeStructureCharge(studentId, 0)`) and, critically,
  calls `recordAudit(...)` right after so there's a permanent record of who
  did it and the `reason` they gave (enforced as required by
  `overrideSchema`'s `.min(5, ...)`).
- **`grade.controller.js`** — `upsertScore` is a shared internal helper
  behind both `submitCa` and `submitExam`: it first checks the grade isn't
  already `finalized` (finalized grades are locked, full stop), merges the
  new score into whatever the *other* score currently is (so submitting just
  a CA score doesn't wipe out an already-submitted exam score), recomputes
  the aggregate via `grade.service.js`, and `upsert`s the row. `finalize`
  uses `updateMany` (rather than `update`, which requires a single unique
  row) because it's locking *every* subject grade for one student/term in
  one call. `classGradeSheet` builds the whole-class view the Grades page
  renders, by walking `Enrollment → Student → Grade → Subject`.
- **`reportcard.controller.js`** — this is the Result-Fee Intercept itself,
  covered in full detail in the [walkthrough below](#the-result-fee-intercept-end-to-end).
- **`subscription.controller.js`** — `status` computes `daysRemaining` for
  the frontend's countdown display. `renewSelfServe` kicks off a payment via
  `payment.service.js`. `activateSubscription` is shared by both ways a
  payment can be confirmed: if the current subscription hasn't actually
  expired yet, it extends *from the existing expiry date* rather than from
  today (so renewing a few days early doesn't lose you those days);
  otherwise it extends a full year from right now. `verifyByReference` is
  the path the frontend calls after Paystack's checkout redirects the user
  back — it works without needing a public webhook URL, which is why it's
  the one used in local development. `webhook` is the production path
  Paystack calls directly and *must* verify the signature before trusting
  anything in the payload, since this endpoint is public and unauthenticated
  by necessity (Paystack's servers aren't logged into our app).

### `server/src/routes/*.js` — declaring the URLs

Each routes file is short and mostly declarative — it's the map from "URL +
HTTP method" to "which middleware runs, then which controller function."
The repeated line at the top of most of them,
```js
router.use(requireAuth, attachTenant, requireActiveSubscription);
```
applies all three middleware to *every* route defined below it in that
file, so you don't have to repeat them on each line. Individual routes then
add `requireRole(...)` only where a specific role restriction is needed
(e.g. only `SCHOOL_ADMIN` can create a fee structure, but any authenticated
staff/admin can view the grade sheet).

Two routers deliberately break that pattern, on purpose:
- **`subscription.routes.js`** — does *not* apply
  `requireActiveSubscription` (a locked-out school still needs to check its
  own status and pay to renew), and defines the `/webhook` route *before*
  `router.use(requireAuth, ...)`, so Paystack's server-to-server call can
  hit it without any user login at all.
- **`tenant.routes.js`** — every route requires `SUPER_ADMIN`, since only
  the platform operator manages schools.

### `server/prisma/seed.js` — filling a fresh database

This script (`npx prisma db seed`) is what creates the demo accounts you
logged in with. `findOrCreateAuthUser(email, password)` first checks
Supabase Auth for an existing user with that email (so re-running the seed
script is safe and won't error on duplicates), otherwise creates one. The
rest of the file is a straightforward sequence of `prisma.X.create(...)`
calls building up one whole demo school: a tenant, its subscription, a
school admin and a teacher, an academic year and term, a class, two
subjects, a fee structure, two students, their fee accounts, and their
guardians — enough interconnected data to click through every page of the
app and see something.

---

## 7. The frontend (`client/`), file by file

### `client/index.html` — the real, single HTML page

```html
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
```
This is the *only* actual HTML file in the whole app. Everything you see —
every "page" — is really JavaScript rewriting the contents of that one
empty `<div id="root">`. `main.jsx` is the script that does that rewriting.

### `client/src/main.jsx` — where the app actually boots

```jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster ... />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```
This finds that empty `<div id="root">` from `index.html` and tells React
"render our whole component tree inside here." Reading from the outside in:
`React.StrictMode` is a development-only wrapper that helps catch common
mistakes (it doesn't affect production). `BrowserRouter` turns on React
Router, so anything inside it can read/change the URL. `AuthProvider` (from
`context/AuthContext.jsx`) wraps *everything*, so any component anywhere can
ask "who's logged in?" `App` is the actual route map. `Toaster` renders
wherever those `toast.success(...)` pop-ups actually appear on screen — it's
a sibling of `App`, not inside it, so a toast can pop up regardless of which
page you're on.

### `client/src/lib/supabaseClient.js` — the browser's Supabase connection

```js
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```
`import.meta.env.VITE_*` is Vite's way of reading `.env` values into
browser code (only variables prefixed `VITE_` are exposed to the browser —
this is a deliberate safety boundary, so you can never accidentally expose a
non-`VITE_` secret to visitors). This uses the **anon key**, not the service
role key — the anon key is safe to expose publicly; it can only do what
your Supabase project's security rules explicitly allow (like "let anyone
attempt to sign in"), unlike the service-role key used on the server, which
bypasses all restrictions.

### `client/src/context/AuthContext.jsx` — "who's logged in," shared everywhere

```jsx
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  ...
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```
This is the standard React Context pattern: `AuthProvider` holds the real
state (`user`, `loading`) and makes it available to every component nested
inside it; `useAuth()` is the hook any component calls to read that shared
state (`const { user, login, logout } = useAuth()`), instead of it being
passed down manually as props through every layer.

```jsx
const loadProfile = useCallback(async () => {
  try {
    const res = await authApi.me();
    setUser(res.data.user);
    return res.data.user;
  } catch {
    setUser(null);
    return null;
  }
}, []);
```
This calls our backend's `/auth/me` (which requires the Supabase token to
already be attached — see `axiosClient.js` next) and stores whatever
profile comes back.

```jsx
useEffect(() => {
  let active = true;
  (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setAccessToken(session.access_token);
      await loadProfile();
    }
    if (active) setLoading(false);
  })();

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    setAccessToken(session?.access_token ?? null);
    if (event === 'SIGNED_OUT') setUser(null);
  });

  return () => { active = false; subscription.unsubscribe(); };
}, [loadProfile]);
```
This runs once when the app first loads (empty-ish dependency array — well,
`[loadProfile]`, but `useCallback` keeps that function stable across
renders so effectively it only re-runs if `loadProfile` itself changes,
which it never does). It asks Supabase "is there already a saved, valid
session?" (Supabase's SDK persists sessions in the browser automatically) —
if so, it grabs the access token and loads the profile, so refreshing the
page keeps you logged in instead of bouncing you to `/login`.
`supabase.auth.onAuthStateChange(...)` subscribes to *future* auth events —
most importantly, Supabase automatically refreshes an about-to-expire token
in the background and fires this callback with the new one, which is how
`setAccessToken` always stays current without any of our own code having to
manage token expiry manually. The `active` flag and `subscription.unsubscribe()`
in the cleanup function prevent a subtle bug: if this component unmounts
before the `getSession()` promise resolves, we don't want to call
`setLoading(false)` on a component that no longer exists.

```jsx
const login = useCallback(async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  setAccessToken(data.session.access_token);
  const profile = await loadProfile();
  if (!profile) {
    await supabase.auth.signOut();
    throw new Error('This account has no Akademia profile. Contact your administrator.');
  }
  return profile;
}, [loadProfile]);
```
`supabase.auth.signInWithPassword` is the actual login call — it talks
*directly* to Supabase, not to our own server at all. If it succeeds, we
immediately store the token and fetch our own backend's profile for that
user. The `if (!profile)` case handles a real edge case: someone could
exist as a valid Supabase Auth user but have no matching row in our own
`User` table (e.g. a Supabase Auth account created outside the app) — in
that case we sign them back out again rather than leaving them in a
half-logged-in state, and throw a clear error explaining why.

`logout` is the mirror image — sign out of Supabase, clear the local token,
clear the user.

### `client/src/api/axiosClient.js` — one shared HTTP client

```js
let _accessToken = null;
export function setAccessToken(token) { _accessToken = token; }
export function getAccessToken() { return _accessToken; }

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
});

axiosClient.interceptors.request.use((config) => {
  if (_accessToken) config.headers.Authorization = `Bearer ${_accessToken}`;
  return config;
});
```
`_accessToken` is a plain variable living in this module's memory (not
React state — it doesn't need to trigger a re-render, and keeping it out of
`localStorage` means it's gone the instant the tab closes, which is a
deliberate security choice against certain attacks). Every `api/*.js` file
imports this same `axiosClient` instance, so this one **request
interceptor** — a function that runs before *every single* outgoing
request — is all it takes to attach the current Supabase access token to
every API call automatically, instead of every individual call needing to
remember to do it.

```js
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      setAccessToken(null);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```
The matching **response interceptor**: if *any* API call ever comes back
401 Unauthorized (meaning the backend rejected the token — expired, revoked,
whatever), this clears the stored token and hard-redirects to `/login`,
rather than every single page needing its own error-handling for "you got
logged out."

### `client/src/api/*.js` — one file per backend resource

`attendance.js`, `auth.js`, `communications.js`, `fees.js`, `grades.js`,
`reportcards.js`, `students.js`, `subscriptions.js`, `tenants.js` all follow
the exact same shape:
```js
import api from './axiosClient';

export const studentsApi = {
  list:   (params)   => api.get('/students', { params }),
  create: (data)      => api.post('/students', data),
  ...
};
```
Each is just a thin, named wrapper around an axios call to one specific
backend URL — `studentsApi.list({ page: 1 })` reads much more clearly at a
call site than a raw `api.get('/students', { params: { page: 1 } })`
repeated in ten different page components. If a backend URL ever changes,
you fix it in exactly one place.

### `client/src/routes/ProtectedRoute.jsx` — gatekeeping pages by role

```jsx
export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <...loading screen...>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleDashboard(user.role)} replace />;
  }
  return <Outlet />;
}
```
This is a component used *inside* the route definitions in `App.jsx`
(`<Route element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN']} />}>`).
While the session is still being restored (see `AuthContext`'s startup
effect), it shows a loading screen rather than briefly flashing the login
page. Once loading is done: no user at all → straight to `/login`. A user
exists but isn't one of the `allowedRoles` for this section (e.g. a teacher
trying to hit a Super Admin URL directly) → redirected to *their own*
correct dashboard instead of an error page. Otherwise, `<Outlet />` is React
Router's way of saying "render whichever child route actually matched" —
that's how one `ProtectedRoute` guards many different pages at once.

### `client/src/App.jsx` — the route map

```jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/" element={<RootRedirect />} />

  <Route element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN']} />}>
    <Route element={<DashboardLayout />}>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/students" element={<Students />} />
      ...
    </Route>
  </Route>
  ...
</Routes>
```
This nests routes three levels deep on purpose: the outer `ProtectedRoute`
enforces "must be logged in as this role," the middle `DashboardLayout`
wraps every matching page in the shared sidebar+header frame, and the
innermost `Route`s are the actual pages. Because of how nesting works with
`<Outlet />`, a URL like `/admin/students` passes through all three layers
before `Students` finally renders inside the layout. `RootRedirect` is a
small helper component that looks at the logged-in user's role and sends
them to the right section when they visit bare `/`.

### `client/src/layouts/DashboardLayout.jsx` — the shared app frame

This renders the dark sidebar (logo, nav links, user chip, sign-out) and
the top header bar that wrap every logged-in page, plus a subscription
warning banner. `getNav(role)` picks which list of nav links to show based
on the logged-in user's role — this is how a teacher's sidebar only shows
"Mark Attendance" / "Grade Entry" while a school admin's shows everything.
`<Outlet />` (again) is where the actual page content — whatever matched in
`App.jsx` — gets rendered, inside `<main>`. `collapsed` and `mobileOpen`
are local UI state controlling the collapsible-sidebar and
mobile-hamburger-menu behavior; neither needs to live in global state
because no other component needs to know about them.

### `client/src/components/ui/*.jsx` — the shared building blocks

- **`Button.jsx`** — one component used for every button in the app so
  they're all visually consistent. `variant` picks a CSS class
  (`btn-primary`, `btn-danger`, etc., defined in `index.css`).
  `loading` shows a spinning icon and disables the button. The
  `ripples`/`handleClick` state implements the little expanding-circle
  animation you see on click: on each click it records the click's
  x/y position (relative to the button) as a new "ripple," renders a `span`
  there, and removes it again after 700ms with `setTimeout` — a small,
  self-contained piece of state that doesn't need to live anywhere else.
- **`Input.jsx`** — a labeled text input with a built-in error message
  slot and a `focused` state (used to highlight the label while the field
  has focus).
- **`Modal.jsx`** — a reusable popup dialog. It renders `null` (nothing at
  all) when `isOpen` is false. The `useEffect` adds a `keydown` listener
  only while open, so pressing Escape closes it, and temporarily sets
  `document.body.style.overflow = 'hidden'` so the page behind the modal
  can't be scrolled — both are cleaned up (listener removed, scroll
  restored) in the effect's return function once the modal closes or
  unmounts.
- **`DataTable.jsx`** — a generic table: you pass it `columns`
  (`{ key, label, render? }`) and `data`, and it handles the loading
  skeleton, the "no records" empty state, and pagination controls, so no
  individual page has to rebuild a table from scratch. `column.render`
  is an optional function letting a page customize how one column's cell
  looks (e.g. rendering a `StatusBadge` instead of raw text) without
  `DataTable` needing to know anything about badges.
- **`StatCard.jsx`** — the little colored stat tiles you see on
  dashboards. `useCountUp` is a small custom hook that animates a number
  counting up from 0 to its target value using
  `requestAnimationFrame` (a browser API for smooth, efficient animation
  loops) with an ease-out curve, purely a visual flourish.
- **`StatusBadge.jsx`** — `STATUS_MAP` is a lookup object mapping every
  possible status string (`ACTIVE`, `WITHHELD`, `SUPER_ADMIN`, ...) to a
  CSS class and label; the component just looks up whichever status it was
  given and renders the matching pill — one component instead of
  reimplementing this per status type.
- **`Logo.jsx`** — a hand-drawn SVG (no image file, no icon library) —
  a gradient rounded square with a graduation-cap shape and tassel drawn
  using basic SVG shapes (`<polygon>`, `<path>`, `<line>`, `<circle>`).
  `useId()` generates a unique id for the gradient definition so multiple
  `<Logo />` instances on the same page never conflict.

### `client/src/pages/*` — the actual screens

Every page follows the same rhythm, so rather than repeat the same
explanation dozens of times, here's the pattern once, followed by what's
*specific* to each page:

**The common pattern:** a page component holds its own `useState` for
whatever data it displays (`students`, `loading`, form fields...), fetches
data inside a `useEffect` that runs on mount (`useEffect(() => { fetchX();
}, [])`), shows a loading skeleton via `<DataTable loading={...} />` or a
manual `.skeleton` div while waiting, and every user action (submitting a
form, clicking a button) is an `async` handler that sets a `saving`/`loading`
flag, calls the relevant `xApi.something(...)` function, shows a
`toast.success(...)` or `toast.error(...)` based on the result, and resets
the flag in a `finally` block.

- **`Auth/Login.jsx`** — the split-screen login covered earlier in this
  conversation. `DEMO_ACCOUNTS` buttons just fill in the email/password
  fields for you; `handleSubmit` calls `login(...)` from `AuthContext` and
  redirects to the right dashboard for whatever role comes back.
- **`SchoolAdmin/AdminDashboard.jsx`** — fetches student count, outstanding
  fees, and subscription status all at once with
  `Promise.allSettled([...])` (unlike `Promise.all`, this waits for *every*
  promise and tells you which succeeded/failed individually, instead of the
  whole thing rejecting the moment any one call fails — appropriate here
  since one failed stat shouldn't blank out the other two).
- **`SchoolAdmin/Students.jsx`** — the debounced search
  (`useEffect(() => { const t = setTimeout(...); return () => clearTimeout(t); }, [search])`)
  is a common pattern: instead of firing an API call on *every* keystroke,
  it waits 400ms after you stop typing before actually searching, and
  cancels the pending timer if you type again before it fires.
- **`SchoolAdmin/Attendance.jsx`** (admin, read-only view) vs.
  **`Staff/Attendance.jsx`** (the actual marking screen, with the
  P/A/T keyboard shortcuts wired up via a `window.addEventListener('keydown', ...)`
  effect) — two different pages for two different roles looking at largely
  the same underlying data.
- **`SchoolAdmin/Fees.jsx`** — one page with four tabs
  (`Outstanding`/`Record Payment`/`Fee Structures`/`Override`), each
  implemented as its own small sub-component defined further down the same
  file (`OutstandingTab`, `RecordPaymentTab`, etc.) and swapped in based on
  the `tab` state.
- **`SchoolAdmin/Grades.jsx`** (admin's read-only grade sheet + finalize) vs.
  **`Staff/GradeEntry.jsx`** (the actual entry screen teachers use).
- **`SchoolAdmin/PublishResults.jsx`** — the frontend half of the
  Result-Fee Intercept, covered in the walkthrough below. The confetti
  animation (`triggerConfetti`) is pure decoration: it fills a `confetti`
  state array with random little colored squares/circles, renders them with
  the `.confetti-burst` CSS animation (defined in `index.css`), and clears
  the array again after 900ms.
- **`SchoolAdmin/Subscription.jsx`** — shows the school's current
  status/countdown, and has two forms: one starts a new Paystack checkout
  (`handleRenew`, which opens the returned `checkoutUrl` in a new tab), the
  other lets the admin manually paste a payment reference to confirm it
  (`handleVerify`) — this manual path is what makes local development
  possible without a public webhook URL reachable by Paystack.
- **`SchoolAdmin/Communications.jsx`** — a filtered, paginated log built
  entirely on top of the shared `DataTable`, with a `Retry` button on any
  row whose `status` column is `FAILED`.
- **`Staff/StaffDashboard.jsx`** — the simplest page in the app: two big
  static action cards, no data fetching at all.
- **`SuperAdmin/TenantsDashboard.jsx`** / **`SuperAdmin/TenantDetail.jsx`**
  — the Super Admin's list-of-schools and one-school-detail screens; the
  detail page's subscription form is a direct, no-payment-required manual
  override (`tenantsApi.updateSubscription`) — the Super Admin can just
  set any school's status/expiry directly, unlike a school admin who has to
  go through Paystack.

---

## 8. Two full walkthroughs, traced end to end

### Logging in, from click to dashboard

1. You type an email/password on `Login.jsx` and click **Sign In**.
   `handleSubmit` calls `login(email, password)` from `AuthContext`.
2. `AuthContext.login` calls `supabase.auth.signInWithPassword(...)` —
   this goes **directly from your browser to Supabase's servers**, not
   through our Express backend at all. Supabase checks the password (which
   it stores, hashed — our own database never sees it) and, if correct,
   returns a session containing a signed JWT access token.
3. `setAccessToken(data.session.access_token)` stores that token in
   `axiosClient.js`'s in-memory variable, so every future API call will
   automatically carry it in the `Authorization` header.
4. Still inside `login`, `loadProfile()` calls `authApi.me()`, which hits
   our backend's `GET /api/v1/auth/me` — *this* request does go through
   Express.
5. On the backend, `requireAuth` middleware reads that `Authorization`
   header, calls `supabaseAdmin.auth.getUser(token)` to confirm with
   Supabase that the token is genuine, then looks up the matching row in
   *our own* `User` table by `supabaseId` and attaches it as `req.user`.
6. `auth.controller.js`'s `me` handler just replies with `req.user` — your
   role, tenant, name, email.
7. Back on the frontend, that profile is stored via `setUser(...)`, which
   causes `AuthContext` to re-render everything depending on it.
8. `Login.jsx`'s `useEffect` (`if (user) navigate(getRoleDashboard(user.role))`)
   fires and sends you to `/admin`, `/staff`, or `/super-admin` depending on
   your role.
9. `ProtectedRoute` allows the navigation through (there's now a `user`,
   and their role matches), `DashboardLayout` renders the sidebar/header for
   that role, and the matched page component (e.g. `AdminDashboard`)
   mounts and fetches whatever data it needs.

### The Result-Fee Intercept, end to end

This is the app's core rule, so it's worth tracing completely.

1. On `PublishResults.jsx`, the school admin loads students for a term
   (`loadStudents`) — this fetches each student's current fee balance
   (`feesApi.getStudentAccount`) and any existing report card status
   (`reportcardsApi.get`) in parallel, and clicks **Publish** for one
   student, calling `reportcardsApi.publish(studentId, termId)`.
2. That's `POST /api/v1/report-cards/publish/:studentId/:termId` on the
   backend, guarded by `requireAuth`, `attachTenant`,
   `requireActiveSubscription`, and `requireRole('SCHOOL_ADMIN')` in
   `reportcard.routes.js`.
3. `reportcard.controller.js`'s `publish` function loads the student and
   term (scoped to the caller's own tenant, via `loadStudentAndTerm`), then
   calls `getStudentBalance(studentId)` from `fee.service.js` — the single
   authoritative balance calculation used everywhere in the app.
4. **If `balance === 0`:** it fetches all of that student's finalized
     grades and attendance, calls `generateReportCardPdf(...)` from
     `pdf.service.js` to draw the actual PDF in memory, uploads it to
     Supabase Storage via `uploadReportCard(...)`, and `upsert`s a
     `ReportCard` row with `status: 'RELEASED'` and the storage path saved
     as `pdfUrl`. Then `notifyRelease(...)` fires off an email (with the PDF
     attached) to the student and/or guardian, and an SMS to the guardian —
     using `Promise.allSettled` so a failed SMS doesn't stop the email from
     being attempted, and vice versa.
5. **If `balance > 0`:** no PDF is generated at all. A `ReportCard` row is
   saved with `status: 'WITHHELD'`, and `notifyWithheld(...)` sends a
   payment-reminder email/SMS instead, quoting the exact outstanding
   balance.
6. Either way, the response includes the new `status` and `balance`, and
   the frontend shows a modal (celebratory confetti for a release, a shake
   animation for a withhold) reflecting exactly what happened.
7. Later, if someone requests the PDF (`GET /report-cards/:studentId/:termId/pdf`),
   `downloadPdf` first checks the report card is actually `RELEASED` (you
   can never download a withheld report card, even by guessing the URL),
   then tries to fetch the already-generated PDF straight from Supabase
   Storage — only regenerating it from scratch (and re-uploading it) if,
   for some reason, the stored file is missing.

The rule is enforced in exactly one place in the whole codebase — the
`publish` function's `balance === 0` check — which is why it can never be
accidentally bypassed by some other screen or code path.

---

## 9. Where your secrets live, and how to run everything

- `server/.env` — never committed to git (`.gitignore` excludes it). Holds
  `DATABASE_URL`/`DIRECT_URL` (your Supabase Postgres connection, via the
  pooler), `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`,
  and provider keys for email/SMS/payments if you configure those later.
- `client/.env` — also gitignored. Only holds the two `VITE_`-prefixed
  Supabase values, since anything in here is visible to anyone using the
  deployed site (browser code is always inspectable).
- `.env.example` files (committed to git, safe — they contain no real
  secrets, just placeholders) exist in both folders so anyone setting the
  project up fresh knows exactly which variables to fill in.

To run it locally, two terminals:
```
cd server && npm run dev     # starts the API on :5000
cd client && npm run dev     # starts the React app on :5173, opens in your browser
```
