-- CreateTable
CREATE TABLE "ExecutiveOperationCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "campaignType" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "strategicGoal" TEXT,
    "executionTempo" TEXT NOT NULL DEFAULT 'normal',
    "targetSystems" JSONB,
    "orchestrationPlan" JSONB,
    "progressScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutiveOperationCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveOperationTask" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerSystem" TEXT,
    "taskType" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "executionMode" TEXT NOT NULL DEFAULT 'semi-autonomous',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "result" JSONB,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutiveOperationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveCommandDecision" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "decisionType" TEXT NOT NULL,
    "rationale" TEXT,
    "impactLevel" TEXT NOT NULL DEFAULT 'medium',
    "executionPlan" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutiveCommandDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveOperationalPulse" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "operationalHealth" INTEGER NOT NULL DEFAULT 75,
    "executionVelocity" INTEGER NOT NULL DEFAULT 70,
    "coordinationScore" INTEGER NOT NULL DEFAULT 70,
    "strategicAlignment" INTEGER NOT NULL DEFAULT 70,
    "riskPressure" INTEGER NOT NULL DEFAULT 40,
    "summary" TEXT,
    "recommendations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutiveOperationalPulse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExecutiveOperationCampaign_campaignType_idx" ON "ExecutiveOperationCampaign"("campaignType");

-- CreateIndex
CREATE INDEX "ExecutiveOperationCampaign_priority_idx" ON "ExecutiveOperationCampaign"("priority");

-- CreateIndex
CREATE INDEX "ExecutiveOperationCampaign_status_idx" ON "ExecutiveOperationCampaign"("status");

-- CreateIndex
CREATE INDEX "ExecutiveOperationCampaign_executionTempo_idx" ON "ExecutiveOperationCampaign"("executionTempo");

-- CreateIndex
CREATE INDEX "ExecutiveOperationCampaign_riskLevel_idx" ON "ExecutiveOperationCampaign"("riskLevel");

-- CreateIndex
CREATE INDEX "ExecutiveOperationTask_campaignId_idx" ON "ExecutiveOperationTask"("campaignId");

-- CreateIndex
CREATE INDEX "ExecutiveOperationTask_ownerSystem_idx" ON "ExecutiveOperationTask"("ownerSystem");

-- CreateIndex
CREATE INDEX "ExecutiveOperationTask_taskType_idx" ON "ExecutiveOperationTask"("taskType");

-- CreateIndex
CREATE INDEX "ExecutiveOperationTask_priority_idx" ON "ExecutiveOperationTask"("priority");

-- CreateIndex
CREATE INDEX "ExecutiveOperationTask_status_idx" ON "ExecutiveOperationTask"("status");

-- CreateIndex
CREATE INDEX "ExecutiveCommandDecision_decisionType_idx" ON "ExecutiveCommandDecision"("decisionType");

-- CreateIndex
CREATE INDEX "ExecutiveCommandDecision_impactLevel_idx" ON "ExecutiveCommandDecision"("impactLevel");

-- CreateIndex
CREATE INDEX "ExecutiveCommandDecision_status_idx" ON "ExecutiveCommandDecision"("status");

-- CreateIndex
CREATE INDEX "ExecutiveOperationalPulse_operationalHealth_idx" ON "ExecutiveOperationalPulse"("operationalHealth");

-- CreateIndex
CREATE INDEX "ExecutiveOperationalPulse_executionVelocity_idx" ON "ExecutiveOperationalPulse"("executionVelocity");

-- CreateIndex
CREATE INDEX "ExecutiveOperationalPulse_coordinationScore_idx" ON "ExecutiveOperationalPulse"("coordinationScore");

-- CreateIndex
CREATE INDEX "ExecutiveOperationalPulse_strategicAlignment_idx" ON "ExecutiveOperationalPulse"("strategicAlignment");
