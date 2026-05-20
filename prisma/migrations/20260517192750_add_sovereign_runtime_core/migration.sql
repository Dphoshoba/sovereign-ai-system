-- CreateTable
CREATE TABLE "SovereignRuntimeSnapshot" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "overallHealth" INTEGER NOT NULL DEFAULT 75,
    "intelligenceScore" INTEGER NOT NULL DEFAULT 75,
    "governanceScore" INTEGER NOT NULL DEFAULT 75,
    "executionScore" INTEGER NOT NULL DEFAULT 75,
    "economicScore" INTEGER NOT NULL DEFAULT 75,
    "futureReadinessScore" INTEGER NOT NULL DEFAULT 75,
    "summary" TEXT,
    "executiveState" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SovereignRuntimeSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SovereignRuntimePriority" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT,
    "title" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "area" TEXT NOT NULL,
    "rationale" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SovereignRuntimePriority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SovereignRuntimeAction" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT,
    "title" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetLayer" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "rationale" TEXT,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SovereignRuntimeAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SovereignIntelligenceRoute" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT,
    "sourceLayer" TEXT NOT NULL,
    "targetLayer" TEXT NOT NULL,
    "routeType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SovereignIntelligenceRoute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SovereignRuntimeSnapshot_status_idx" ON "SovereignRuntimeSnapshot"("status");

-- CreateIndex
CREATE INDEX "SovereignRuntimeSnapshot_overallHealth_idx" ON "SovereignRuntimeSnapshot"("overallHealth");

-- CreateIndex
CREATE INDEX "SovereignRuntimeSnapshot_createdAt_idx" ON "SovereignRuntimeSnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "SovereignRuntimePriority_snapshotId_idx" ON "SovereignRuntimePriority"("snapshotId");

-- CreateIndex
CREATE INDEX "SovereignRuntimePriority_priority_idx" ON "SovereignRuntimePriority"("priority");

-- CreateIndex
CREATE INDEX "SovereignRuntimePriority_area_idx" ON "SovereignRuntimePriority"("area");

-- CreateIndex
CREATE INDEX "SovereignRuntimePriority_status_idx" ON "SovereignRuntimePriority"("status");

-- CreateIndex
CREATE INDEX "SovereignRuntimeAction_snapshotId_idx" ON "SovereignRuntimeAction"("snapshotId");

-- CreateIndex
CREATE INDEX "SovereignRuntimeAction_actionType_idx" ON "SovereignRuntimeAction"("actionType");

-- CreateIndex
CREATE INDEX "SovereignRuntimeAction_targetLayer_idx" ON "SovereignRuntimeAction"("targetLayer");

-- CreateIndex
CREATE INDEX "SovereignRuntimeAction_priority_idx" ON "SovereignRuntimeAction"("priority");

-- CreateIndex
CREATE INDEX "SovereignRuntimeAction_status_idx" ON "SovereignRuntimeAction"("status");

-- CreateIndex
CREATE INDEX "SovereignIntelligenceRoute_sourceLayer_idx" ON "SovereignIntelligenceRoute"("sourceLayer");

-- CreateIndex
CREATE INDEX "SovereignIntelligenceRoute_targetLayer_idx" ON "SovereignIntelligenceRoute"("targetLayer");

-- CreateIndex
CREATE INDEX "SovereignIntelligenceRoute_routeType_idx" ON "SovereignIntelligenceRoute"("routeType");

-- CreateIndex
CREATE INDEX "SovereignIntelligenceRoute_priority_idx" ON "SovereignIntelligenceRoute"("priority");

-- CreateIndex
CREATE INDEX "SovereignIntelligenceRoute_status_idx" ON "SovereignIntelligenceRoute"("status");
