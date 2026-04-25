ALTER TABLE "Company"
ADD COLUMN "requestedPlan" "CompanyPlan",
ADD COLUMN "planChangeRequestedAt" TIMESTAMP(3),
ADD COLUMN "planChangeRequestedByName" TEXT,
ADD COLUMN "planChangeRequestedByEmail" TEXT;

CREATE INDEX "Company_requestedPlan_planChangeRequestedAt_idx"
ON "Company"("requestedPlan", "planChangeRequestedAt");
