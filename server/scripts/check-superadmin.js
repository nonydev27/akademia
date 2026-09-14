/**
 * scripts/check-superadmin.js — diagnoses why the superadmin login fails.
 *
 * Checks the two independent layers that must BOTH be correct:
 *   1. Supabase Auth  — does the auth user exist in THIS project?
 *   2. Prisma DB      — does a user row exist, and does its supabaseId match?
 *
 * Run from the server/ directory:
 *   node scripts/check-superadmin.js
 *
 * Read-only: it never creates, updates, or deletes anything.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const EMAIL = process.env.SEED_SUPER_ADMIN_EMAIL || 'superadmin@akademia.app';

// The project ref is baked into the URL and (for JWT keys) the key payload.
// Comparing them catches a half-updated .env pointing at two different projects.
function projectRefFromUrl(url) {
  const m = /^https:\/\/([a-z0-9]+)\.supabase\.co/i.exec(url || '');
  return m ? m[1] : null;
}

function projectRefFromJwt(key) {
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString('utf8'));
    return payload.ref || null;
  } catch {
    return null; // new-style publishable keys (sb_...) are not JWTs
  }
}

function projectRefFromDbUrl(url) {
  const m = /postgres(?:ql)?:\/\/postgres\.([a-z0-9]+):/i.exec(url || '');
  return m ? m[1] : null;
}

async function main() {
  console.log(`\nChecking superadmin: ${EMAIL}\n${'─'.repeat(50)}`);

  // ── 0. Which project is each setting pointed at? ──────────────────────────
  const urlRef = projectRefFromUrl(process.env.SUPABASE_URL);
  const anonRef = projectRefFromJwt(process.env.SUPABASE_ANON_KEY);
  const svcRef = projectRefFromJwt(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const dbRef = projectRefFromDbUrl(process.env.DATABASE_URL);

  console.log('Projects referenced by each setting:');
  console.log(`  SUPABASE_URL                 → ${urlRef ?? '(unparsed)'}`);
  console.log(`  DATABASE_URL                 → ${dbRef ?? '(unparsed)'}`);
  console.log(`  SUPABASE_ANON_KEY            → ${anonRef ?? '(publishable key; no ref)'}`);
  console.log(`  SUPABASE_SERVICE_ROLE_KEY    → ${svcRef ?? '(publishable key; no ref)'}`);

  const refs = [urlRef, dbRef, svcRef].filter(Boolean);
  const mismatched = new Set(refs).size > 1;
  if (mismatched) {
    console.log('\n  ✗ MISMATCH: these settings point at different Supabase projects.');
    console.log('    A token from one project cannot be verified by another. Fix .env first.');
  } else {
    console.log('\n  ✓ All parsed settings point at the same project.');
  }

  // ── 1. Supabase Auth layer ────────────────────────────────
  console.log('\n[1] Supabase Auth');
  const { data: page, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) {
    console.log(`  ✗ Could not list auth users: ${listErr.message}`);
    console.log('    (A bad SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL usually causes this.)');
  } else {
    const authUsers = page?.users || [];
    const match = authUsers.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());
    console.log(`  Total auth users in this project: ${authUsers.length}`);
    if (!match) {
      console.log(`  ✗ No Supabase auth user with email ${EMAIL}`);
      console.log('    → Run: npm run prisma:seed');
    } else {
      console.log(`  ✓ Found auth user: id=${match.id}`);
      console.log(`    email_confirmed_at: ${match.email_confirmed_at ?? 'NOT CONFIRMED'}`);
      console.log(`    last_sign_in_at:    ${match.last_sign_in_at ?? 'never'}`);
      if (!match.email_confirmed_at) {
        console.log('    ✗ Email is unconfirmed — signInWithPassword will be rejected.');
      }
      console.log('    (Password is hashed and cannot be read back. If in doubt, reset it.)');
    }
  }

  // ── 2. Prisma layer ───────────────────────
  console.log('\n[2] Prisma database');
  let dbUser = null;
  try {
    dbUser = await prisma.user.findUnique({ where: { email: EMAIL } });
  } catch (err) {
    console.log(`  ✗ Query failed: ${err.message}`);
    console.log('    → Likely the schema was never migrated. Run: npx prisma migrate deploy');
  }

  if (!dbUser) {
    console.log(`  ✗ No prisma.user row with email ${EMAIL}`);
    console.log('    → Run: npm run prisma:seed');
  } else {
    console.log(`  ✓ Found prisma.user: id=${dbUser.id} role=${dbUser.role}`);
    console.log(`    supabaseId: ${dbUser.supabaseId}`);
  }

  // ── 3. The join between them ──────────────────────────────
  console.log('\n[3] supabaseId link (the usual culprit)');
  let verdict = null;

  if (!dbUser) {
    verdict = 'NO_PROFILE';
    console.log('  (no DB user row — nothing to link)');
  } else {
    // Re-fetch. Check the error explicitly — ignoring it makes an auth failure
    // masquerade as "no auth user", which sends you down the wrong fix.
    const all = await supabaseAdmin.auth.admin.listUsers();
    if (all.error) {
      console.log(`  ! Could not re-list auth users: ${all.error.message}`);
      verdict = 'UNKNOWN';
    } else {
      const authMatch = (all.data?.users || []).find(
        (u) => u.email?.toLowerCase() === EMAIL.toLowerCase(),
      );
      if (!authMatch) {
        verdict = 'NO_AUTH_USER';
        console.log('  (no auth user to link against)');
      } else if (authMatch.id === dbUser.supabaseId) {
        verdict = 'LINKED';
        console.log('  ✓ supabaseId matches the auth user. Link is intact.');
      } else {
        verdict = 'MISMATCH';
        console.log('  ✗ MISMATCH:');
        console.log(`      auth user id : ${authMatch.id}`);
        console.log(`      supabaseId   : ${dbUser.supabaseId}`);
      }
    }
  }

  // ── 4. Verdict — name the exact failure and the exact fix ─────────────────
  console.log(`\n[4] Verdict\n${'─'.repeat(50)}`);
  switch (verdict) {
    case 'NO_PROFILE':
      console.log('  "This account has no Akademia profile."');
      console.log('  Cause: the Supabase login works, but no prisma.user row exists.');
      console.log('  Fix:   node scripts/reset-superadmin-password.js "<password>"');
      console.log('         (creates the missing profile; or run: npm run prisma:seed)');
      break;
    case 'MISMATCH':
      console.log('  "This account has no Akademia profile."');
      console.log('  Cause: the DB row exists but supabaseId points at a DIFFERENT');
      console.log("         auth user — typically the OLD project's id after a migration.");
      console.log('         requireAuth looks up by supabaseId, finds nothing, 401s.');
      console.log('  Fix:   node scripts/reset-superadmin-password.js "<password>"');
      console.log("         (relinks supabaseId to the current auth user's id)");
      break;
    case 'NO_AUTH_USER':
      console.log('  No Supabase auth user for this email.');
      console.log('  Fix:   node scripts/reset-superadmin-password.js "<password>"');
      break;
    case 'LINKED':
      console.log('  ✓ Auth user and DB profile are correctly linked.');
      console.log('  If login STILL fails, the stored password is wrong:');
      console.log('  Fix:   node scripts/reset-superadmin-password.js "<password>"');
      break;
    default:
      console.log('  Inconclusive — resolve the errors above, then re-run.');
  }

  console.log('');
}

main()
  .catch((err) => {
    console.error('\nDiagnostic failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
