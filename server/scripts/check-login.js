import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
const prisma = new PrismaClient();
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const EMAIL = 'karldjansi123@gmail.com';

  console.log('=== [1] Supabase Auth ===');
  const { data } = await supabaseAdmin.auth.admin.listUsers();
  const user = data?.users?.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());
  if (user) {
    console.log(`✓ Auth user found: id=${user.id}, email=${user.email}, confirmed=${user.email_confirmed_at ? 'yes' : 'no'}`);
  } else {
    console.log('✗ No auth user found');
  }

  console.log('\n=== [2] Prisma DB ===');
  let dbUser = null;
  try {
    dbUser = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (dbUser) {
      console.log(`✓ DB user found: id=${dbUser.id}, role=${dbUser.role}, email=${dbUser.email}`);
      console.log(`  supabaseId: ${dbUser.supabaseId}`);
    } else {
      console.log('✗ No DB user found');
    }
  } catch (e) {
    console.log(`✗ DB query failed: ${e.message}`);
  }

  console.log('\n=== [3] Link Check ===');
  if (user && dbUser) {
    if (user.id === dbUser.supabaseId) {
      console.log('✓ LINKED — auth user and DB profile match');
    } else {
      console.log('✗ MISMATCH — auth user and DB profile do NOT match');
      console.log(`  auth user id : ${user.id}`);
      console.log(`  supabaseId   : ${dbUser.supabaseId}`);
      console.log('  → This is why login fails');
    }
  }
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
