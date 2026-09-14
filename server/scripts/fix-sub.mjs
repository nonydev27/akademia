import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "plan" "SubscriptionPlan" NOT NULL DEFAULT 'BASIC'`);
  console.log('✓ Subscription.plan');
  await prisma.$executeRawUnsafe(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "features" JSON NOT NULL DEFAULT '{}'`);
  console.log('✓ Subscription.features');
  await prisma.$executeRawUnsafe(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "lastPaymentAmt" DOUBLE PRECISION`);
  console.log('✓ Subscription.lastPaymentAmt (idempotent)');
  await prisma.$executeRawUnsafe(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "lastPaymentAt" TIMESTAMP(3)`);
  console.log('✓ Subscription.lastPaymentAt (idempotent)');
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
