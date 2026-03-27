/*
  Warnings:

  - You are about to drop the column `identifier` on the `Device` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `Device` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_companyId_fkey";

-- DropIndex
DROP INDEX "Bus_plate_key";

-- DropIndex
DROP INDEX "Device_companyId_busId_idx";

-- DropIndex
DROP INDEX "Device_identifier_key";

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "identifier",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "code" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "secret" TEXT,
ALTER COLUMN "companyId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Device_code_key" ON "Device"("code");

-- CreateIndex
CREATE INDEX "Device_companyId_idx" ON "Device"("companyId");

-- CreateIndex
CREATE INDEX "Device_busId_idx" ON "Device"("busId");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
