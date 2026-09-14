import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, rolled_back_at, finished_at, logs, started_at, applied_steps_count)
     VALUES (gen_random_uuid(), '', '20260912130000_add_codes_and_surrogate_keys', NULL, NOW(), '[]', NOW(), 0)`
  );
  console.log('✓ Marked migration 4 as applied');
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
