-- CreateTable
CREATE TABLE "InfrastructureHealthCheck" (
    "id" TEXT NOT NULL,
    "systemName" TEXT NOT NULL,
    "systemType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "healthScore" INTEGER NOT NULL DEFAULT 75,
    "latencyMs" INTEGER,
    "message" TEXT,
    "metadata" JSONB,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InfrastructureHealthCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResilienceIncident" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "incidentType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "affectedSystem" TEXT,
    "summary" TEXT,
    "rootCause" TEXT,
    "recoveryPlan" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResilienceIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResiliencePolicy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "policyType" TEXT NOT NULL,
    "targetSystem" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "rules" JSONB,
    "actions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResiliencePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResilienceRetryJob" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "error" TEXT,
    "payload" JSONB,
    "nextRunAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResilienceRetryJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfrastructureEventTrace" (
    "id" TEXT NOT NULL,
    "traceType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "target" TEXT,
    "status" TEXT NOT NULL DEFAULT 'recorded',
    "durationMs" INTEGER,
    "summary" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InfrastructureEventTrace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InfrastructureHealthCheck_systemName_idx" ON "InfrastructureHealthCheck"("systemName");

-- CreateIndex
CREATE INDEX "InfrastructureHealthCheck_systemType_idx" ON "InfrastructureHealthCheck"("systemType");

-- CreateIndex
CREATE INDEX "InfrastructureHealthCheck_status_idx" ON "InfrastructureHealthCheck"("status");

-- CreateIndex
CREATE INDEX "InfrastructureHealthCheck_healthScore_idx" ON "InfrastructureHealthCheck"("healthScore");

-- CreateIndex
CREATE INDEX "InfrastructureHealthCheck_checkedAt_idx" ON "InfrastructureHealthCheck"("checkedAt");

-- CreateIndex
CREATE INDEX "ResilienceIncident_incidentType_idx" ON "ResilienceIncident"("incidentType");

-- CreateIndex
CREATE INDEX "ResilienceIncident_severity_idx" ON "ResilienceIncident"("severity");

-- CreateIndex
CREATE INDEX "ResilienceIncident_status_idx" ON "ResilienceIncident"("status");

-- CreateIndex
CREATE INDEX "ResilienceIncident_affectedSystem_idx" ON "ResilienceIncident"("affectedSystem");

-- CreateIndex
CREATE INDEX "ResiliencePolicy_policyType_idx" ON "ResiliencePolicy"("policyType");

-- CreateIndex
CREATE INDEX "ResiliencePolicy_targetSystem_idx" ON "ResiliencePolicy"("targetSystem");

-- CreateIndex
CREATE INDEX "ResiliencePolicy_enabled_idx" ON "ResiliencePolicy"("enabled");

-- CreateIndex
CREATE INDEX "ResiliencePolicy_severity_idx" ON "ResiliencePolicy"("severity");

-- CreateIndex
CREATE INDEX "ResilienceRetryJob_source_idx" ON "ResilienceRetryJob"("source");

-- CreateIndex
CREATE INDEX "ResilienceRetryJob_status_idx" ON "ResilienceRetryJob"("status");

-- CreateIndex
CREATE INDEX "ResilienceRetryJob_priority_idx" ON "ResilienceRetryJob"("priority");

-- CreateIndex
CREATE INDEX "ResilienceRetryJob_nextRunAt_idx" ON "ResilienceRetryJob"("nextRunAt");

-- CreateIndex
CREATE INDEX "InfrastructureEventTrace_traceType_idx" ON "InfrastructureEventTrace"("traceType");

-- CreateIndex
CREATE INDEX "InfrastructureEventTrace_source_idx" ON "InfrastructureEventTrace"("source");

-- CreateIndex
CREATE INDEX "InfrastructureEventTrace_target_idx" ON "InfrastructureEventTrace"("target");

-- CreateIndex
CREATE INDEX "InfrastructureEventTrace_status_idx" ON "InfrastructureEventTrace"("status");

-- CreateIndex
CREATE INDEX "InfrastructureEventTrace_createdAt_idx" ON "InfrastructureEventTrace"("createdAt");
