-- CreateTable
CREATE TABLE "ActionMission" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "workspaceId" TEXT,
    "title" TEXT NOT NULL,
    "missionType" TEXT NOT NULL DEFAULT 'strategic-execution',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "objective" TEXT,
    "successCriteria" JSONB,
    "assignedAgents" JSONB,
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "progressScore" INTEGER NOT NULL DEFAULT 0,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionExecutionStep" (
    "id" TEXT NOT NULL,
    "missionId" TEXT,
    "title" TEXT NOT NULL,
    "stepType" TEXT NOT NULL,
    "targetLayer" TEXT,
    "assignedAgent" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "instruction" TEXT,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionExecutionStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentExecutionAssignment" (
    "id" TEXT NOT NULL,
    "missionId" TEXT,
    "stepId" TEXT,
    "agentName" TEXT NOT NULL,
    "agentRole" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "instruction" TEXT,
    "output" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentExecutionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionCoordinationRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "workspaceId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "executionHealth" INTEGER NOT NULL DEFAULT 75,
    "agentHealth" INTEGER NOT NULL DEFAULT 75,
    "missionPressure" INTEGER NOT NULL DEFAULT 35,
    "summary" TEXT,
    "findings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionCoordinationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionOutcomeRecord" (
    "id" TEXT NOT NULL,
    "missionId" TEXT,
    "stepId" TEXT,
    "outcomeType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "impactLevel" TEXT NOT NULL DEFAULT 'medium',
    "evidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionOutcomeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActionMission_organizationId_idx" ON "ActionMission"("organizationId");

-- CreateIndex
CREATE INDEX "ActionMission_workspaceId_idx" ON "ActionMission"("workspaceId");

-- CreateIndex
CREATE INDEX "ActionMission_missionType_idx" ON "ActionMission"("missionType");

-- CreateIndex
CREATE INDEX "ActionMission_status_idx" ON "ActionMission"("status");

-- CreateIndex
CREATE INDEX "ActionMission_priority_idx" ON "ActionMission"("priority");

-- CreateIndex
CREATE INDEX "ActionMission_riskLevel_idx" ON "ActionMission"("riskLevel");

-- CreateIndex
CREATE INDEX "ActionExecutionStep_missionId_idx" ON "ActionExecutionStep"("missionId");

-- CreateIndex
CREATE INDEX "ActionExecutionStep_stepType_idx" ON "ActionExecutionStep"("stepType");

-- CreateIndex
CREATE INDEX "ActionExecutionStep_targetLayer_idx" ON "ActionExecutionStep"("targetLayer");

-- CreateIndex
CREATE INDEX "ActionExecutionStep_assignedAgent_idx" ON "ActionExecutionStep"("assignedAgent");

-- CreateIndex
CREATE INDEX "ActionExecutionStep_status_idx" ON "ActionExecutionStep"("status");

-- CreateIndex
CREATE INDEX "ActionExecutionStep_priority_idx" ON "ActionExecutionStep"("priority");

-- CreateIndex
CREATE INDEX "AgentExecutionAssignment_missionId_idx" ON "AgentExecutionAssignment"("missionId");

-- CreateIndex
CREATE INDEX "AgentExecutionAssignment_stepId_idx" ON "AgentExecutionAssignment"("stepId");

-- CreateIndex
CREATE INDEX "AgentExecutionAssignment_agentName_idx" ON "AgentExecutionAssignment"("agentName");

-- CreateIndex
CREATE INDEX "AgentExecutionAssignment_agentRole_idx" ON "AgentExecutionAssignment"("agentRole");

-- CreateIndex
CREATE INDEX "AgentExecutionAssignment_status_idx" ON "AgentExecutionAssignment"("status");

-- CreateIndex
CREATE INDEX "ActionCoordinationRun_organizationId_idx" ON "ActionCoordinationRun"("organizationId");

-- CreateIndex
CREATE INDEX "ActionCoordinationRun_workspaceId_idx" ON "ActionCoordinationRun"("workspaceId");

-- CreateIndex
CREATE INDEX "ActionCoordinationRun_status_idx" ON "ActionCoordinationRun"("status");

-- CreateIndex
CREATE INDEX "ActionCoordinationRun_executionHealth_idx" ON "ActionCoordinationRun"("executionHealth");

-- CreateIndex
CREATE INDEX "ActionCoordinationRun_missionPressure_idx" ON "ActionCoordinationRun"("missionPressure");

-- CreateIndex
CREATE INDEX "ActionOutcomeRecord_missionId_idx" ON "ActionOutcomeRecord"("missionId");

-- CreateIndex
CREATE INDEX "ActionOutcomeRecord_stepId_idx" ON "ActionOutcomeRecord"("stepId");

-- CreateIndex
CREATE INDEX "ActionOutcomeRecord_outcomeType_idx" ON "ActionOutcomeRecord"("outcomeType");

-- CreateIndex
CREATE INDEX "ActionOutcomeRecord_impactLevel_idx" ON "ActionOutcomeRecord"("impactLevel");
