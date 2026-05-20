-- CreateTable
CREATE TABLE "WorldModelRun" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "horizon" TEXT NOT NULL DEFAULT '12-months',
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.65,
    "stabilityIndex" INTEGER NOT NULL DEFAULT 70,
    "opportunityIndex" INTEGER NOT NULL DEFAULT 70,
    "riskIndex" INTEGER NOT NULL DEFAULT 45,
    "summary" TEXT,
    "assumptions" JSONB,
    "findings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorldModelRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanetarySignal" (
    "id" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "relevanceScore" INTEGER NOT NULL DEFAULT 50,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.65,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanetarySignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CivilizationScenario" (
    "id" TEXT NOT NULL,
    "worldModelRunId" TEXT,
    "title" TEXT NOT NULL,
    "scenarioType" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "impactLevel" TEXT NOT NULL DEFAULT 'medium',
    "narrative" TEXT,
    "economicImpact" TEXT,
    "technologyImpact" TEXT,
    "socialImpact" TEXT,
    "governanceImpact" TEXT,
    "recommendations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CivilizationScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorldModelRecommendation" (
    "id" TEXT NOT NULL,
    "worldModelRunId" TEXT,
    "title" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "rationale" TEXT,
    "executionWindow" TEXT,
    "expectedBenefit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorldModelRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorldModelRun_modelType_idx" ON "WorldModelRun"("modelType");

-- CreateIndex
CREATE INDEX "WorldModelRun_status_idx" ON "WorldModelRun"("status");

-- CreateIndex
CREATE INDEX "WorldModelRun_horizon_idx" ON "WorldModelRun"("horizon");

-- CreateIndex
CREATE INDEX "WorldModelRun_stabilityIndex_idx" ON "WorldModelRun"("stabilityIndex");

-- CreateIndex
CREATE INDEX "WorldModelRun_riskIndex_idx" ON "WorldModelRun"("riskIndex");

-- CreateIndex
CREATE INDEX "PlanetarySignal_signalType_idx" ON "PlanetarySignal"("signalType");

-- CreateIndex
CREATE INDEX "PlanetarySignal_domain_idx" ON "PlanetarySignal"("domain");

-- CreateIndex
CREATE INDEX "PlanetarySignal_severity_idx" ON "PlanetarySignal"("severity");

-- CreateIndex
CREATE INDEX "PlanetarySignal_relevanceScore_idx" ON "PlanetarySignal"("relevanceScore");

-- CreateIndex
CREATE INDEX "PlanetarySignal_status_idx" ON "PlanetarySignal"("status");

-- CreateIndex
CREATE INDEX "CivilizationScenario_worldModelRunId_idx" ON "CivilizationScenario"("worldModelRunId");

-- CreateIndex
CREATE INDEX "CivilizationScenario_scenarioType_idx" ON "CivilizationScenario"("scenarioType");

-- CreateIndex
CREATE INDEX "CivilizationScenario_impactLevel_idx" ON "CivilizationScenario"("impactLevel");

-- CreateIndex
CREATE INDEX "WorldModelRecommendation_worldModelRunId_idx" ON "WorldModelRecommendation"("worldModelRunId");

-- CreateIndex
CREATE INDEX "WorldModelRecommendation_recommendationType_idx" ON "WorldModelRecommendation"("recommendationType");

-- CreateIndex
CREATE INDEX "WorldModelRecommendation_priority_idx" ON "WorldModelRecommendation"("priority");

-- CreateIndex
CREATE INDEX "WorldModelRecommendation_status_idx" ON "WorldModelRecommendation"("status");
