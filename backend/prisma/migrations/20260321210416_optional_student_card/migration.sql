-- DropForeignKey
ALTER TABLE "TransportEvent" DROP CONSTRAINT "TransportEvent_rfidCardId_fkey";

-- DropForeignKey
ALTER TABLE "TransportEvent" DROP CONSTRAINT "TransportEvent_studentId_fkey";

-- AlterTable
ALTER TABLE "TransportEvent" ALTER COLUMN "studentId" DROP NOT NULL,
ALTER COLUMN "rfidCardId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "TransportEvent" ADD CONSTRAINT "TransportEvent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportEvent" ADD CONSTRAINT "TransportEvent_rfidCardId_fkey" FOREIGN KEY ("rfidCardId") REFERENCES "RfidCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
