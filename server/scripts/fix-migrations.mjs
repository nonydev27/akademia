import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Step 1: Manually apply migration2.sql changes
  console.log('--- Applying migration2.sql changes ---');

  // Attendance: drop old unique, add subjectId
  try {
    await prisma.$executeRaw`DROP INDEX IF EXISTS "Attendance_studentId_date_key"`;
    console.log('✓ Dropped Attendance_studentId_date_key');
  } catch (e) { console.log('! Attendance index drop:', e.message); }

  try {
    await prisma.$executeRaw`ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "subjectId" TEXT`;
    console.log('✓ Added Attendance.subjectId');
  } catch (e) { console.log('! Attendance.subjectId:', e.message); }

  // ReportCard: add approval fields and new default
  try {
    await prisma.$executeRaw`ALTER TYPE "ReportCardStatus" ADD VALUE IF NOT EXISTS 'DRAFT'`;
    console.log('✓ Added ReportCardStatus DRAFT');
  } catch (e) { console.log('! ReportCardStatus DRAFT:', e.message); }
  try {
    await prisma.$executeRaw`ALTER TYPE "ReportCardStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED'`;
    console.log('✓ Added ReportCardStatus SUBMITTED');
  } catch (e) { console.log('! ReportCardStatus SUBMITTED:', e.message); }
  try {
    await prisma.$executeRaw`ALTER TYPE "ReportCardStatus" ADD VALUE IF NOT EXISTS 'APPROVED'`;
    console.log('✓ Added ReportCardStatus APPROVED');
  } catch (e) { console.log('! ReportCardStatus APPROVED:', e.message); }

  try {
    await prisma.$executeRaw`ALTER TABLE "ReportCard" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3)`;
    console.log('✓ Added ReportCard.approvedAt');
  } catch (e) { console.log('! ReportCard.approvedAt:', e.message); }
  try {
    await prisma.$executeRaw`ALTER TABLE "ReportCard" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT`;
    console.log('✓ Added ReportCard.approvedBy');
  } catch (e) { console.log('! ReportCard.approvedBy:', e.message); }
  try {
    await prisma.$executeRaw`ALTER TABLE "ReportCard" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3)`;
    console.log('✓ Added ReportCard.submittedAt');
  } catch (e) { console.log('! ReportCard.submittedAt:', e.message); }
  try {
    await prisma.$executeRaw`ALTER TABLE "ReportCard" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`;
    console.log('✓ Set ReportCard.status default');
  } catch (e) { console.log('! ReportCard.status default:', e.message); }

  // Student: extended profile
  const studentCols = ['address','clubs','gender','nationality','nhisNumber','otherActivities','phone','previousSchool','profilePicUrl','religion','sports'];
  for (const col of studentCols) {
    try {
      await prisma.$executeRaw`ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "${col}" TEXT`;
      console.log(`✓ Added Student.${col}`);
    } catch (e) { console.log(`! Student.${col}:`, e.message); }
  }

  // Subject: add code and pin
  try {
    await prisma.$executeRaw`ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "code" TEXT NOT NULL DEFAULT ''`;
    console.log('✓ Added Subject.code');
  } catch (e) { console.log('! Subject.code:', e.message); }
  try {
    await prisma.$executeRaw`ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "pin" TEXT`;
    console.log('✓ Added Subject.pin');
  } catch (e) { console.log('! Subject.pin:', e.message); }

  // Subscription: payment tracking
  try {
    await prisma.$executeRaw`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "lastPaymentAmt" DOUBLE PRECISION`;
    console.log('✓ Added Subscription.lastPaymentAmt');
  } catch (e) { console.log('! Subscription.lastPaymentAmt:', e.message); }
  try {
    await prisma.$executeRaw`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "lastPaymentAt" TIMESTAMP(3)`;
    console.log('✓ Added Subscription.lastPaymentAt');
  } catch (e) { console.log('! Subscription.lastPaymentAt:', e.message); }

  // Tenant: admin contact info
  try {
    await prisma.$executeRaw`ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "adminContact" TEXT`;
    console.log('✓ Added Tenant.adminContact');
  } catch (e) { console.log('! Tenant.adminContact:', e.message); }
  try {
    await prisma.$executeRaw`ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "adminPhone" TEXT`;
    console.log('✓ Added Tenant.adminPhone');
  } catch (e) { console.log('! Tenant.adminPhone:', e.message); }

  // User: phone
  try {
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT`;
    console.log('✓ Added User.phone');
  } catch (e) { console.log('! User.phone:', e.message); }

  // Indexes
  try {
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_studentId_subjectId_date_key" ON "Attendance"("studentId", "subjectId", "date")`;
    console.log('✓ Created Attendance unique index');
  } catch (e) { console.log('! Attendance index:', e.message); }
  try {
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "Subject_tenantId_code_key" ON "Subject"("tenantId", "code")`;
    console.log('✓ Created Subject unique index');
  } catch (e) { console.log('! Subject index:', e.message); }

  // FK
  try {
    await prisma.$executeRaw`ALTER TABLE "Attendance" DROP CONSTRAINT IF EXISTS "Attendance_subjectId_fkey"`;
    console.log('✓ Dropped Attendance FK');
  } catch (e) { console.log('! Attendance FK drop:', e.message); }
  try {
    await prisma.$executeRaw`ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE`;
    console.log('✓ Added Attendance FK');
  } catch (e) { console.log('! Attendance FK add:', e.message); }

  // Step 2: Apply migration 4 (20260912130000_add_codes_and_surrogate_keys) - now that Subject.code exists
  console.log('\n--- Applying migration 4 ---');
  try {
    await prisma.$executeRaw`ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "code" TEXT`;
    console.log('✓ Added Tenant.code');
  } catch (e) { console.log('! Tenant.code:', e.message); }
  try {
    await prisma.$executeRaw`ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "studentSeq" INTEGER NOT NULL DEFAULT 0`;
    console.log('✓ Added Tenant.studentSeq');
  } catch (e) { console.log('! Tenant.studentSeq:', e.message); }
  try {
    await prisma.$executeRaw`ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "code" TEXT`;
    console.log('✓ Added Class.code');
  } catch (e) { console.log('! Class.code:', e.message); }
  try {
    await prisma.$executeRaw`ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "pinOwnerId" TEXT`;
    console.log('✓ Added Subject.pinOwnerId');
  } catch (e) { console.log('! Subject.pinOwnerId:', e.message); }
  try {
    await prisma.$executeRaw`ALTER TABLE "TeacherClassSubject" ADD COLUMN IF NOT EXISTS "accessCode" TEXT`;
    console.log('✓ Added TeacherClassSubject.accessCode');
  } catch (e) { console.log('! TeacherClassSubject.accessCode:', e.message); }

  // Backfill Tenant.code
  try {
    await prisma.$executeRaw`
      UPDATE "Tenant" SET "code" = UPPER(
        COALESCE(NULLIF((SELECT string_agg(LEFT(w, 1), '') FROM unnest(regexp_split_to_array(trim("name"), '\s+')) AS w WHERE w <> ''), ''), 'SCH')
      ) WHERE "code" IS NULL
    `;
    console.log('✓ Backfilled Tenant.code');
  } catch (e) { console.log('! Tenant.code backfill:', e.message); }

  // Deduplicate Tenant.code
  try {
    await prisma.$executeRaw`
      UPDATE "Tenant" t SET "code" = t."code" || '-' || LEFT(t."id", 4)
      WHERE EXISTS (SELECT 1 FROM "Tenant" t2 WHERE t2."code" = t."code" AND t2."id" < t."id")
    `;
    console.log('✓ Deduplicated Tenant.code');
  } catch (e) { console.log('! Tenant.code dedup:', e.message); }

  // Backfill Class.code
  try {
    await prisma.$executeRaw`UPDATE "Class" SET "code" = UPPER(regexp_replace("name", '\s+', '-', 'g')) WHERE "code" IS NULL`;
    console.log('✓ Backfilled Class.code');
  } catch (e) { console.log('! Class.code backfill:', e.message); }

  // Unique indexes
  try {
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_code_key" ON "Tenant"("code")`;
    console.log('✓ Created Tenant_code_key');
  } catch (e) { console.log('! Tenant_code_key:', e.message); }
  try {
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "Class_tenantId_code_key" ON "Class"("tenantId", "code")`;
    console.log('✓ Created Class_tenantId_code_key');
  } catch (e) { console.log('! Class_tenantId_code_key:', e.message); }

  // Set NOT NULL
  try {
    await prisma.$executeRaw`ALTER TABLE "Tenant" ALTER COLUMN "code" SET NOT NULL`;
    console.log('✓ Tenant.code NOT NULL');
  } catch (e) { console.log('! Tenant.code NOT NULL:', e.message); }
  try {
    await prisma.$executeRaw`ALTER TABLE "Class" ALTER COLUMN "code" SET NOT NULL`;
    console.log('✓ Class.code NOT NULL');
  } catch (e) { console.log('! Class.code NOT NULL:', e.message); }
  try {
    await prisma.$executeRaw`ALTER TABLE "Subject" ALTER COLUMN "code" DROP DEFAULT`;
    console.log('✓ Subject.code DROP DEFAULT');
  } catch (e) { console.log('! Subject.code DROP DEFAULT:', e.message); }

  // Step 3: Mark migration 4 as applied
  console.log('\n--- Marking migrations as applied ---');
  try {
    await prisma.$executeRaw`DELETE FROM "_prisma_migrations" WHERE migration_name = '20260912130000_add_codes_and_surrogate_keys'`;
    console.log('✓ Cleared migration 4 state');
  } catch (e) { console.log('! Clear migration 4:', e.message); }

  try {
    const now = new Date();
    await prisma.$executeRaw`INSERT INTO "_prisma_migrations" (id, migration_name, rolled_back_at, finished_at, migration_log, started_at, applied_steps_count)
      VALUES (gen_random_uuid(), '20260912130000_add_codes_and_surrogate_keys', NULL, NOW(), '[]', NOW(), 0)`;
    console.log('✓ Marked migration 4 as applied');
  } catch (e) { console.log('! Mark migration 4:', e.message); }

  console.log('\nDone! Now run: npx prisma generate');
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
