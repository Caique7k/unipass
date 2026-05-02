ALTER TABLE "BillingCharge"
ADD COLUMN "issueDate" TIMESTAMP(3);

UPDATE "BillingCharge"
SET "issueDate" = "createdAt"
WHERE "issueDate" IS NULL;

ALTER TABLE "BillingCharge"
ALTER COLUMN "issueDate" SET NOT NULL;

CREATE INDEX "BillingCharge_companyId_issueDate_idx"
ON "BillingCharge"("companyId", "issueDate");
