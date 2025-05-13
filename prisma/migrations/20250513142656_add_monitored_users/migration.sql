-- CreateTable
CREATE TABLE "MonitoredUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "suspiciousActions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoredUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonitoredUser_userId_key" ON "MonitoredUser"("userId");

-- CreateIndex
CREATE INDEX "MonitoredUser_userId_idx" ON "MonitoredUser"("userId");

-- CreateIndex
CREATE INDEX "MonitoredUser_createdAt_idx" ON "MonitoredUser"("createdAt");
