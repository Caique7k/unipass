-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('GO', 'BACK', 'SHIFT');

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteSchedule" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "busId" TEXT,
    "type" "ScheduleType" NOT NULL,
    "title" TEXT,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "dayOfWeek" INTEGER,
    "notifyBeforeMinutes" INTEGER NOT NULL DEFAULT 30,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RouteSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentRoute" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,

    CONSTRAINT "StudentRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleConfirmation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "willGo" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Route_companyId_idx" ON "Route"("companyId");

-- CreateIndex
CREATE INDEX "RouteSchedule_departureTime_idx" ON "RouteSchedule"("departureTime");

-- CreateIndex
CREATE INDEX "RouteSchedule_routeId_idx" ON "RouteSchedule"("routeId");

-- CreateIndex
CREATE INDEX "StudentRoute_routeId_idx" ON "StudentRoute"("routeId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentRoute_studentId_routeId_key" ON "StudentRoute"("studentId", "routeId");

-- CreateIndex
CREATE INDEX "ScheduleConfirmation_scheduleId_idx" ON "ScheduleConfirmation"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleConfirmation_userId_scheduleId_key" ON "ScheduleConfirmation"("userId", "scheduleId");

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteSchedule" ADD CONSTRAINT "RouteSchedule_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteSchedule" ADD CONSTRAINT "RouteSchedule_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRoute" ADD CONSTRAINT "StudentRoute_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRoute" ADD CONSTRAINT "StudentRoute_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleConfirmation" ADD CONSTRAINT "ScheduleConfirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleConfirmation" ADD CONSTRAINT "ScheduleConfirmation_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "RouteSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
