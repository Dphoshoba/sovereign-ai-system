-- CreateTable
CREATE TABLE "PredictiveForecast" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "forecastType" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "summary" TEXT,
    "prediction" JSONB,
    "recommendations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredictiveForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicSimulation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "assumptions" JSONB,
    "results" JSONB,
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "recommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategicSimulation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PredictiveForecast_forecastType_idx" ON "PredictiveForecast"("forecastType");

-- CreateIndex
CREATE INDEX "PredictiveForecast_timeframe_idx" ON "PredictiveForecast"("timeframe");

-- CreateIndex
CREATE INDEX "PredictiveForecast_createdAt_idx" ON "PredictiveForecast"("createdAt");

-- CreateIndex
CREATE INDEX "StrategicSimulation_riskLevel_idx" ON "StrategicSimulation"("riskLevel");

-- CreateIndex
CREATE INDEX "StrategicSimulation_createdAt_idx" ON "StrategicSimulation"("createdAt");
