-- CreateTable
CREATE TABLE "RuntimeObjective" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'active',
    "cadence" TEXT NOT NULL DEFAULT 'manual',
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuntimeObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuntimeHeartbeat" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'alive',
    "summary" TEXT,
    "healthScore" INTEGER NOT NULL DEFAULT 80,
    "metrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuntimeHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuntimeMemorySnapshot" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuntimeMemorySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuntimeRetryQueue" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "payload" JSONB,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuntimeRetryQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RuntimeObjective_status_idx" ON "RuntimeObjective"("status");

-- CreateIndex
CREATE INDEX "RuntimeObjective_priority_idx" ON "RuntimeObjective"("priority");

-- CreateIndex
CREATE INDEX "RuntimeObjective_cadence_idx" ON "RuntimeObjective"("cadence");

-- CreateIndex
CREATE INDEX "RuntimeObjective_nextRunAt_idx" ON "RuntimeObjective"("nextRunAt");

-- CreateIndex
CREATE INDEX "RuntimeHeartbeat_status_idx" ON "RuntimeHeartbeat"("status");

-- CreateIndex
CREATE INDEX "RuntimeHeartbeat_healthScore_idx" ON "RuntimeHeartbeat"("healthScore");

-- CreateIndex
CREATE INDEX "RuntimeHeartbeat_createdAt_idx" ON "RuntimeHeartbeat"("createdAt");

-- CreateIndex
CREATE INDEX "RuntimeMemorySnapshot_createdAt_idx" ON "RuntimeMemorySnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "RuntimeRetryQueue_source_idx" ON "RuntimeRetryQueue"("source");

-- CreateIndex
CREATE INDEX "RuntimeRetryQueue_status_idx" ON "RuntimeRetryQueue"("status");

-- CreateIndex
CREATE INDEX "RuntimeRetryQueue_nextRetryAt_idx" ON "RuntimeRetryQueue"("nextRetryAt");
