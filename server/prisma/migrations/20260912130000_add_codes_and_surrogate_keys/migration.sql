-- School codes, class codes, student sequence, subject PIN owner,
-- and teacher-assignment surrogate access codes.
-- Internal UUID primary keys are unchanged; these are the human-facing codes.

-- Add school code (initials) + per-school student sequence.
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "studentSeq" INTEGER NOT NULL DEFAULT 0;

-- Add admin-facing Class ID.
ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "code" TEXT;

-- Subject PIN ownership + teacher assignment surrogate key.
ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "pinOwnerId" TEXT;
ALTER TABLE "TeacherClassSubject" ADD COLUMN IF NOT EXISTS "accessCode" TEXT;

-- Backfill: derive a school code from the name for any existing tenants.
UPDATE "Tenant"
SET "code" = UPPER(
  COALESCE(
    NULLIF(
      (SELECT string_agg(LEFT(w, 1), '')
       FROM unnest(regexp_split_to_array(trim("Tenant"."name"), '\s+')) AS w
       WHERE w <> ''),
      ''
    ),
    'SCH'
  )
)
WHERE "code" IS NULL;

-- Guarantee uniqueness where initials collide (append a short suffix).
UPDATE "Tenant" t
SET "code" = t."code" || '-' || LEFT(t."id", 4)
WHERE EXISTS (
  SELECT 1 FROM "Tenant" t2
  WHERE t2."code" = t."code" AND t2."id" < t."id"
);

-- Backfill Class.code from the class name for existing rows.
UPDATE "Class"
SET "code" = UPPER(regexp_replace("name", '\s+', '-', 'g'))
WHERE "code" IS NULL;

-- Enforce uniqueness + required-ness now that everything is backfilled.
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_code_key" ON "Tenant"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "Class_tenantId_code_key" ON "Class"("tenantId", "code");

ALTER TABLE "Tenant" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "Class"  ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "Subject" ALTER COLUMN "code" DROP DEFAULT;
