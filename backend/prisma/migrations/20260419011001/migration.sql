-- DropIndex
DROP INDEX "RouteSchedule_notificationDayOfWeeks_idx";

-- CreateIndex
CREATE INDEX "RouteSchedule_active_notificationTimeMinutes_idx" ON "RouteSchedule"("active", "notificationTimeMinutes");
