-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('ACTIVE', 'FINISHED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "EventType" ADD VALUE 'LEAVING';

-- DropIndex
DROP INDEX "Device_companyId_idx";

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "busId" TEXT,
ADD COLUMN     "lastLat" DOUBLE PRECISION,
ADD COLUMN     "lastLng" DOUBLE PRECISION,
ADD COLUMN     "lastUpdate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TransportEvent" ADD COLUMN     "tripId" TEXT;

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "busId" TEXT,
    "companyId" TEXT NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trip_companyId_idx" ON "Trip"("companyId");

-- CreateIndex
CREATE INDEX "Device_companyId_busId_idx" ON "Device"("companyId", "busId");

-- CreateIndex
CREATE INDEX "Student_companyId_createdAt_idx" ON "Student"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "TransportEvent_deviceId_idx" ON "TransportEvent"("deviceId");

-- CreateIndex
CREATE INDEX "TransportEvent_companyId_createdAt_idx" ON "TransportEvent"("companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportEvent" ADD CONSTRAINT "TransportEvent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
