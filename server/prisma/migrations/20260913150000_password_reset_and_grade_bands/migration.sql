-- PasswordResetToken table — stores password reset tokens
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
  "id"        TEXT          NOT NULL DEFAULT gen_random_uuid(),
  "token"     TEXT          NOT NULL,
  "userId"    TEXT          NOT NULL,
  "expiresAt" TIMESTAMP(3)  NOT NULL,
  "used"      BOOLEAN       NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3)  NOT NULL DEFAULT now(),

  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_index" ON "PasswordResetToken"("userId");

ALTER TABLE "PasswordResetToken"
  ADD CONSTRAINT "PasswordResetToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- GradeBand table — letter grade boundaries per tenant
CREATE TABLE IF NOT EXISTS "GradeBand" (
  "id"       TEXT          NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" TEXT          NOT NULL,
  "letter"   TEXT          NOT NULL,
  "minScore" FLOAT         NOT NULL,
  "maxScore" FLOAT         NOT NULL,
  "remark"   TEXT          NOT NULL,

  CONSTRAINT "GradeBand_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GradeBand_tenantId_letter_key" ON "GradeBand"("tenantId", "letter");
CREATE INDEX IF NOT EXISTS "GradeBand_tenantId_index" ON "GradeBand"("tenantId");

ALTER TABLE "GradeBand"
  ADD CONSTRAINT "GradeBand_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: The foreign key is already handled via PasswordResetToken.userId column.
-- No additional column needed on User table — Prisma manages the relation.
