-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLATFORM_ADMIN', 'ADMIN', 'DRIVER', 'USER', 'COORDINATOR');

-- CreateEnum
CREATE TYPE "CompanyPlan" AS ENUM ('ESSENTIAL', 'GROWTH', 'SCALE');

-- CreateEnum
CREATE TYPE "BillingGatewayMode" AS ENUM ('EXTERNAL', 'PLATFORM_GATEWAY');

-- CreateEnum
CREATE TYPE "BillingOnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'ACTIVE', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BillingTargetScope" AS ENUM ('STUDENTS', 'COORDINATORS', 'STUDENTS_AND_COORDINATORS');

-- CreateEnum
CREATE TYPE "BillingChargeStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ISSUED', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "BillingEventSource" AS ENUM ('SYSTEM', 'WEBHOOK', 'MANUAL');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('BOARDING', 'DEBOARDING', 'LEAVING', 'DENIED');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('ACTIVE', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('GO', 'BACK', 'SHIFT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationPromptStatus" AS ENUM ('PENDING', 'DISPATCHED', 'ANSWERED', 'EXPIRED', 'FAILED');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "emailDomain" TEXT NOT NULL,
    "plan" "CompanyPlan" NOT NULL DEFAULT 'ESSENTIAL',
    "requestedPlan" "CompanyPlan",
    "planChangeRequestedAt" TIMESTAMP(3),
    "planChangeRequestedByName" TEXT,
    "planChangeRequestedByEmail" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "smsVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "studentId" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bus" (
    "id" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "email" TEXT,
    "phone" TEXT,
    "companyId" TEXT NOT NULL,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameNormalized" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "hardwareId" TEXT NOT NULL,
    "pairingCode" TEXT,
    "pairingCodeExpiresAt" TIMESTAMP(3),
    "pairedAt" TIMESTAMP(3),
    "code" TEXT,
    "secret" TEXT,
    "name" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT,
    "busId" TEXT,
    "lastLat" DOUBLE PRECISION,
    "lastLng" DOUBLE PRECISION,
    "lastUpdate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfidCard" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "studentId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RfidCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportEvent" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT,
    "rfidCardId" TEXT,
    "deviceId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tripId" TEXT,

    CONSTRAINT "TransportEvent_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
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
    "departureMinutes" INTEGER NOT NULL,
    "dayOfWeeks" INTEGER[],
    "notifyBeforeMinutes" INTEGER NOT NULL DEFAULT 30,
    "notificationTimeMinutes" INTEGER NOT NULL,
    "notificationDayOfWeeks" INTEGER[],
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
    "occurrenceKey" TEXT NOT NULL,
    "willGo" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleConfirmation_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "CompanyBillingSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "gatewayMode" "BillingGatewayMode" NOT NULL DEFAULT 'EXTERNAL',
    "onboardingStatus" "BillingOnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "gatewayContactName" TEXT,
    "gatewayContactEmail" TEXT,
    "gatewayContactPhone" TEXT,
    "legalEntityName" TEXT,
    "legalDocument" TEXT,
    "bankInfoSummary" TEXT,
    "defaultAmountCents" INTEGER,
    "defaultDueDay" INTEGER,
    "lgpdAcceptedAt" TIMESTAMP(3),
    "platformTermsAcceptedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "asaasAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyBillingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "targetScope" "BillingTargetScope" NOT NULL DEFAULT 'STUDENTS',
    "amountCents" INTEGER NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "notifyOnGeneration" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingCustomer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "studentId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "document" TEXT,
    "phone" TEXT,
    "asaasCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingCharge" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "templateId" TEXT,
    "ownerUserId" TEXT,
    "studentId" TEXT,
    "customerId" TEXT,
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "recipientDocument" TEXT,
    "description" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "BillingChargeStatus" NOT NULL DEFAULT 'DRAFT',
    "gatewayChargeId" TEXT,
    "externalReference" TEXT,
    "bankSlipUrl" TEXT,
    "gatewayInvoiceUrl" TEXT,
    "gatewayStatus" TEXT,
    "gatewayStatusUpdatedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingEventLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "chargeId" TEXT,
    "customerId" TEXT,
    "eventType" TEXT NOT NULL,
    "source" "BillingEventSource" NOT NULL DEFAULT 'SYSTEM',
    "gatewayEvent" TEXT,
    "deduplicationKey" TEXT,
    "payload" JSONB,
    "metadata" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_cnpj_key" ON "Company"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Company_emailDomain_key" ON "Company"("emailDomain");

-- CreateIndex
CREATE INDEX "Company_requestedPlan_planChangeRequestedAt_idx" ON "Company"("requestedPlan", "planChangeRequestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_studentId_key" ON "User"("studentId");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "Bus_companyId_idx" ON "Bus"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Bus_plate_companyId_key" ON "Bus"("plate", "companyId");

-- CreateIndex
CREATE INDEX "Student_companyId_idx" ON "Student"("companyId");

-- CreateIndex
CREATE INDEX "Student_groupId_idx" ON "Student"("groupId");

-- CreateIndex
CREATE INDEX "Student_companyId_createdAt_idx" ON "Student"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Student_registration_companyId_key" ON "Student"("registration", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_companyId_email_key" ON "Student"("companyId", "email");

-- CreateIndex
CREATE INDEX "Group_companyId_active_createdAt_idx" ON "Group"("companyId", "active", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Group_companyId_nameNormalized_key" ON "Group"("companyId", "nameNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "Device_hardwareId_key" ON "Device"("hardwareId");

-- CreateIndex
CREATE UNIQUE INDEX "Device_pairingCode_key" ON "Device"("pairingCode");

-- CreateIndex
CREATE UNIQUE INDEX "Device_code_key" ON "Device"("code");

-- CreateIndex
CREATE INDEX "Device_companyId_idx" ON "Device"("companyId");

-- CreateIndex
CREATE INDEX "Device_busId_idx" ON "Device"("busId");

-- CreateIndex
CREATE UNIQUE INDEX "RfidCard_tag_key" ON "RfidCard"("tag");

-- CreateIndex
CREATE INDEX "RfidCard_companyId_idx" ON "RfidCard"("companyId");

-- CreateIndex
CREATE INDEX "TransportEvent_companyId_idx" ON "TransportEvent"("companyId");

-- CreateIndex
CREATE INDEX "TransportEvent_studentId_idx" ON "TransportEvent"("studentId");

-- CreateIndex
CREATE INDEX "TransportEvent_deviceId_idx" ON "TransportEvent"("deviceId");

-- CreateIndex
CREATE INDEX "TransportEvent_companyId_createdAt_idx" ON "TransportEvent"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "Trip_companyId_idx" ON "Trip"("companyId");

-- CreateIndex
CREATE INDEX "Route_companyId_idx" ON "Route"("companyId");

-- CreateIndex
CREATE INDEX "RouteSchedule_departureTime_idx" ON "RouteSchedule"("departureTime");

-- CreateIndex
CREATE INDEX "RouteSchedule_routeId_idx" ON "RouteSchedule"("routeId");

-- CreateIndex
CREATE INDEX "RouteSchedule_active_notificationTimeMinutes_idx" ON "RouteSchedule"("active", "notificationTimeMinutes");

-- CreateIndex
CREATE INDEX "StudentRoute_routeId_idx" ON "StudentRoute"("routeId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentRoute_studentId_routeId_key" ON "StudentRoute"("studentId", "routeId");

-- CreateIndex
CREATE INDEX "ScheduleConfirmation_scheduleId_idx" ON "ScheduleConfirmation"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleConfirmation_userId_scheduleId_occurrenceKey_key" ON "ScheduleConfirmation"("userId", "scheduleId", "occurrenceKey");

-- CreateIndex
CREATE INDEX "NotificationPrompt_userId_status_createdAt_idx" ON "NotificationPrompt"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationPrompt_scheduleId_occurrenceKey_idx" ON "NotificationPrompt"("scheduleId", "occurrenceKey");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPrompt_userId_scheduleId_occurrenceKey_key" ON "NotificationPrompt"("userId", "scheduleId", "occurrenceKey");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyBillingSettings_companyId_key" ON "CompanyBillingSettings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyBillingSettings_asaasAccountId_key" ON "CompanyBillingSettings"("asaasAccountId");

-- CreateIndex
CREATE INDEX "CompanyBillingSettings_gatewayMode_onboardingStatus_idx" ON "CompanyBillingSettings"("gatewayMode", "onboardingStatus");

-- CreateIndex
CREATE INDEX "BillingTemplate_companyId_active_createdAt_idx" ON "BillingTemplate"("companyId", "active", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BillingCustomer_asaasCustomerId_key" ON "BillingCustomer"("asaasCustomerId");

-- CreateIndex
CREATE INDEX "BillingCustomer_companyId_createdAt_idx" ON "BillingCustomer"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "BillingCustomer_studentId_idx" ON "BillingCustomer"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingCharge_gatewayChargeId_key" ON "BillingCharge"("gatewayChargeId");

-- CreateIndex
CREATE INDEX "BillingCharge_companyId_status_dueDate_idx" ON "BillingCharge"("companyId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "BillingCharge_ownerUserId_status_dueDate_idx" ON "BillingCharge"("ownerUserId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "BillingCharge_studentId_dueDate_idx" ON "BillingCharge"("studentId", "dueDate");

-- CreateIndex
CREATE INDEX "BillingCharge_customerId_dueDate_idx" ON "BillingCharge"("customerId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "BillingCharge_companyId_externalReference_key" ON "BillingCharge"("companyId", "externalReference");

-- CreateIndex
CREATE UNIQUE INDEX "BillingEventLog_deduplicationKey_key" ON "BillingEventLog"("deduplicationKey");

-- CreateIndex
CREATE INDEX "BillingEventLog_companyId_createdAt_idx" ON "BillingEventLog"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "BillingEventLog_chargeId_createdAt_idx" ON "BillingEventLog"("chargeId", "createdAt");

-- CreateIndex
CREATE INDEX "BillingEventLog_customerId_createdAt_idx" ON "BillingEventLog"("customerId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bus" ADD CONSTRAINT "Bus_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfidCard" ADD CONSTRAINT "RfidCard_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfidCard" ADD CONSTRAINT "RfidCard_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportEvent" ADD CONSTRAINT "TransportEvent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportEvent" ADD CONSTRAINT "TransportEvent_rfidCardId_fkey" FOREIGN KEY ("rfidCardId") REFERENCES "RfidCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportEvent" ADD CONSTRAINT "TransportEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportEvent" ADD CONSTRAINT "TransportEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportEvent" ADD CONSTRAINT "TransportEvent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "NotificationPrompt" ADD CONSTRAINT "NotificationPrompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPrompt" ADD CONSTRAINT "NotificationPrompt_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "RouteSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyBillingSettings" ADD CONSTRAINT "CompanyBillingSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingTemplate" ADD CONSTRAINT "BillingTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCustomer" ADD CONSTRAINT "BillingCustomer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCustomer" ADD CONSTRAINT "BillingCustomer_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCharge" ADD CONSTRAINT "BillingCharge_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCharge" ADD CONSTRAINT "BillingCharge_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "BillingTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCharge" ADD CONSTRAINT "BillingCharge_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCharge" ADD CONSTRAINT "BillingCharge_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCharge" ADD CONSTRAINT "BillingCharge_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "BillingCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEventLog" ADD CONSTRAINT "BillingEventLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEventLog" ADD CONSTRAINT "BillingEventLog_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "BillingCharge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEventLog" ADD CONSTRAINT "BillingEventLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "BillingCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
