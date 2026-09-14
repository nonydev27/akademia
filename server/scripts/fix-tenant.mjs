import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  // Add all known missing Tenant columns
  const tenantCols = ['slogan'];
  for (const col of tenantCols) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "${col}" TEXT`);
      console.log(`✓ Tenant.${col}`);
    } catch (e) { console.log(`! Tenant.${col}:`, e.message); }
  }

  // Check if Demo School tenant exists now
  const existing = await prisma.tenant.findFirst({ where: { name: 'Demo School' } });
  if (existing) {
    console.log('Demo School already exists, skipping tenant creation');
  } else {
    console.log('Demo School not found, will need to create manually');
  }
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
