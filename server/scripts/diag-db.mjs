import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.tenant.count();
  console.log('Tenant count:', count);
  const users = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log('Users:', JSON.stringify(users));
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
