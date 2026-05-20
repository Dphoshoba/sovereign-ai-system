-- CreateTable
CREATE TABLE "OrchestrationKernelRun" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "mode" TEXT NOT NULL DEFAULT 'autonomous',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "summary" TEXT,
    "decisions" JSONB,
    "healthScore" INTEGER NOT NULL DEFAULT 80,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrchestrationKernelRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrchestrationDecision" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "title" TEXT NOT NULL,
    "decisionType" TEXT NOT NULL,
    "targetSystem" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "reason" TEXT,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrchestrationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrchestrationKernelRun_status_idx" ON "OrchestrationKernelRun"("status");

-- CreateIndex
CREATE INDEX "OrchestrationKernelRun_mode_idx" ON "OrchestrationKernelRun"("mode");

-- CreateIndex
CREATE INDEX "OrchestrationKernelRun_priority_idx" ON "OrchestrationKernelRun"("priority");

-- CreateIndex
CREATE INDEX "OrchestrationKernelRun_createdAt_idx" ON "OrchestrationKernelRun"("createdAt");

-- CreateIndex
CREATE INDEX "OrchestrationDecision_runId_idx" ON "OrchestrationDecision"("runId");

-- CreateIndex
CREATE INDEX "OrchestrationDecision_decisionType_idx" ON "OrchestrationDecision"("decisionType");

-- CreateIndex
CREATE INDEX "OrchestrationDecision_targetSystem_idx" ON "OrchestrationDecision"("targetSystem");

-- CreateIndex
CREATE INDEX "OrchestrationDecision_priority_idx" ON "OrchestrationDecision"("priority");

-- CreateIndex
CREATE INDEX "OrchestrationDecision_status_idx" ON "OrchestrationDecision"("status");
