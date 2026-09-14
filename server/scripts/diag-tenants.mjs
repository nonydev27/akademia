import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tenants = await prisma.tenant.findMany({
    include: { subscription: true, _count: { select: { students: true, users: true, fees: true, invoices: true, terms: true, classes: true, subjects: true } } },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Tenant count:', tenants.length);
  for (const t of tenants) {
    console.log(JSON.stringify({ id: t.id, name: t.name, level: t.schoolLevel, subStatus: t.subscription?.status, subPlan: t.subscription?.plan, counts: t._count }, null, 2).slice(0, 600));
  }
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
