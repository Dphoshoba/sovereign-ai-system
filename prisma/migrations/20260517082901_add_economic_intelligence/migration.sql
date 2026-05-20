-- CreateTable
CREATE TABLE "EconomicIntelligenceRun" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "revenueHealth" INTEGER NOT NULL DEFAULT 70,
    "opportunityScore" INTEGER NOT NULL DEFAULT 70,
    "riskPressure" INTEGER NOT NULL DEFAULT 40,
    "summary" TEXT,
    "findings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EconomicIntelligenceRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueOpportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "opportunityType" TEXT NOT NULL,
    "estimatedValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'identified',
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "targetSystem" TEXT,
    "executionPath" JSONB,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EconomicCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "campaignType" TEXT NOT NULL,
    "revenueGoal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "targetAudience" TEXT,
    "strategy" JSONB,
    "progressScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EconomicCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EconomicDecision" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "decisionType" TEXT NOT NULL,
    "rationale" TEXT,
    "expectedImpact" TEXT,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EconomicDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EconomicIntelligenceRun_status_idx" ON "EconomicIntelligenceRun"("status");

-- CreateIndex
CREATE INDEX "EconomicIntelligenceRun_revenueHealth_idx" ON "EconomicIntelligenceRun"("revenueHealth");

-- CreateIndex
CREATE INDEX "EconomicIntelligenceRun_opportunityScore_idx" ON "EconomicIntelligenceRun"("opportunityScore");

-- CreateIndex
CREATE INDEX "EconomicIntelligenceRun_riskPressure_idx" ON "EconomicIntelligenceRun"("riskPressure");

-- CreateIndex
CREATE INDEX "EconomicIntelligenceRun_createdAt_idx" ON "EconomicIntelligenceRun"("createdAt");

-- CreateIndex
CREATE INDEX "RevenueOpportunity_opportunityType_idx" ON "RevenueOpportunity"("opportunityType");

-- CreateIndex
CREATE INDEX "RevenueOpportunity_priority_idx" ON "RevenueOpportunity"("priority");

-- CreateIndex
CREATE INDEX "RevenueOpportunity_status_idx" ON "RevenueOpportunity"("status");

-- CreateIndex
CREATE INDEX "RevenueOpportunity_riskLevel_idx" ON "RevenueOpportunity"("riskLevel");

-- CreateIndex
CREATE INDEX "RevenueOpportunity_targetSystem_idx" ON "RevenueOpportunity"("targetSystem");

-- CreateIndex
CREATE INDEX "EconomicCampaign_campaignType_idx" ON "EconomicCampaign"("campaignType");

-- CreateIndex
CREATE INDEX "EconomicCampaign_priority_idx" ON "EconomicCampaign"("priority");

-- CreateIndex
CREATE INDEX "EconomicCampaign_status_idx" ON "EconomicCampaign"("status");

-- CreateIndex
CREATE INDEX "EconomicCampaign_riskLevel_idx" ON "EconomicCampaign"("riskLevel");

-- CreateIndex
CREATE INDEX "EconomicDecision_decisionType_idx" ON "EconomicDecision"("decisionType");

-- CreateIndex
CREATE INDEX "EconomicDecision_status_idx" ON "EconomicDecision"("status");

-- CreateIndex
CREATE INDEX "EconomicDecision_priority_idx" ON "EconomicDecision"("priority");
