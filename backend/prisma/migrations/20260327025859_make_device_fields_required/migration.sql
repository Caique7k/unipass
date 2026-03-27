/*
  Warnings:

  - Made the column `code` on table `Device` required. This step will fail if there are existing NULL values in that column.
  - Made the column `secret` on table `Device` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Device" ALTER COLUMN "code" SET NOT NULL,
ALTER COLUMN "secret" SET NOT NULL;
