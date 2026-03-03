-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('BOARDING', 'DENIED');

-- CreateTable
CREATE TABLE "TransportEvent" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,
    "rfidCardId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "TransportEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransportEvent_companyId_idx" ON "TransportEvent"("companyId");

-- CreateIndex
CREATE INDEX "TransportEvent_studentId_idx" ON "TransportEvent"("studentId");

-- AddForeignKey
ALTER TABLE "TransportEvent" ADD CONSTRAINT "TransportEvent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportEvent" ADD CONSTRAINT "TransportEvent_rfidCardId_fkey" FOREIGN KEY ("rfidCardId") REFERENCES "RfidCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportEvent" ADD CONSTRAINT "TransportEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportEvent" ADD CONSTRAINT "TransportEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
