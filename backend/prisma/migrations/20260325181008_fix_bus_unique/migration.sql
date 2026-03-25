/*
  Warnings:

  - A unique constraint covering the columns `[plate,companyId]` on the table `Bus` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Bus_plate_companyId_key" ON "Bus"("plate", "companyId");
