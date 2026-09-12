-- Step 1: AlterEnum: remove TARDY from AttendanceStatus
BEGIN;
CREATE TYPE "AttendanceStatus_new" AS ENUM ('PRESENT', 'ABSENT');
ALTER TABLE "Attendance" ALTER COLUMN "status" TYPE "AttendanceStatus_new" USING ("status"::text::"AttendanceStatus_new");
ALTER TYPE "AttendanceStatus" RENAME TO "AttendanceStatus_old";
ALTER TYPE "AttendanceStatus_new" RENAME TO "AttendanceStatus";
DROP TYPE "AttendanceStatus_old";
COMMIT;

-- Step 2: AlterEnum: add new ReportCard statuses (must commit before using as default)
ALTER TYPE "ReportCardStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "ReportCardStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "ReportCardStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
