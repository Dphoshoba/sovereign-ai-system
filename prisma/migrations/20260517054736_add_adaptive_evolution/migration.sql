-- CreateTable
CREATE TABLE "EvolutionRun" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "summary" TEXT,
    "maturityScore" INTEGER NOT NULL DEFAULT 70,
    "findings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvolutionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvolutionInsight" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "insight" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "targetSystem" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "evidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvolutionInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvolutionPolicyRecommendation" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "title" TEXT NOT NULL,
    "policyArea" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvolutionPolicyRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EvolutionRun_status_idx" ON "EvolutionRun"("status");

-- CreateIndex
CREATE INDEX "EvolutionRun_maturityScore_idx" ON "EvolutionRun"("maturityScore");

-- CreateIndex
CREATE INDEX "EvolutionRun_createdAt_idx" ON "EvolutionRun"("createdAt");

-- CreateIndex
CREATE INDEX "EvolutionInsight_runId_idx" ON "EvolutionInsight"("runId");

-- CreateIndex
CREATE INDEX "EvolutionInsight_type_idx" ON "EvolutionInsight"("type");

-- CreateIndex
CREATE INDEX "EvolutionInsight_priority_idx" ON "EvolutionInsight"("priority");

-- CreateIndex
CREATE INDEX "EvolutionInsight_targetSystem_idx" ON "EvolutionInsight"("targetSystem");

-- CreateIndex
CREATE INDEX "EvolutionInsight_status_idx" ON "EvolutionInsight"("status");

-- CreateIndex
CREATE INDEX "EvolutionPolicyRecommendation_runId_idx" ON "EvolutionPolicyRecommendation"("runId");

-- CreateIndex
CREATE INDEX "EvolutionPolicyRecommendation_policyArea_idx" ON "EvolutionPolicyRecommendation"("policyArea");

-- CreateIndex
CREATE INDEX "EvolutionPolicyRecommendation_priority_idx" ON "EvolutionPolicyRecommendation"("priority");

-- CreateIndex
CREATE INDEX "EvolutionPolicyRecommendation_status_idx" ON "EvolutionPolicyRecommendation"("status");
