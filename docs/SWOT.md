# Akademia — SWOT Analysis

This document analyzes Akademia's position as a school management platform for Ghanaian schools, covering Strengths, Weaknesses, Opportunities, and Threats.

---

## Strengths

### 1. Multi-Tenant Architecture
- Each school operates as an isolated tenant with full data scoping at the API level.
- A single deployment serves many schools, reducing infrastructure cost.
- Tenant isolation is enforced by middleware on every request — no cross-school data leakage.

### 2. Role-Based Access Control (RBAC)
- Three distinct roles: Super Admin (platform), School Admin (per-school), Staff (teachers).
- Each role has clearly scoped permissions with middleware enforcement.
- Teachers can only access data for classes they are assigned to.

### 3. Human-Facing Codes (No UUID Exposure)
- All user-facing identifiers are codes (School initials, Class ID, Subject Code, Student Admission Number).
- Internal UUIDs are never exposed to users — clean, professional UX.
- Teacher assignments use surrogate access codes (e.g., T-AO-ENGLP2-JHS2A).

### 4. Result-Fee Intercept
- Report cards are withheld until fee balances are zero — a strong financial incentive for fee payment.
- Automated PDF generation and guardian notification (email + SMS) on release.
- Protects schools from losing students over unpaid fees.

### 5. Comprehensive Grading System
- Multi-component scoring: CA (30%), Mid-term (20%), Exam (50%).
- Bulk grade entry with single transaction saves.
- Finalization lock prevents post-finalize edits.
- Configurable grade bands (admin-defined letter scales).

### 6. PIN-Gated Teacher Portal
- Teachers authenticate into grade entry via subject code + 4-digit PIN.
- Each teacher only sees and edits their assigned class + subject combinations.
- Self-service PIN reset — no admin intervention needed.

### 7. Subscription & Licensing Model
- Subscription status drives access (Active, Grace, Locked).
- Grace period allows continued access during payment disputes.
- Webhook + polling verification for payment processing.

### 8. Full Audit Trail
- Every significant action is logged (actor, action, target, metadata).
- Supports accountability and compliance requirements.

### 9. Ghana-Specific Integration
- Arkesel SMS for local delivery.
- Paystack for local payments.
- Built with Ghanaian educational context in mind (GHS currency, school levels).

### 10. Desktop Packaging Path
- Tauri packaging planned for offline-capable Windows desktop app.
- Extends reach beyond browser-only access.

---

## Weaknesses

### 1. No Client-Side State Management Library
- State is managed with raw React `useState`/`useEffect` across many components.
- As features grow, this becomes hard to maintain — no store, no selectors, no middleware.
- Risk of stale state, unnecessary re-renders, and race conditions.

### 2. Limited Test Coverage
- Only 2 test files (fee service, grade service).
- No integration tests, no E2E tests, no route/controller tests.
- High risk of regressions as features are added.

### 3. No Caching Layer
- Every page triggers full API calls with no client or server-side caching.
- List pages re-fetch all data on every mount — no stale-while-revalidate pattern.
- On slow connections (common in Ghana), this creates perceived lag.

### 4. Session-Only Auth Tokens
- JWTs are stored in Supabase session only — no persistent refresh token strategy.
- If the session expires mid-workflow, the user is forced to re-login.
- No silent refresh mechanism.

### 5. Pin Hashing Uses SHA-256 (Not Bcrypt)
- 4-digit PINs are hashed with SHA-256 — fast to brute-force if the DB is compromised.
- Should use bcrypt or Argon2 for proper security, even on low-stakes PINs.

### 6. Monolithic API
- All features in a single Express app — no microservice separation.
- Scaling individual features (e.g., payments, email) independently is impossible.
- A slow email service can impact grade entry latency.

### 7. Missing Term/Academic Year Management UI (Previously)
- Admin had no way to create, edit, or activate terms — required DB changes.
- Now addressed with Terms page (this fix).

### 8. No Bulk Import/Export
- No CSV/Excel import for students, classes, or subjects.
- Manual creation through the UI is slow for large schools.
- No data export for offline reporting.

### 9. Student Class Assignment Can Be Better
- While the ClassAssignmentPanel now allows reassignment, there's no historical tracking of class changes.
- No concept of academic year/class level tracking for promotions.

### 10. Client Build Bundle Size
- The production build is 649 KB (180 KB gzipped) — large for a school management app.
- No code splitting or lazy loading implemented.

---

## Opportunities

### 1. Government Partnership (Ghana Education Service)
- Ghana's GES is digitizing school administration — Akademia could integrate or partner.
- Integration withGES student database for admission verification.
- Potential for government-funded deployment across public schools.

### 2. Parent/Guardian Portal (Mobile-First)
- Guardians currently only receive SMS/email notifications.
- A lightweight mobile web app for fee payment, result viewing, and attendance checking would expand the market.
- Progressive Web App (PWA) would work on low-end phones common in Ghana.

### 3. SMS-Based USSD Interface
- Many teachers and parents in rural Ghana don't have smartphones.
- A USSD menu (*999# style) for fee balance checks, attendance confirmation, and result inquiries could reach millions.

### 4. AI-Powered Insights
- Predictive analytics: identify students at risk of failing based on CA trends.
- Automated attendance pattern analysis.
- Fee default prediction and proactive outreach.

### 5. Integration with Exam Bodies
- WASSCE, BECE, and other national exam integration.
- Import external exam scores alongside internal assessments.

### 6. Multi-School District Management
- Expand the Super Admin role to manage school clusters/districts.
- Cross-school benchmarking and reporting.
- District-level analytics dashboards.

### 7. Offline-First with Tauri
- The planned Tauri desktop app can work fully offline.
- Sync on reconnection — critical for schools with unreliable internet.
- Attendance and grade entry can happen offline and sync later.

### 8. Training and Certification Partnerships
- Partner with teacher training colleges.
- Offer Akademia as a teaching tool with certification for ICT in education.
- Generate recurring institutional licenses.

### 9. Expansion to Other West African Countries
- Similar educational systems in Nigeria, Sierra Leone, Gambia, Liberia.
- Localize for each country's curriculum, fee structure, and payment methods.

### 10. API-as-a-Service
- Expose the Akademia API as a managed service for third-party app developers.
- Charge per-call or subscription for access.
- Enable a marketplace of educational apps on top of Akademia's data.

---

## Threats

### 1. Free-Tier Service Limits (Supabase, Resend, Arkesel)
- Supabase free tier: 500 MB storage, shared CPU — may not scale for large schools.
- Resend free tier: 3,000 emails/month — insufficient for multi-school deployments.
- Arkesel test credits may not scale to production volume.
- Mitigation: Monitor usage, budget for paid tiers early.

### 2. Competition from Established Platforms
- Google Classroom, Microsoft Education, Edmodo have significant market share.
- Local competitors may emerge with similar features.
- Mitigation: Focus on Ghana-specific features (local payments, SMS, curriculum alignment) that global platforms can't match.

### 3. Data Privacy Regulations (Ghana Data Protection Act)
- GDPR-like requirements under Ghana's Data Protection Act, 2012 (Act 843).
- Student data (minors) requires special handling and parental consent.
- Mitigation: Document data processing, implement consent workflows, conduct DPIA.

### 4. Payment Gateway Dependency
- Paystack/Flutterwave outages directly block fee collection.
- Webhook failures can cause subscription lockouts.
- Mitigation: Implement polling-based fallback (already done), maintain grace period buffer.

### 5. Supabase Pricing Changes
- Supabase can change pricing at any time.
- A significant price increase could make the platform unviable for small schools.
- Mitigation: Support self-hosted PostgreSQL, avoid vendor lock-in.

### 6. Teacher Adoption Resistance
- Teachers may resist new technology, especially PIN-based grade entry.
- Training overhead for schools with limited ICT capacity.
- Mitigation: Keep UI simple, provide training materials, offer phone-based support.

### 7. Subscription Renewal Churn
- Schools may forget to renew, leading to data lockout.
- Aggressive grace period policies could frustrate paying customers.
- Mitigation: Proactive email/SMS reminders, flexible grace periods, data export before lockout.

### 8. Technical Debt Accumulation
- Rapid feature development without tests or refactoring.
- The monolithic architecture makes refactoring risky.
- Mitigation: Allocate sprint time for tech debt reduction, add tests incrementally.

### 9. Currency and Economic Volatility
- Ghanaian Cedi (GHS) volatility affects fee calculations and reporting.
- Exchange rate changes can create confusion in financial records.
- Mitigation: Record transactions in GHS with clear rate metadata at time of transaction.

### 10. Security Breach Risk
- Centralized student data is high-value for attackers.
- A breach would expose personal data of minors.
- Mitigation: Regular security audits, encryption at rest and in transit, rate limiting, input validation.

---

## Summary Matrix

|                | Positive (+)                        | Negative (−)                       |
|----------------|-------------------------------------|-------------------------------------|
| **Internal**   | **Strengths**: Multi-tenant RBAC, code-based UX, result-fee intercept, grading system, PIN portal | **Weaknesses**: No caching, limited tests, no state library, monolithic API |
| **External**   | **Opportunities**: GES partnership, mobile/web, USSD, AI insights, regional expansion | **Threats**: Platform pricing, competition, data laws, payment dependency |

---

*Analysis date: September 2026 · Akademia v1.0*
