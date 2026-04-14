-- AlterTable
ALTER TABLE "RouteSchedule"
ADD COLUMN "departureMinutes" INTEGER,
ADD COLUMN "notificationDayOfWeek" INTEGER,
ADD COLUMN "notificationTimeMinutes" INTEGER;

UPDATE "RouteSchedule"
SET
  "departureMinutes" = (EXTRACT(HOUR FROM "departureTime")::int * 60)
    + EXTRACT(MINUTE FROM "departureTime")::int,
  "notificationTimeMinutes" = (
    (
      (EXTRACT(HOUR FROM "departureTime")::int * 60)
      + EXTRACT(MINUTE FROM "departureTime")::int
      - "notifyBeforeMinutes"
      + 1440
    ) % 1440
  ),
  "notificationDayOfWeek" = CASE
    WHEN "dayOfWeek" IS NULL THEN NULL
    WHEN "notifyBeforeMinutes" > (
      (EXTRACT(HOUR FROM "departureTime")::int * 60)
      + EXTRACT(MINUTE FROM "departureTime")::int
    ) THEN ("dayOfWeek" + 6) % 7
    ELSE "dayOfWeek"
  END;

ALTER TABLE "RouteSchedule"
ALTER COLUMN "departureMinutes" SET NOT NULL,
ALTER COLUMN "notificationTimeMinutes" SET NOT NULL;

-- AlterTable
ALTER TABLE "ScheduleConfirmation"
ADD COLUMN "occurrenceKey" TEXT;

UPDATE "ScheduleConfirmation"
SET "occurrenceKey" = TO_CHAR("createdAt"::date, 'YYYY-MM-DD')
WHERE "occurrenceKey" IS NULL;

ALTER TABLE "ScheduleConfirmation"
ALTER COLUMN "occurrenceKey" SET NOT NULL;

-- DropIndex
DROP INDEX "ScheduleConfirmation_userId_scheduleId_key";

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationPromptStatus" AS ENUM ('PENDING', 'DISPATCHED', 'ANSWERED', 'EXPIRED', 'FAILED');

-- CreateTable
CREATE TABLE "NotificationPrompt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "occurrenceKey" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "deliveryChannel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "status" "NotificationPromptStatus" NOT NULL DEFAULT 'PENDING',
    "response" BOOLEAN,
    "dispatchedAt" TIMESTAMP(3),
    "answeredAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RouteSchedule_active_notificationTimeMinutes_notificationDayOfWeek_idx"
ON "RouteSchedule"("active", "notificationTimeMinutes", "notificationDayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleConfirmation_userId_scheduleId_occurrenceKey_key"
ON "ScheduleConfirmation"("userId", "scheduleId", "occurrenceKey");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPrompt_userId_scheduleId_occurrenceKey_key"
ON "NotificationPrompt"("userId", "scheduleId", "occurrenceKey");

-- CreateIndex
CREATE INDEX "NotificationPrompt_userId_status_createdAt_idx"
ON "NotificationPrompt"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationPrompt_scheduleId_occurrenceKey_idx"
ON "NotificationPrompt"("scheduleId", "occurrenceKey");

-- AddForeignKey
ALTER TABLE "NotificationPrompt"
ADD CONSTRAINT "NotificationPrompt_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPrompt"
ADD CONSTRAINT "NotificationPrompt_scheduleId_fkey"
FOREIGN KEY ("scheduleId") REFERENCES "RouteSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
