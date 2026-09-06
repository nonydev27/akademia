# Akademia — Setup & Manual TODO

This file contains every manual step required to get Akademia running locally
and in production. Follow sections in order.

---

## Prerequisites

| Requirement | Minimum Version | Download |
|---|---|---|
| Node.js | 18.x LTS | https://nodejs.org |
| npm | 9.x (bundled with Node) | — |
| Git | any | https://git-scm.com |
| PostgreSQL account | — | Supabase (free) — see below |

---

## 1. Free-tier Services Setup

### 1a. Supabase (PostgreSQL — free tier)
1. Go to https://supabase.com and sign up (free).
2. Click **New Project** — choose a name like `akademia`, set a strong DB password.
3. Wait for the project to provision (~1 min).
4. Go to **Project Settings → Database → Connection String → URI**.
5. Copy the URI (looks like `postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres`).
6. Replace `PASSWORD` with your actual DB password.
7. This is your `DATABASE_URL`.

> **Free tier limits:** 500 MB storage, 2 CPU shared. Sufficient for development and small schools.

### 1b. Resend (Email — free tier)
1. Go to https://resend.com and sign up (free).
2. Verify your email address.
3. Go to **API Keys → Create API Key** — name it `akademia`.
4. Copy the key (starts with `re_...`). This is `RESEND_API_KEY`.
5. **Optional:** Add and verify your own domain under **Domains** for production.
   Without a verified domain, emails send from `onboarding@resend.dev` (fine for testing).

> **Free tier:** 3,000 emails/month, 100/day.

### 1c. Arkesel (SMS — Ghana — free test credits)
1. Go to https://arkesel.com and sign up.
2. Go to **API Keys** in your dashboard.
3. Copy your API key. This is `ARKESEL_API_KEY`.
4. Set `SMS_SENDER_ID` to your registered sender name (e.g. `Akademia`).
5. Sender IDs must be registered with Arkesel before use in production.

> **Alternative:** Hubtel (https://hubtel.com) — set `SMS_PROVIDER=hubtel` and provide `HUBTEL_CLIENT_ID` + `HUBTEL_CLIENT_SECRET`.

### 1d. Paystack (Payments — test mode free)
1. Go to https://paystack.com and sign up.
2. Go to **Settings → API Keys & Webhooks**.
3. Copy the **Test Secret Key** (starts with `sk_test_...`). This is `PAYSTACK_SECRET_KEY`.
4. Use test mode for development — no real money moves.
5. For production: complete Paystack KYC verification and use the Live Secret Key.

> **Webhook (optional for local dev):** The app supports polling-based payment verification
> (`GET /subscriptions/verify?reference=...`) so webhooks are not required for local testing.

---

## 2. Server Setup

```bash
cd server
```

### 2a. Copy and fill the environment file

```bash
cp .env.example .env
```

Open `.env` in a text editor and fill in every variable:

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `CLIENT_URL` | Client origin for CORS | `http://localhost:5173` |
| `DATABASE_URL` | Supabase PostgreSQL URI | `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres` |
| `JWT_SECRET` | Random 32+ char string | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Access token lifetime | `15m` |
| `REFRESH_TOKEN_SECRET` | Another random 32+ char string | *(generate same way)* |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token lifetime | `30d` |
| `EMAIL_PROVIDER` | `resend` or `smtp` | `resend` |
| `RESEND_API_KEY` | Your Resend key | `re_xxxx` |
| `EMAIL_FROM` | Sender name+address | `Akademia <no-reply@yourdomain.com>` |
| `SMS_PROVIDER` | `arkesel` or `hubtel` | `arkesel` |
| `ARKESEL_API_KEY` | Your Arkesel key | `xxxx` |
| `SMS_SENDER_ID` | Registered sender ID | `Akademia` |
| `PAYMENT_PROVIDER` | `paystack` or `flutterwave` | `paystack` |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | `sk_test_xxxx` |
| `SUBSCRIPTION_GRACE_PERIOD_DAYS` | Grace period (7–14) | `14` |
| `SEED_SUPER_ADMIN_EMAIL` | Super admin login email | `superadmin@akademia.app` |
| `SEED_SUPER_ADMIN_PASSWORD` | Super admin password | `ChangeMe123!` (change this!) |

### 2b. Install dependencies

```bash
npm install
```

### 2c. Run database migrations

```bash
npx prisma migrate dev --name init
```

This creates all tables in your Supabase database.

> If you see a connection error, double-check your `DATABASE_URL` in `.env`.

### 2d. Generate Prisma client

```bash
npx prisma generate
```

### 2e. Seed the database

```bash
npm run prisma:seed
```

This creates:
- Super Admin account: `superadmin@akademia.app` / `ChangeMe123!`
- Demo School with admin: `admin@demoschool.app` / `Admin123!`
- Demo Teacher: `teacher@demoschool.app` / `Staff123!`
- Academic year, term, class, subjects, students, fee structures

**⚠️ Change the Super Admin password immediately after first login!**

### 2f. Start the server

```bash
npm run dev
```

Server starts on http://localhost:5000.
Health check: http://localhost:5000/health

---

## 3. Client Setup

```bash
cd client
```

### 3a. Copy environment file

```bash
cp .env.example .env
```

The default `VITE_API_URL=http://localhost:5000/api/v1` works out of the box.

### 3b. Install dependencies

```bash
npm install
```

### 3c. Start the client

```bash
npm run dev
```

Client starts on http://localhost:5173.

---

## 4. First Login

Open http://localhost:5173 in your browser.

Use the demo quick-fill buttons on the login screen, or type credentials manually:

| Role | Email | Password |
|---|---|---|
| Super Admin | `superadmin@akademia.app` | `ChangeMe123!` |
| School Admin | `admin@demoschool.app` | `Admin123!` |
| Teacher/Staff | `teacher@demoschool.app` | `Staff123!` |

---

## 5. Finding IDs for Grade/Attendance Entry

The seed creates objects with UUIDs. To find them for use in the UI:

```bash
cd server
npx prisma studio
```

Prisma Studio opens at http://localhost:5555. Browse the `Class`, `Term`, `Subject` tables to copy IDs.

Alternatively, use the API directly:
- `GET /api/v1/students` — lists students and their class enrollments (includes `classId`)

---

## 6. Running Tests

```bash
cd server
npm test
```

Tests cover the fee balance service and grade aggregation service.

---

## 7. Tauri Desktop Packaging (Windows .exe)

> Do this after the web UI is stable and you have a working production API.

Prerequisites: Install Rust (https://rustup.rs) and the Visual Studio C++ build tools.

```bash
cd client

# Install Tauri CLI
npm install -D @tauri-apps/cli

# Initialize Tauri (first time only)
npx tauri init
```

When prompted:
- App name: `Akademia`
- Window title: `Akademia — School Management`
- Dist dir: `../dist`
- Dev server URL: `http://localhost:5173`

```bash
# Development desktop window
npx tauri dev

# Production build (.exe installer)
npx tauri build
```

Output: `src-tauri/target/release/bundle/msi/Akademia_*.msi`

**⚠️ Security note:** Do NOT embed the production `PAYSTACK_SECRET_KEY` or any server secrets in the desktop app. 
The Tauri app only talks to your deployed API server. Keep secrets server-side only.

---

## 8. Production Deployment Checklist

- [ ] Set `NODE_ENV=production` on the server
- [ ] Use a strong `JWT_SECRET` and `REFRESH_TOKEN_SECRET` (32+ random bytes each)
- [ ] Set `CLIENT_URL` to your actual client domain
- [ ] Enable Supabase connection pooling for production traffic
- [ ] Configure `EMAIL_FROM` with a verified domain in Resend
- [ ] Register `SMS_SENDER_ID` with Arkesel for production
- [ ] Switch Paystack to Live keys (`sk_live_...`)
- [ ] Set up Paystack webhook pointing to `https://yourdomain.com/api/v1/subscriptions/webhook`
- [ ] Add HTTPS (Nginx + Let's Encrypt, or Render/Railway built-in)
- [ ] Change all seed passwords
- [ ] Enable Supabase Row Level Security (optional — the app enforces tenant isolation at API level)
- [ ] Set up database backups in Supabase dashboard

---

## 9. Troubleshooting

**`DATABASE_URL` connection error**
- Make sure you're using the correct Supabase connection string.
- Add `?pgbouncer=true&connection_limit=1` to the URI when using Supabase's connection pooler.

**Prisma migration fails**
- Run `npx prisma db push` instead of `migrate dev` for prototyping (no migration files generated).

**CORS errors in browser**
- Confirm `CLIENT_URL` in server `.env` matches exactly what the browser shows (including protocol).

**Emails not sending**
- Check `RESEND_API_KEY` is correct.
- Verify the `EMAIL_FROM` domain is verified in Resend, or use `onboarding@resend.dev` for testing.

**SMS not sending**
- Arkesel requires a registered sender ID for Ghanaian numbers.
- Test with a known valid Ghana phone number in international format: `+233XXXXXXXXX`.

**Paystack payment not verifying**
- Use test card: `4084 0840 8408 4081`, Expiry any future date, CVV `408`.
- Copy the exact reference from the Paystack checkout URL callback.

---

## 10. Environment Variables Quick Reference

```
# Server (.env)
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://...
JWT_SECRET=<32+ random hex chars>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<32+ random hex chars>
REFRESH_TOKEN_EXPIRES_IN=30d
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
EMAIL_FROM=Akademia <no-reply@yourdomain.com>
SMS_PROVIDER=arkesel
ARKESEL_API_KEY=...
SMS_SENDER_ID=Akademia
PAYMENT_PROVIDER=paystack
PAYSTACK_SECRET_KEY=sk_test_...
SUBSCRIPTION_GRACE_PERIOD_DAYS=14
SEED_SUPER_ADMIN_EMAIL=superadmin@akademia.app
SEED_SUPER_ADMIN_PASSWORD=ChangeMe123!

# Client (.env)
VITE_API_URL=http://localhost:5000/api/v1
```

---

*Last updated: September 2026 · Akademia v1.0*
