# Akademia — How the System Works

A plain-English tour of the whole platform, from the platform owner down to
the teacher in the classroom.

If you are new to this project — a developer, a school, or someone evaluating
it — read this first. It explains **who uses the system, what each of them
sees, and why the system behaves the way it does**. For the technical stack
and data model, see [ABOUT.md](ABOUT.md). For setup, see [TODO.md](TODO.md).

---

## 1. What Akademia is

Akademia is a **school management system for Ghanaian schools** — Primary,
JHS, and SHS. It replaces the exercise books, the fee ledgers, and the
handwritten report cards with one system that a school runs day to day.

It is delivered as a **Windows desktop application**. There is no website to
log into and no address to remember: an administrator installs Akademia once,
and it behaves like any other program on the machine. It looks and feels like
a desktop app while talking to a central server in the background.

The important consequence of that design:

> **One installation serves many schools at once.**
> Each school's data is completely sealed off from every other school's.

This is called *multi-tenancy*, and it is the single most important concept in
the system. A school is a **tenant**. Everything in Akademia — every student,
every grade, every cedi — belongs to exactly one tenant, and no one outside it
can ever see it.

---

## 2. The three kinds of user

There are exactly three roles. Each one sees a different application, because
each one has a completely different job.

| Role | Who they are | What they can reach |
|---|---|---|
| **Super Admin** | You — the platform owner | Every school on the platform |
| **School Admin** | The head teacher / administrator of one school | Only their own school |
| **Staff** | The teachers of one school | Only the classes and subjects they teach |

The system does not show a Super Admin the buttons a teacher uses, or a
teacher the buttons a Super Admin uses. When you log in, you are routed
straight to the workspace your role is meant for, and the server independently
refuses any request your role is not entitled to make. The interface hides
things; **the server enforces them**. Those are two separate locks, and the
second one is the one that matters.

---

## 3. Super Admin — running the platform

This is your view. You are not inside any school; you are above all of them.

### What you do here

**Create a school.** You set its name, its short code (for example `VIS` for
Vilaworld International School), and its level — Primary, JHS, or SHS. That
code is not decoration: it becomes the prefix of every student number the
school will ever issue, so the first student enrolled at Vilaworld becomes
`VIS-001`, the next `VIS-002`, and so on.

**Choose a plan.** Each school is placed on a subscription plan, and the plan
decides which parts of the system that school can use:

| Plan | Price (GHS) | What the school gets |
|---|---|---|
| **Basic** | 2,800 | Student records and grading |
| **Standard** | 4,800 | Basic, plus fees, email, and AI-assisted import |
| **Premium** | 8,200 | Everything — attendance, terms, subjects, and AI import |

A Basic school simply does not get the fees screen. This is not a hidden
button; if that school's staff tried to reach the fee endpoints directly, the
server would refuse. You can also hand-tune a school's features individually
if a particular school needs a custom arrangement.

**Watch the subscription clock.** Every school has an expiry date. As it
approaches and passes, the system degrades that school gracefully rather than
cutting it off:

1. **Active** — everything works normally.
2. **Expired, in grace** — the school can still read its data but cannot add
   to it. A head teacher can still look up a student or print a record while
   they sort out payment.
3. **Expired and locked** — the school is shut out. Requests are rejected with
   a "payment required" response until the subscription is renewed.

The idea is that an expired school is nudged, not ambushed: they keep enough
access to realise they need to pay, and enough time to do it.

**Manage payment.** Renewals come through Paystack. When a school pays, the
platform is notified, the subscription is extended, and the school returns to
normal without you touching anything.

**See what happened.** Nearly every meaningful action in the system is
recorded — who did it, what they did, to whom, and when. This is your audit
trail across every school.

### What you deliberately cannot do

You manage schools and licensing. You are not in the business of editing a
school's students or grades. Cross-school privacy is the promise the whole
platform rests on, and your role is scoped to administration, not
surveillance of individual pupils' records.

---

## 4. School Admin — running a school

This is the head teacher's workspace. Everything here is **inside one school
and invisible to every other school**.

### Setting up the school

Before a school can run, its admin lays the foundation:

- **Academic years and terms.** The school year is divided into terms
  (Term 1, Term 2, Term 3). One term is the active term at any time.
- **Classes.** Named groups like `JHS2-A`.
- **Subjects.** Named courses with a short code, like `GLP2`.
- **Staff accounts.** Each teacher gets their own login.
- **Grade bands.** What score earns an `A`, what earns a `B`, and the remark
  printed beside it. Sensible defaults exist, but each school can set its own —
  because schools genuinely disagree on where a `B` starts.

### Enrolling students

A student record holds far more than a name: date of birth, gender,
nationality, religion, address, contact details, previous school, NHIS number,
and even their sports and clubs. This is deliberate — a school's records are
consulted years later for references and transfers, and a system that only
stores names is a system a school abandons in favour of paper.

Students are linked to **guardians** — parents and contacts — and a student
can have several. Guardians are who the system writes to.

There is also an **AI-assisted importer**: an admin can hand the system an
existing student list — a PDF, a spreadsheet, a photo of a register — and it
will read the document and propose structured student records. The admin
reviews the proposal and corrects anything before saving. This matters
enormously in practice: no school is willing to retype four hundred students.

### Assigning teachers

A teacher is not automatically entitled to grade anything. The admin creates
an explicit **assignment**: *this teacher, this subject, this class*. That
assignment gets a human-readable access code like
`T-AO-ENGLP2-JHS2A`, which is how the teacher and the admin refer to it —
never a meaningless internal ID.

This assignment is the backbone of grade security. It is what stops one
teacher from entering marks for another teacher's class.

### Managing fees

Each term, the school defines what it charges — **fee structures**. Each
student then has a **fee account** that tracks two numbers: what they have
been charged, and what they have paid. The difference is their balance, and
that single number drives one of the system's most distinctive behaviours
(below).

Payments are recorded and verified against Paystack.

### Communications

The admin sends messages to guardians — fee reminders, announcements, and
result notifications — by email and SMS. Every dispatch is logged, including
failures, so a school can prove what was sent and when.

### Report cards — approving results

Teachers enter marks. **Admins approve them.** A report card moves through a
lifecycle that mirrors how a real school works:

1. **Draft** — being prepared.
2. **Submitted** — the teacher has finished; awaiting the admin.
3. **Approved** — the admin has reviewed it.
4. **Released**, or **Withheld** — see the next section. This is where the
   system's most important rule lives.

---

## 5. The Result-Fee Intercept

This is the feature that makes Akademia more than a filing cabinet, so it is
worth understanding properly.

When an admin approves a student's report card, the system **stops and checks
that student's fee balance before releasing anything.**

- **If the balance is zero** — the report card is generated as a PDF, marked
  `RELEASED`, and sent to the guardian by email, with an SMS confirmation.
  The school has been paid, so the parent gets the results.

- **If money is still owed** — the report card is marked `WITHHELD`. It is
  *not* sent. Instead, the guardian receives a fee reminder showing the exact
  outstanding amount and the reason the card is being held.

A withheld report card cannot be downloaded by anyone. If someone
authenticated tries to fetch it directly, the server refuses — the card is
genuinely not available, not merely hidden behind a broken link.

Paying the balance does not silently release the card; the school retains
control. What the system guarantees is that **fees and results can never drift
apart**. In a paper school, held-back results are a promise a bursar makes and
sometimes forgets. Here it is enforced by the software, uniformly, for every
student.

> **Why this matters:** this is the moment where Akademia earns its place.
> A school's biggest administrative headache is reconciling "has this parent
> paid?" against "have we given them the results?" The system makes those two
> questions the same question.

---

## 6. Staff — the classroom

This is the teacher's workspace, and it is intentionally small. A teacher logs
in and sees only what they teach.

### Attendance

The teacher marks students present or absent for the day. Attendance is stored
against a specific date, and a student cannot be marked twice for the same day
and subject.

### Grade entry

For each assigned class and subject, the teacher enters two scores per student:

| Component | What it is | Weight |
|---|---|---|
| **Continuous Assessment** (`caScore`) | Class tests, quizzes, homework | **30%** |
| **Exam** (`examScore`) | End-of-term examination | **70%** |

The aggregate is calculated for the teacher, not by them:

```
Aggregate = (CA × 0.30) + (Exam × 0.70)
```

That aggregate is then matched against the school's grade bands to produce a
letter (`A`–`F`) and a remark. **Both scores are required** — if either is
missing, the system refuses to produce an aggregate at all, so an
half-finished student can never accidentally be published with a misleading
total.

Once the teacher is satisfied, they **finalise** the record. A finalised grade
is locked against casual editing, which is what makes the marks defensible if
a parent later queries them.

When grades are done, the teacher **submits** — handing the results to the
school admin for approval. From that point the teacher's job is finished and
the intercept logic above takes over.

### Teacher privacy

A teacher's window is narrow by design. They can reach their own assigned
classes and subjects, and cannot browse other teachers' marks, other classes'
students, or the school's fee records. A teacher should not be able to see
which of their pupils' parents are behind on payment — that is the school's
business, not the staffroom's.

---

## 7. How the pieces fit together

Follow one term from start to finish:

```
  SUPER ADMIN
      │  creates the school, picks a plan, keeps it licensed
      ▼
  SCHOOL ADMIN
      │  sets up the term, classes, subjects, staff and fee structures
      │  enrols students (or imports them with AI assistance)
      │  assigns each teacher to a class + subject
      ▼
  STAFF  ── marks attendance
      └── enters CA + Exam marks → aggregate → finalise → SUBMIT
      ▼
  SCHOOL ADMIN
      │  reviews and APPROVES the report card
      ▼
  ┌─── THE INTERCEPT ────────────────────────────────┐
  │  Is the student's fee balance zero?              │
  │    YES → PDF generated → RELEASED → guardian     │
  │           notified by email + SMS                │
  │    NO  → WITHHELD → guardian sent fee reminder   │
  │           showing the outstanding amount         │
  └──────────────────┘
      ▼
  Everyone can see what happened in the audit log.
```

---

## 8. The rules that hold it together

Four principles explain most of the system's behaviour:

**Tenant isolation.** Every query is scoped to one school. There is no screen
in the product that can display two schools' data side by side, because no
query is capable of retrieving it. This is the promise the platform is built
on.

**Licensing is enforced, not suggested.** A school on a lapsed subscription
loses access at the server, not at the interface. A plan's features are
checked before the request is served.

**Roles are enforced twice.** The interface shows you only your own workspace,
and the server independently verifies every request. A user who somehow
reached a forbidden screen would still be refused by the server.

**Actions leave a trace.** Approvals, withholdings, releases, and significant
changes are recorded with an actor and a reason, giving schools a history they
can stand behind.

---

## 9. What a new developer should know first

- **The desktop app is a shell.** The UI is bundled inside the installed
  `.exe`, so React changes only reach users through a new release. **Server
  changes reach everyone instantly** on redeploy. When you are deciding where
  to fix something, this difference is usually the deciding factor.
- **`tenantId` is everywhere.** If you write a query that is not scoped to a
  tenant, you have almost certainly written a bug.
- **Fees and grades are not separate features.** The intercept is the product.
  Treat the boundary between them with care.
- **Attendance, terms, subjects, fees and AI import are plan-gated.** Before
  assuming a route is reachable, check the school's plan.
- **Grade weights live in one place.** `server/src/services/grade.service.js`
  is the single source of truth for the 30/70 split.

### A note on the current state

Two details are worth flagging to anyone reading the code today:

- The `Grade` model stores `caScore`, `midtermScore`, **and** `examScore`, but
  only **CA and Exam** are used in the aggregate. `midtermScore` is currently
  collected but not counted.
- [ABOUT.md](ABOUT.md) states the formula as
  30% CA / 20% mid-term / 50% exam. That does not match the implementation,
  which is 30% CA / 70% exam. **This document reflects the code as written**;
  ABOUT.md needs correcting.

---

## 10. Related documents

| Document | What it covers |
|---|---|
| [ABOUT.md](ABOUT.md) | Technical stack, full data model, project layout |
| [TUTOR.md](TUTOR.md) | Walkthrough / onboarding guide |
| [TAURI.md](TAURI.md) | Desktop packaging, the auto-updater, and how to ship a release |
| [TODO.md](TODO.md) | Setup and deployment checklist |
| [SWOT.md](SWOT.md) | Project strengths, weaknesses, opportunities, threats |

---

*Akademia v1.0 — a multi-tenant school management platform for Primary, JHS and SHS schools.*
