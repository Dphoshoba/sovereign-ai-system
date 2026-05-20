-- CreateTable
CREATE TABLE "ExternalIntegration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not-configured',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "lastChecked" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalOperationLog" (
    "id" TEXT NOT NULL,
    "integration" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "title" TEXT NOT NULL,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalOperationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalIntegration_name_key" ON "ExternalIntegration"("name");

-- CreateIndex
CREATE INDEX "ExternalIntegration_provider_idx" ON "ExternalIntegration"("provider");

-- CreateIndex
CREATE INDEX "ExternalIntegration_category_idx" ON "ExternalIntegration"("category");

-- CreateIndex
CREATE INDEX "ExternalIntegration_status_idx" ON "ExternalIntegration"("status");

-- CreateIndex
CREATE INDEX "ExternalIntegration_enabled_idx" ON "ExternalIntegration"("enabled");

-- CreateIndex
CREATE INDEX "ExternalOperationLog_integration_idx" ON "ExternalOperationLog"("integration");

-- CreateIndex
CREATE INDEX "ExternalOperationLog_operationType_idx" ON "ExternalOperationLog"("operationType");

-- CreateIndex
CREATE INDEX "ExternalOperationLog_status_idx" ON "ExternalOperationLog"("status");

-- CreateIndex
CREATE INDEX "ExternalOperationLog_createdAt_idx" ON "ExternalOperationLog"("createdAt");
