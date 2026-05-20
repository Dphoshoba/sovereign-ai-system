-- CreateTable
CREATE TABLE "ReasoningSimulationRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "workspaceId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "reasoningType" TEXT NOT NULL DEFAULT 'strategic-decision',
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "strategicScore" INTEGER NOT NULL DEFAULT 75,
    "riskScore" INTEGER NOT NULL DEFAULT 40,
    "opportunityScore" INTEGER NOT NULL DEFAULT 75,
    "summary" TEXT,
    "question" TEXT,
    "reasoningTrace" JSONB,
    "findings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningSimulationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicDecisionOption" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "title" TEXT NOT NULL,
    "optionType" TEXT NOT NULL DEFAULT 'strategy',
    "description" TEXT,
    "upside" TEXT,
    "downside" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "strategicValue" INTEGER NOT NULL DEFAULT 70,
    "costPressure" INTEGER NOT NULL DEFAULT 40,
    "timeHorizon" TEXT NOT NULL DEFAULT 'near-term',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategicDecisionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionConsequenceModel" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "optionId" TEXT,
    "title" TEXT NOT NULL,
    "consequenceType" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "impactLevel" TEXT NOT NULL DEFAULT 'medium',
    "description" TEXT,
    "mitigation" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionConsequenceModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningRecommendation" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "title" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "rationale" TEXT,
    "expectedOutcome" TEXT,
    "requiredApproval" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReasoningRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReasoningSimulationRun_organizationId_idx" ON "ReasoningSimulationRun"("organizationId");

-- CreateIndex
CREATE INDEX "ReasoningSimulationRun_workspaceId_idx" ON "ReasoningSimulationRun"("workspaceId");

-- CreateIndex
CREATE INDEX "ReasoningSimulationRun_status_idx" ON "ReasoningSimulationRun"("status");

-- CreateIndex
CREATE INDEX "ReasoningSimulationRun_reasoningType_idx" ON "ReasoningSimulationRun"("reasoningType");

-- CreateIndex
CREATE INDEX "ReasoningSimulationRun_strategicScore_idx" ON "ReasoningSimulationRun"("strategicScore");

-- CreateIndex
CREATE INDEX "ReasoningSimulationRun_riskScore_idx" ON "ReasoningSimulationRun"("riskScore");

-- CreateIndex
CREATE INDEX "StrategicDecisionOption_runId_idx" ON "StrategicDecisionOption"("runId");

-- CreateIndex
CREATE INDEX "StrategicDecisionOption_optionType_idx" ON "StrategicDecisionOption"("optionType");

-- CreateIndex
CREATE INDEX "StrategicDecisionOption_riskLevel_idx" ON "StrategicDecisionOption"("riskLevel");

-- CreateIndex
CREATE INDEX "StrategicDecisionOption_strategicValue_idx" ON "StrategicDecisionOption"("strategicValue");

-- CreateIndex
CREATE INDEX "StrategicDecisionOption_timeHorizon_idx" ON "StrategicDecisionOption"("timeHorizon");

-- CreateIndex
CREATE INDEX "DecisionConsequenceModel_runId_idx" ON "DecisionConsequenceModel"("runId");

-- CreateIndex
CREATE INDEX "DecisionConsequenceModel_optionId_idx" ON "DecisionConsequenceModel"("optionId");

-- CreateIndex
CREATE INDEX "DecisionConsequenceModel_consequenceType_idx" ON "DecisionConsequenceModel"("consequenceType");

-- CreateIndex
CREATE INDEX "DecisionConsequenceModel_impactLevel_idx" ON "DecisionConsequenceModel"("impactLevel");

-- CreateIndex
CREATE INDEX "ReasoningRecommendation_runId_idx" ON "ReasoningRecommendation"("runId");

-- CreateIndex
CREATE INDEX "ReasoningRecommendation_recommendationType_idx" ON "ReasoningRecommendation"("recommendationType");

-- CreateIndex
CREATE INDEX "ReasoningRecommendation_priority_idx" ON "ReasoningRecommendation"("priority");

-- CreateIndex
CREATE INDEX "ReasoningRecommendation_requiredApproval_idx" ON "ReasoningRecommendation"("requiredApproval");

-- CreateIndex
CREATE INDEX "ReasoningRecommendation_status_idx" ON "ReasoningRecommendation"("status");
