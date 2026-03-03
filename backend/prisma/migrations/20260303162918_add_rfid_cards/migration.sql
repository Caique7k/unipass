-- CreateTable
CREATE TABLE "RfidCard" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "studentId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RfidCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RfidCard_tag_key" ON "RfidCard"("tag");

-- CreateIndex
CREATE INDEX "RfidCard_companyId_idx" ON "RfidCard"("companyId");

-- AddForeignKey
ALTER TABLE "RfidCard" ADD CONSTRAINT "RfidCard_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfidCard" ADD CONSTRAINT "RfidCard_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
