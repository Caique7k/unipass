CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameNormalized" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Group_companyId_nameNormalized_key"
ON "Group"("companyId", "nameNormalized");

CREATE INDEX "Group_companyId_active_createdAt_idx"
ON "Group"("companyId", "active", "createdAt");

ALTER TABLE "Group"
ADD CONSTRAINT "Group_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
