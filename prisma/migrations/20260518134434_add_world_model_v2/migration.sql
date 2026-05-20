-- CreateTable
CREATE TABLE "WorldModelV2Run" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "horizon" TEXT NOT NULL DEFAULT '12-months',
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "planetaryStability" INTEGER NOT NULL DEFAULT 70,
    "opportunityIndex" INTEGER NOT NULL DEFAULT 75,
    "systemicRiskIndex" INTEGER NOT NULL DEFAULT 40,
    "strategicReadiness" INTEGER NOT NULL DEFAULT 70,
    "summary" TEXT,
    "assumptions" JSONB,
    "findings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorldModelV2Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanetaryDomainSignal" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "domain" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "probability" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "impactScore" INTEGER NOT NULL DEFAULT 50,
    "sourceLayer" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanetaryDomainSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanetaryScenarioV2" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "title" TEXT NOT NULL,
    "scenarioType" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "impactLevel" TEXT NOT NULL DEFAULT 'medium',
    "narrative" TEXT,
    "risks" JSONB,
    "opportunities" JSONB,
    "strategicMoves" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanetaryScenarioV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicPostureModel" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "title" TEXT NOT NULL,
    "postureType" TEXT NOT NULL,
    "readinessScore" INTEGER NOT NULL DEFAULT 70,
    "riskExposure" INTEGER NOT NULL DEFAULT 40,
    "upsidePotential" INTEGER NOT NULL DEFAULT 75,
    "recommendation" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategicPostureModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanetaryStressTest" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "title" TEXT NOT NULL,
    "stressType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "resilienceScore" INTEGER NOT NULL DEFAULT 70,
    "description" TEXT,
    "mitigation" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanetaryStressTest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorldModelV2Run_status_idx" ON "WorldModelV2Run"("status");

-- CreateIndex
CREATE INDEX "WorldModelV2Run_horizon_idx" ON "WorldModelV2Run"("horizon");

-- CreateIndex
CREATE INDEX "WorldModelV2Run_planetaryStability_idx" ON "WorldModelV2Run"("planetaryStability");

-- CreateIndex
CREATE INDEX "WorldModelV2Run_systemicRiskIndex_idx" ON "WorldModelV2Run"("systemicRiskIndex");

-- CreateIndex
CREATE INDEX "PlanetaryDomainSignal_runId_idx" ON "PlanetaryDomainSignal"("runId");

-- CreateIndex
CREATE INDEX "PlanetaryDomainSignal_domain_idx" ON "PlanetaryDomainSignal"("domain");

-- CreateIndex
CREATE INDEX "PlanetaryDomainSignal_signalType_idx" ON "PlanetaryDomainSignal"("signalType");

-- CreateIndex
CREATE INDEX "PlanetaryDomainSignal_severity_idx" ON "PlanetaryDomainSignal"("severity");

-- CreateIndex
CREATE INDEX "PlanetaryDomainSignal_impactScore_idx" ON "PlanetaryDomainSignal"("impactScore");

-- CreateIndex
CREATE INDEX "PlanetaryScenarioV2_runId_idx" ON "PlanetaryScenarioV2"("runId");

-- CreateIndex
CREATE INDEX "PlanetaryScenarioV2_scenarioType_idx" ON "PlanetaryScenarioV2"("scenarioType");

-- CreateIndex
CREATE INDEX "PlanetaryScenarioV2_impactLevel_idx" ON "PlanetaryScenarioV2"("impactLevel");

-- CreateIndex
CREATE INDEX "StrategicPostureModel_runId_idx" ON "StrategicPostureModel"("runId");

-- CreateIndex
CREATE INDEX "StrategicPostureModel_postureType_idx" ON "StrategicPostureModel"("postureType");

-- CreateIndex
CREATE INDEX "StrategicPostureModel_readinessScore_idx" ON "StrategicPostureModel"("readinessScore");

-- CreateIndex
CREATE INDEX "StrategicPostureModel_riskExposure_idx" ON "StrategicPostureModel"("riskExposure");

-- CreateIndex
CREATE INDEX "PlanetaryStressTest_runId_idx" ON "PlanetaryStressTest"("runId");

-- CreateIndex
CREATE INDEX "PlanetaryStressTest_stressType_idx" ON "PlanetaryStressTest"("stressType");

-- CreateIndex
CREATE INDEX "PlanetaryStressTest_severity_idx" ON "PlanetaryStressTest"("severity");

-- CreateIndex
CREATE INDEX "PlanetaryStressTest_resilienceScore_idx" ON "PlanetaryStressTest"("resilienceScore");
