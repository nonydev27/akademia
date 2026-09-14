/**
 * scripts/reset-superadmin-password.js — sets a known password on the superadmin
 * auth user in Supabase, then confirms the Prisma link is intact.
 *
 * WHY THIS EXISTS: prisma/seed.js uses findOrCreateAuthUser(), which RETURNS an
 * existing auth user instead of updating it. So if a superadmin auth user already
 * exists with an unknown password, re-running the seed does NOT fix your login.
 * This script does the explicit reset.
 *
 * Run from the server/ directory:
 *   node scripts/reset-superadmin-password.js "NewStrongPassword123!"
 *
 * Pass the password as a CLI arg (safer) or set SEED_SUPER_ADMIN_PASSWORD in .env.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const EMAIL = process.env.SEED_SUPER_ADMIN_EMAIL || "superadmin@akademia.app";
const PASSWORD = process.argv[2] || process.env.SEED_SUPER_ADMIN_PASSWORD;

async function main() {
  if (!PASSWORD) {
    console.error("No password supplied.");
    console.error(
      'Usage: node scripts/reset-superadmin-password.js "NewStrongPassword123!"',
    );
    process.exit(1);
  }
  if (PASSWORD.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  console.log(`\nResetting password for: ${EMAIL}\n${"─".repeat(50)}`);

  // Find the auth user in the CURRENT project.
  const { data: page, error: listErr } =
    await supabaseAdmin.auth.admin.listUsers();
  if (listErr) {
    console.error(`Could not list auth users: ${listErr.message}`);
    console.error(
      "Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env",
    );
    process.exit(1);
  }

  let authUser = (page?.users || []).find(
    (u) => u.email?.toLowerCase() === EMAIL.toLowerCase(),
  );

  if (!authUser) {
    console.log("No auth user found — creating one.");
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) {
      console.error(`Could not create auth user: ${error.message}`);
      process.exit(1);
    }
    authUser = data.user;
    console.log(`Created auth user: ${authUser.id}`);
  } else {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      {
        password: PASSWORD,
        email_confirm: true, // also clear any unconfirmed-email block
      },
    );
    if (error) {
      console.error(`Could not update password: ${error.message}`);
      process.exit(1);
    }
    console.log(`Updated password for existing auth user: ${authUser.id}`);
  }

  // Make sure a Prisma profile exists and points at this auth user.
  const dbUser = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!dbUser) {
    await prisma.user.create({
      data: {
        email: EMAIL,
        fullName: "Platform Super Admin",
        role: "SUPER_ADMIN",
        supabaseId: authUser.id,
      },
    });
    console.log("Created prisma.user profile (role=SUPER_ADMIN).");
  } else if (dbUser.supabaseId !== authUser.id) {
    await prisma.user.update({
      where: { email: EMAIL },
      data: { supabaseId: authUser.id },
    });
    console.log(`Relinked supabaseId: ${dbUser.supabaseId} → ${authUser.id}`);
  } else {
    console.log("prisma.user profile already linked correctly.");
  }

  console.log(`\n✓ Done. Sign in with:\n    ${EMAIL}\n    ${PASSWORD}\n`);
}

main()
  .catch((err) => {
    console.error("\nFailed:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
