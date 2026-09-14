import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Fixing Student columns with executeRawUnsafe ---');
  const studentCols = ['address','clubs','gender','nationality','nhisNumber','otherActivities','phone','previousSchool','profilePicUrl','religion','sports'];
  for (const col of studentCols) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "${col}" TEXT`);
      console.log(`✓ Added Student.${col}`);
    } catch (e) { console.log(`! Student.${col}:`, e.message); }
  }

  console.log('\n--- Marking migration 4 as applied ---');
  try {
    await prisma.$executeRaw`DELETE FROM "_prisma_migrations" WHERE migration_name = '20260912130000_add_codes_and_surrogate_keys'`;
    console.log('✓ Cleared migration 4 state');
  } catch (e) { console.log('! Clear migration 4:', e.message); }

  try {
    const result = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = '_prisma_migrations'`;
    const cols = result.map(r => r.column_name);
    const hasLog = cols.includes('migration_log');
    if (hasLog) {
      await prisma.$executeRaw`INSERT INTO "_prisma_migrations" (id, migration_name, rolled_back_at, finished_at, migration_log, started_at, applied_steps_count)
        VALUES (gen_random_uuid(), '20260912130000_add_codes_and_surrogate_keys', NULL, NOW(), '[]', NOW(), 0)`;
      console.log('✓ Marked migration 4 as applied');
    } else {
      console.log('! migration_log column missing, checking schema...');
      console.log('Columns:', cols);
    }
  } catch (e) { console.log('! Mark migration 4:', e.message); }

  console.log('\nDone!');
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
