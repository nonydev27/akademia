import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  // Create missing enums (ignore errors if they exist)
  const types = [
    { name: 'SubscriptionPlan', values: "'BASIC', 'STANDARD', 'PREMIUM'" },
    { name: 'TermStatus', values: "'ACTIVE', 'INACTIVE'" },
  ];
  for (const t of types) {
    try {
      await prisma.$executeRawUnsafe(`CREATE TYPE "${t.name}" AS ENUM (${t.values})`);
      console.log(`✓ Created type ${t.name}`);
    } catch (e) { console.log(`! Type ${t.name} (may exist): ${e.message.split('\n')[0]}`); }
  }

  // Add missing columns
  const changes = [
    { table: 'Subscription', col: 'plan', type: '"SubscriptionPlan" NOT NULL DEFAULT \'BASIC\'' },
    { table: 'Subscription', col: 'features', type: 'JSON NOT NULL DEFAULT \'{}\'' },
    { table: 'Term', col: 'status', type: '"TermStatus" NOT NULL DEFAULT \'ACTIVE\'' },
  ];
  for (const c of changes) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${c.table}" ADD COLUMN IF NOT EXISTS "${c.col}" ${c.type}`);
      console.log(`✓ ${c.table}.${c.col}`);
    } catch (e) { console.log(`! ${c.table}.${c.col}: ${e.message.split('\n')[0]}`); }
  }

  // Check if super admin exists
  const admin = await prisma.user.findFirst({ where: { email: 'karldjansi123@gmail.com' } });
  console.log('Super admin exists:', !!admin);
  if (admin) {
    console.log('Super admin:', admin.fullName, admin.role);
  }
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
