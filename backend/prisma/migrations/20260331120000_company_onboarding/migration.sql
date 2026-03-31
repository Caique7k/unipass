CREATE TYPE "CompanyPlan" AS ENUM ('ESSENTIAL', 'GROWTH', 'SCALE');

ALTER TABLE "Company"
ADD COLUMN "plan" "CompanyPlan" NOT NULL DEFAULT 'ESSENTIAL',
ADD COLUMN "contactName" TEXT,
ADD COLUMN "contactPhone" TEXT,
ADD COLUMN "smsVerifiedAt" TIMESTAMP(3);

ALTER TABLE "User"
ADD COLUMN "studentId" TEXT;

CREATE UNIQUE INDEX "User_studentId_key" ON "User"("studentId");
CREATE UNIQUE INDEX "Student_companyId_email_key" ON "Student"("companyId", "email");

ALTER TABLE "User"
ADD CONSTRAINT "User_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
