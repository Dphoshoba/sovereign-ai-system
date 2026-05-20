-- CreateTable
CREATE TABLE "OptimizationRun" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "summary" TEXT,
    "healthScore" INTEGER NOT NULL DEFAULT 70,
    "findings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OptimizationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationAction" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "actionType" TEXT NOT NULL,
    "targetSystem" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptimizationAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OptimizationRun_status_idx" ON "OptimizationRun"("status");

-- CreateIndex
CREATE INDEX "OptimizationRun_healthScore_idx" ON "OptimizationRun"("healthScore");

-- CreateIndex
CREATE INDEX "OptimizationRun_createdAt_idx" ON "OptimizationRun"("createdAt");

-- CreateIndex
CREATE INDEX "OptimizationAction_runId_idx" ON "OptimizationAction"("runId");

-- CreateIndex
CREATE INDEX "OptimizationAction_targetSystem_idx" ON "OptimizationAction"("targetSystem");

-- CreateIndex
CREATE INDEX "OptimizationAction_priority_idx" ON "OptimizationAction"("priority");

-- CreateIndex
CREATE INDEX "OptimizationAction_status_idx" ON "OptimizationAction"("status");

-- CreateIndex
CREATE INDEX "OptimizationAction_riskLevel_idx" ON "OptimizationAction"("riskLevel");

-- CreateIndex
CREATE INDEX "OptimizationAction_createdAt_idx" ON "OptimizationAction"("createdAt");
