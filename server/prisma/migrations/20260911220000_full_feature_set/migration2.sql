-- AlterTable Attendance: drop old unique, add subjectId
DROP INDEX IF EXISTS "Attendance_studentId_date_key";
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "subjectId" TEXT;

-- AlterTable ReportCard: add approval fields and new default
ALTER TABLE "ReportCard"
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);
ALTER TABLE "ReportCard" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable Student: extended profile
ALTER TABLE "Student"
  ADD COLUMN IF NOT EXISTS "address" TEXT,
  ADD COLUMN IF NOT EXISTS "clubs" TEXT,
  ADD COLUMN IF NOT EXISTS "gender" TEXT,
  ADD COLUMN IF NOT EXISTS "nationality" TEXT,
  ADD COLUMN IF NOT EXISTS "nhisNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "otherActivities" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "previousSchool" TEXT,
  ADD COLUMN IF NOT EXISTS "profilePicUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "religion" TEXT,
  ADD COLUMN IF NOT EXISTS "sports" TEXT;

-- AlterTable Subject: add code and pin
ALTER TABLE "Subject"
  ADD COLUMN IF NOT EXISTS "code" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "pin" TEXT;

-- AlterTable Subscription: payment tracking
ALTER TABLE "Subscription"
  ADD COLUMN IF NOT EXISTS "lastPaymentAmt" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "lastPaymentAt" TIMESTAMP(3);

-- AlterTable Tenant: admin contact info
ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "adminContact" TEXT,
  ADD COLUMN IF NOT EXISTS "adminPhone" TEXT;

-- AlterTable User: phone
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_studentId_subjectId_date_key" ON "Attendance"("studentId", "subjectId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "Subject_tenantId_code_key" ON "Subject"("tenantId", "code");

-- FK Attendance -> Subject
ALTER TABLE "Attendance" DROP CONSTRAINT IF EXISTS "Attendance_subjectId_fkey";
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
