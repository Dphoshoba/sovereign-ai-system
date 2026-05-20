-- CreateTable
CREATE TABLE "StrategicShockModel" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "title" TEXT NOT NULL,
    "shockType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "probability" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "impactScore" INTEGER NOT NULL DEFAULT 50,
    "timeHorizon" TEXT NOT NULL DEFAULT 'near-term',
    "narrative" TEXT,
    "responsePlan" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategicShockModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanetaryRecommendationV2" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "title" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL DEFAULT 'strategy',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "rationale" TEXT,
    "expectedOutcome" TEXT,
    "urgencyScore" INTEGER NOT NULL DEFAULT 50,
    "opportunityScore" INTEGER NOT NULL DEFAULT 50,
    "riskScore" INTEGER NOT NULL DEFAULT 40,
    "costPressureScore" INTEGER NOT NULL DEFAULT 40,
    "executionDifficultyScore" INTEGER NOT NULL DEFAULT 50,
    "governanceSensitivityScore" INTEGER NOT NULL DEFAULT 40,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "compositeScore" INTEGER NOT NULL DEFAULT 60,
    "requiredApproval" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanetaryRecommendationV2_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StrategicShockModel_runId_idx" ON "StrategicShockModel"("runId");

-- CreateIndex
CREATE INDEX "StrategicShockModel_shockType_idx" ON "StrategicShockModel"("shockType");

-- CreateIndex
CREATE INDEX "StrategicShockModel_severity_idx" ON "StrategicShockModel"("severity");

-- CreateIndex
CREATE INDEX "StrategicShockModel_impactScore_idx" ON "StrategicShockModel"("impactScore");

-- CreateIndex
CREATE INDEX "PlanetaryRecommendationV2_runId_idx" ON "PlanetaryRecommendationV2"("runId");

-- CreateIndex
CREATE INDEX "PlanetaryRecommendationV2_recommendationType_idx" ON "PlanetaryRecommendationV2"("recommendationType");

-- CreateIndex
CREATE INDEX "PlanetaryRecommendationV2_priority_idx" ON "PlanetaryRecommendationV2"("priority");

-- CreateIndex
CREATE INDEX "PlanetaryRecommendationV2_compositeScore_idx" ON "PlanetaryRecommendationV2"("compositeScore");

-- CreateIndex
CREATE INDEX "PlanetaryRecommendationV2_requiredApproval_idx" ON "PlanetaryRecommendationV2"("requiredApproval");

-- CreateIndex
CREATE INDEX "PlanetaryRecommendationV2_status_idx" ON "PlanetaryRecommendationV2"("status");
