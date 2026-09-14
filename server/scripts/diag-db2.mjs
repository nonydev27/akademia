import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  // Check what columns exist on Subject
  const result = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'Subject'
    ORDER BY ordinal_position
  `;
  console.log('Subject columns:', JSON.stringify(result, null, 2));

  // Check applied migrations
  const migrations = await prisma.$queryRaw`
    SELECT migration_name, finished_at, rolled_back_at
    FROM "_prisma_migrations"
    ORDER BY started_at
  `;
  console.log('Migrations:', JSON.stringify(migrations, null, 2));
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
