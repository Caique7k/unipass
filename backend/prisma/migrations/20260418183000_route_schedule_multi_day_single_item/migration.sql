ALTER TABLE "RouteSchedule"
ADD COLUMN "dayOfWeeks" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN "notificationDayOfWeeks" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

UPDATE "RouteSchedule"
SET
  "dayOfWeeks" = CASE
    WHEN "dayOfWeek" IS NULL THEN ARRAY[0, 1, 2, 3, 4, 5, 6]
    ELSE ARRAY["dayOfWeek"]
  END,
  "notificationDayOfWeeks" = CASE
    WHEN "notificationDayOfWeek" IS NULL THEN ARRAY[0, 1, 2, 3, 4, 5, 6]
    ELSE ARRAY["notificationDayOfWeek"]
  END;

ALTER TABLE "RouteSchedule"
ALTER COLUMN "dayOfWeeks" DROP DEFAULT,
ALTER COLUMN "notificationDayOfWeeks" DROP DEFAULT;

ALTER TABLE "RouteSchedule"
DROP COLUMN "dayOfWeek",
DROP COLUMN "notificationDayOfWeek";

CREATE INDEX "RouteSchedule_notificationDayOfWeeks_idx"
ON "RouteSchedule" USING GIN ("notificationDayOfWeeks");
