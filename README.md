# Akademia — School Management System

Multi-tenant school management platform (Primary / JHS / SHS) with attendance,
fees, grading, automated result-fee intercept, communications, and per-school
subscription licensing. Packaged as a desktop app via Tauri.

## Repo layout

```
akademia/
├── server/   Node.js + Express API, Prisma + PostgreSQL, business logic
└── client/   React (Vite) + Tailwind UI, later wrapped by Tauri (.exe)
```

## Getting started

### 1. Server
```
cd server
cp .env.example .env      # fill in real values
npm install
npx prisma migrate dev    # creates tables from prisma/schema.prisma
npm run dev               # starts API on http://localhost:5000
```

### 2. Client
```
cd client
npm install
npm run dev                # starts Vite dev server on http://localhost:5173
```

### 3. Desktop packaging (later, once UI is stable)
```
cd client
npm install -D @tauri-apps/cli
npx tauri init
npx tauri dev
npx tauri build            # produces the Windows .exe
```

## Build order (see PRD section 12)
1. Foundation (this scaffold)
2. Multi-tenancy + Auth (RBAC, tenant middleware)
3. Student records
4. Attendance
5. Fees
6. Grading
7. Result dispatch (Result-Fee Intercept)
8. Subscription & licensing
9. Tauri packaging
10. Production hardening

Every file below already has a comment block describing exactly what needs to
be implemented in it — that's your checklist as you go.
