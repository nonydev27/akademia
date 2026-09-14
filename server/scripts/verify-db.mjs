import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log('=== Tenants ===');
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true, code: true } });
  console.log(JSON.stringify(tenants));

  console.log('\n=== Users ===');
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, tenantId: true } });
  console.log(JSON.stringify(users));

  console.log('\n=== Subscriptions ===');
  const subs = await prisma.subscription.findMany({ select: { id: true, tenantId: true, status: true, plan: true } });
  console.log(JSON.stringify(subs));
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
