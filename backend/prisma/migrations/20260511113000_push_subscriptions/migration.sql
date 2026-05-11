CREATE TYPE "PushNotificationProvider" AS ENUM ('EXPO', 'FCM', 'APNS');

CREATE TYPE "PushPlatform" AS ENUM ('IOS', 'ANDROID', 'WEB', 'UNKNOWN');

CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "PushNotificationProvider" NOT NULL,
    "platform" "PushPlatform" NOT NULL DEFAULT 'UNKNOWN',
    "token" TEXT NOT NULL,
    "installationKey" TEXT,
    "deviceName" TEXT,
    "appVersion" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushSubscription_provider_token_key" ON "PushSubscription"("provider", "token");
CREATE UNIQUE INDEX "PushSubscription_provider_installationKey_key" ON "PushSubscription"("provider", "installationKey");
CREATE INDEX "PushSubscription_userId_active_updatedAt_idx" ON "PushSubscription"("userId", "active", "updatedAt");

ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
