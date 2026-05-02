CREATE TYPE "BillingTemplateRecurrence" AS ENUM (
    'MONTHLY',
    'BIMONTHLY',
    'QUARTERLY',
    'SEMIANNUAL',
    'YEARLY'
);

ALTER TABLE "Student"
ADD COLUMN "billingTemplateId" TEXT;

ALTER TABLE "BillingTemplate"
ADD COLUMN "recurrence" "BillingTemplateRecurrence" NOT NULL DEFAULT 'MONTHLY';

UPDATE "Student" AS "student"
SET "billingTemplateId" = "recent_charge"."templateId"
FROM (
    SELECT DISTINCT ON ("studentId")
        "studentId",
        "templateId"
    FROM "BillingCharge"
    WHERE "studentId" IS NOT NULL
      AND "templateId" IS NOT NULL
    ORDER BY "studentId", "createdAt" DESC
) AS "recent_charge"
WHERE "student"."id" = "recent_charge"."studentId";

CREATE INDEX "Student_billingTemplateId_idx" ON "Student"("billingTemplateId");

ALTER TABLE "Student"
ADD CONSTRAINT "Student_billingTemplateId_fkey"
FOREIGN KEY ("billingTemplateId") REFERENCES "BillingTemplate"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
