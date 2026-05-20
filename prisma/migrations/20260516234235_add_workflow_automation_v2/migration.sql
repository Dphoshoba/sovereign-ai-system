-- CreateTable
CREATE TABLE "WorkflowAutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "actions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowAutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowAutomationRun" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT,
    "eventId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "summary" TEXT,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowAutomationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowAutomationStep" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "title" TEXT NOT NULL,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowAutomationStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowAutomationRule_eventType_idx" ON "WorkflowAutomationRule"("eventType");

-- CreateIndex
CREATE INDEX "WorkflowAutomationRule_enabled_idx" ON "WorkflowAutomationRule"("enabled");

-- CreateIndex
CREATE INDEX "WorkflowAutomationRule_priority_idx" ON "WorkflowAutomationRule"("priority");

-- CreateIndex
CREATE INDEX "WorkflowAutomationRun_ruleId_idx" ON "WorkflowAutomationRun"("ruleId");

-- CreateIndex
CREATE INDEX "WorkflowAutomationRun_eventId_idx" ON "WorkflowAutomationRun"("eventId");

-- CreateIndex
CREATE INDEX "WorkflowAutomationRun_status_idx" ON "WorkflowAutomationRun"("status");

-- CreateIndex
CREATE INDEX "WorkflowAutomationRun_createdAt_idx" ON "WorkflowAutomationRun"("createdAt");

-- CreateIndex
CREATE INDEX "WorkflowAutomationStep_runId_idx" ON "WorkflowAutomationStep"("runId");

-- CreateIndex
CREATE INDEX "WorkflowAutomationStep_actionType_idx" ON "WorkflowAutomationStep"("actionType");

-- CreateIndex
CREATE INDEX "WorkflowAutomationStep_status_idx" ON "WorkflowAutomationStep"("status");
