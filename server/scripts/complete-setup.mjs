import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
const prisma = new PrismaClient();
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findOrCreateAuthUser(email, password) {
  const { data: page } = await supabaseAdmin.auth.admin.listUsers();
  const existing = page?.users?.find((u) => u.email === email);
  if (existing) return existing;
  const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  return data.user;
}

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { name: 'Demo School' } });
  if (!tenant) { console.log('Demo School not found'); return; }

  // Check if subscription exists
  const existingSub = await prisma.subscription.findUnique({ where: { tenantId: tenant.id } });
  if (!existingSub) {
    await prisma.subscription.create({
      data: { tenantId: tenant.id, status: 'ACTIVE', expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    });
    console.log('✓ Subscription created');
  } else {
    console.log('✓ Subscription already exists');
  }

  // Admin
  const adminAuth = await findOrCreateAuthUser('admin@demoschool.app', 'Admin123!');
  const existingAdmin = await prisma.user.findFirst({ where: { email: 'admin@demoschool.app' } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: { tenantId: tenant.id, role: 'SCHOOL_ADMIN', fullName: 'Demo Admin', email: 'admin@demoschool.app', supabaseId: adminAuth.id },
    });
    console.log('✓ Admin user created');
  } else {
    console.log('✓ Admin user exists');
  }

  // Teacher
  const teacherAuth = await findOrCreateAuthUser('teacher@demoschool.app', 'Staff123!');
  const existingTeacher = await prisma.user.findFirst({ where: { email: 'teacher@demoschool.app' } });
  if (!existingTeacher) {
    await prisma.user.create({
      data: { tenantId: tenant.id, role: 'STAFF', fullName: 'Demo Teacher', email: 'teacher@demoschool.app', supabaseId: teacherAuth.id },
    });
    console.log('✓ Teacher user created');
  } else {
    console.log('✓ Teacher user exists');
  }
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
