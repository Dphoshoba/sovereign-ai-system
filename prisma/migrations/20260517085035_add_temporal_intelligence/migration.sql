-- CreateTable
CREATE TABLE "TemporalSimulationRun" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "simulationType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "timelineHorizon" TEXT NOT NULL DEFAULT '12-months',
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "stabilityScore" INTEGER NOT NULL DEFAULT 70,
    "strategicHealth" INTEGER NOT NULL DEFAULT 75,
    "economicProjection" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "summary" TEXT,
    "findings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemporalSimulationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FutureScenario" (
    "id" TEXT NOT NULL,
    "simulationRunId" TEXT,
    "title" TEXT NOT NULL,
    "scenarioType" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "impactLevel" TEXT NOT NULL DEFAULT 'medium',
    "strategicOutcome" TEXT,
    "economicOutcome" TEXT,
    "operationalOutcome" TEXT,
    "governanceOutcome" TEXT,
    "narrative" TEXT,
    "recommendations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FutureScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicTimelineEvent" (
    "id" TEXT NOT NULL,
    "simulationRunId" TEXT,
    "title" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "projectedDate" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "implications" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategicTimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemporalRecommendation" (
    "id" TEXT NOT NULL,
    "simulationRunId" TEXT,
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

    CONSTRAINT "TemporalRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TemporalSimulationRun_simulationType_idx" ON "TemporalSimulationRun"("simulationType");

-- CreateIndex
CREATE INDEX "TemporalSimulationRun_status_idx" ON "TemporalSimulationRun"("status");

-- CreateIndex
CREATE INDEX "TemporalSimulationRun_timelineHorizon_idx" ON "TemporalSimulationRun"("timelineHorizon");

-- CreateIndex
CREATE INDEX "TemporalSimulationRun_stabilityScore_idx" ON "TemporalSimulationRun"("stabilityScore");

-- CreateIndex
CREATE INDEX "FutureScenario_simulationRunId_idx" ON "FutureScenario"("simulationRunId");

-- CreateIndex
CREATE INDEX "FutureScenario_scenarioType_idx" ON "FutureScenario"("scenarioType");

-- CreateIndex
CREATE INDEX "FutureScenario_impactLevel_idx" ON "FutureScenario"("impactLevel");

-- CreateIndex
CREATE INDEX "StrategicTimelineEvent_simulationRunId_idx" ON "StrategicTimelineEvent"("simulationRunId");

-- CreateIndex
CREATE INDEX "StrategicTimelineEvent_eventType_idx" ON "StrategicTimelineEvent"("eventType");

-- CreateIndex
CREATE INDEX "StrategicTimelineEvent_severity_idx" ON "StrategicTimelineEvent"("severity");

-- CreateIndex
CREATE INDEX "TemporalRecommendation_simulationRunId_idx" ON "TemporalRecommendation"("simulationRunId");

-- CreateIndex
CREATE INDEX "TemporalRecommendation_recommendationType_idx" ON "TemporalRecommendation"("recommendationType");

-- CreateIndex
CREATE INDEX "TemporalRecommendation_priority_idx" ON "TemporalRecommendation"("priority");

-- CreateIndex
CREATE INDEX "TemporalRecommendation_status_idx" ON "TemporalRecommendation"("status");
