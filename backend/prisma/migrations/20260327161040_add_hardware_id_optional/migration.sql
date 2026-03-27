/*
  Warnings:

  - A unique constraint covering the columns `[hardwareId]` on the table `Device` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pairingCode]` on the table `Device` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "hardwareId" TEXT,
ADD COLUMN     "pairedAt" TIMESTAMP(3),
ADD COLUMN     "pairingCode" TEXT,
ADD COLUMN     "pairingCodeExpiresAt" TIMESTAMP(3),
ALTER COLUMN "code" DROP NOT NULL,
ALTER COLUMN "secret" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Device_hardwareId_key" ON "Device"("hardwareId");

-- CreateIndex
CREATE UNIQUE INDEX "Device_pairingCode_key" ON "Device"("pairingCode");
