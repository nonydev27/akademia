import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
const prisma = new PrismaClient();
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const EMAIL = 'karldjansi123@gmail.com';

  console.log('=== [1] Auth user in DB ===');
  const { data } = await supabaseAdmin.auth.admin.listUsers();
  const user = data?.users?.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());
  if (user) {
    console.log(`✓ Found: id=${user.id}, confirmed=${user.email_confirmed_at ? 'yes' : 'no'}`);
  } else {
    console.log('✗ No auth user');
    return;
  }

  console.log('\n=== [2] DB profile ===');
  const dbUser = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (dbUser) {
    console.log(`✓ Found: id=${dbUser.id}, role=${dbUser.role}`);
    console.log(`  supabaseId: ${dbUser.supabaseId}`);
    console.log(`  match: ${user.id === dbUser.supabaseId ? 'YES' : 'NO'}`);
  } else {
    console.log('✗ No DB user');
  }
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
