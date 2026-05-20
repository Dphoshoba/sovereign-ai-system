-- CreateTable
CREATE TABLE "StrategicPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "timeHorizon" TEXT NOT NULL DEFAULT '90-days',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "strategicThesis" TEXT,
    "priorities" JSONB,
    "initiatives" JSONB,
    "resourcePlan" JSONB,
    "riskMap" JSONB,
    "successMetrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategicPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicInitiative" (
    "id" TEXT NOT NULL,
    "planId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "ownerSystem" TEXT,
    "targetOutcome" TEXT,
    "executionPath" JSONB,
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategicInitiative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicDecisionLog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "rationale" TEXT,
    "status" TEXT NOT NULL DEFAULT 'recorded',
    "impactArea" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategicDecisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StrategicPlan_timeHorizon_idx" ON "StrategicPlan"("timeHorizon");

-- CreateIndex
CREATE INDEX "StrategicPlan_status_idx" ON "StrategicPlan"("status");

-- CreateIndex
CREATE INDEX "StrategicPlan_createdAt_idx" ON "StrategicPlan"("createdAt");

-- CreateIndex
CREATE INDEX "StrategicInitiative_planId_idx" ON "StrategicInitiative"("planId");

-- CreateIndex
CREATE INDEX "StrategicInitiative_priority_idx" ON "StrategicInitiative"("priority");

-- CreateIndex
CREATE INDEX "StrategicInitiative_status_idx" ON "StrategicInitiative"("status");

-- CreateIndex
CREATE INDEX "StrategicInitiative_ownerSystem_idx" ON "StrategicInitiative"("ownerSystem");

-- CreateIndex
CREATE INDEX "StrategicInitiative_riskLevel_idx" ON "StrategicInitiative"("riskLevel");

-- CreateIndex
CREATE INDEX "StrategicDecisionLog_status_idx" ON "StrategicDecisionLog"("status");

-- CreateIndex
CREATE INDEX "StrategicDecisionLog_impactArea_idx" ON "StrategicDecisionLog"("impactArea");

-- CreateIndex
CREATE INDEX "StrategicDecisionLog_createdAt_idx" ON "StrategicDecisionLog"("createdAt");
