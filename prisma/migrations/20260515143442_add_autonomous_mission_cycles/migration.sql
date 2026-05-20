-- CreateTable
CREATE TABLE "AutonomousMissionCycle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "cycleType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "summary" TEXT,
    "findings" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutonomousMissionCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutonomousMissionTask" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "resultSummary" TEXT,
    "resultPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutonomousMissionTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutonomousMissionCycle_cycleType_idx" ON "AutonomousMissionCycle"("cycleType");

-- CreateIndex
CREATE INDEX "AutonomousMissionCycle_status_idx" ON "AutonomousMissionCycle"("status");

-- CreateIndex
CREATE INDEX "AutonomousMissionCycle_createdAt_idx" ON "AutonomousMissionCycle"("createdAt");

-- CreateIndex
CREATE INDEX "AutonomousMissionTask_cycleId_idx" ON "AutonomousMissionTask"("cycleId");

-- CreateIndex
CREATE INDEX "AutonomousMissionTask_agentName_idx" ON "AutonomousMissionTask"("agentName");

-- CreateIndex
CREATE INDEX "AutonomousMissionTask_status_idx" ON "AutonomousMissionTask"("status");

-- CreateIndex
CREATE INDEX "AutonomousMissionTask_priority_idx" ON "AutonomousMissionTask"("priority");

-- CreateIndex
CREATE INDEX "AutonomousMissionTask_createdAt_idx" ON "AutonomousMissionTask"("createdAt");
