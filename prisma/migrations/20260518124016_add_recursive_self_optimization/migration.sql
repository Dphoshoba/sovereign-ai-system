-- CreateTable
CREATE TABLE "EvolutionOptimizationRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "workspaceId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "optimizationHealth" INTEGER NOT NULL DEFAULT 75,
    "adaptationScore" INTEGER NOT NULL DEFAULT 75,
    "institutionalMaturity" INTEGER NOT NULL DEFAULT 45,
    "executionEfficiency" INTEGER NOT NULL DEFAULT 60,
    "governanceAlignment" INTEGER NOT NULL DEFAULT 70,
    "summary" TEXT,
    "findings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvolutionOptimizationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvolutionImprovementProposal" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "proposalType" TEXT NOT NULL,
    "targetLayer" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "expectedImpact" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "optimizationValue" INTEGER NOT NULL DEFAULT 70,
    "implementationEffort" INTEGER NOT NULL DEFAULT 45,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvolutionImprovementProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentPerformanceProfile" (
    "id" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "agentRole" TEXT NOT NULL,
    "coordinationScore" INTEGER NOT NULL DEFAULT 70,
    "reliabilityScore" INTEGER NOT NULL DEFAULT 70,
    "executionScore" INTEGER NOT NULL DEFAULT 70,
    "governanceScore" INTEGER NOT NULL DEFAULT 70,
    "adaptationScore" INTEGER NOT NULL DEFAULT 70,
    "strengths" JSONB,
    "weaknesses" JSONB,
    "recommendations" JSONB,
    "lastEvaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentPerformanceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowEvolutionPattern" (
    "id" TEXT NOT NULL,
    "workflowName" TEXT NOT NULL,
    "workflowType" TEXT NOT NULL,
    "bottleneckRisk" INTEGER NOT NULL DEFAULT 40,
    "efficiencyScore" INTEGER NOT NULL DEFAULT 65,
    "automationPotential" INTEGER NOT NULL DEFAULT 75,
    "governancePressure" INTEGER NOT NULL DEFAULT 35,
    "optimizationSuggestion" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowEvolutionPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionalEvolutionMemory" (
    "id" TEXT NOT NULL,
    "evolutionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "improvementDelta" INTEGER NOT NULL DEFAULT 0,
    "impactArea" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionalEvolutionMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EvolutionOptimizationRun_organizationId_idx" ON "EvolutionOptimizationRun"("organizationId");

-- CreateIndex
CREATE INDEX "EvolutionOptimizationRun_workspaceId_idx" ON "EvolutionOptimizationRun"("workspaceId");

-- CreateIndex
CREATE INDEX "EvolutionOptimizationRun_status_idx" ON "EvolutionOptimizationRun"("status");

-- CreateIndex
CREATE INDEX "EvolutionOptimizationRun_adaptationScore_idx" ON "EvolutionOptimizationRun"("adaptationScore");

-- CreateIndex
CREATE INDEX "EvolutionOptimizationRun_institutionalMaturity_idx" ON "EvolutionOptimizationRun"("institutionalMaturity");

-- CreateIndex
CREATE INDEX "EvolutionImprovementProposal_runId_idx" ON "EvolutionImprovementProposal"("runId");

-- CreateIndex
CREATE INDEX "EvolutionImprovementProposal_proposalType_idx" ON "EvolutionImprovementProposal"("proposalType");

-- CreateIndex
CREATE INDEX "EvolutionImprovementProposal_targetLayer_idx" ON "EvolutionImprovementProposal"("targetLayer");

-- CreateIndex
CREATE INDEX "EvolutionImprovementProposal_riskLevel_idx" ON "EvolutionImprovementProposal"("riskLevel");

-- CreateIndex
CREATE INDEX "EvolutionImprovementProposal_status_idx" ON "EvolutionImprovementProposal"("status");

-- CreateIndex
CREATE INDEX "AgentPerformanceProfile_agentName_idx" ON "AgentPerformanceProfile"("agentName");

-- CreateIndex
CREATE INDEX "AgentPerformanceProfile_agentRole_idx" ON "AgentPerformanceProfile"("agentRole");

-- CreateIndex
CREATE INDEX "AgentPerformanceProfile_executionScore_idx" ON "AgentPerformanceProfile"("executionScore");

-- CreateIndex
CREATE INDEX "AgentPerformanceProfile_governanceScore_idx" ON "AgentPerformanceProfile"("governanceScore");

-- CreateIndex
CREATE INDEX "WorkflowEvolutionPattern_workflowName_idx" ON "WorkflowEvolutionPattern"("workflowName");

-- CreateIndex
CREATE INDEX "WorkflowEvolutionPattern_workflowType_idx" ON "WorkflowEvolutionPattern"("workflowType");

-- CreateIndex
CREATE INDEX "WorkflowEvolutionPattern_efficiencyScore_idx" ON "WorkflowEvolutionPattern"("efficiencyScore");

-- CreateIndex
CREATE INDEX "WorkflowEvolutionPattern_automationPotential_idx" ON "WorkflowEvolutionPattern"("automationPotential");

-- CreateIndex
CREATE INDEX "InstitutionalEvolutionMemory_evolutionType_idx" ON "InstitutionalEvolutionMemory"("evolutionType");

-- CreateIndex
CREATE INDEX "InstitutionalEvolutionMemory_impactArea_idx" ON "InstitutionalEvolutionMemory"("impactArea");

-- CreateIndex
CREATE INDEX "InstitutionalEvolutionMemory_improvementDelta_idx" ON "InstitutionalEvolutionMemory"("improvementDelta");
