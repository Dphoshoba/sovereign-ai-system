-- CreateTable
CREATE TABLE "ToolExecutionAction" (
    "id" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolExecutionAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ToolExecutionAction_toolName_idx" ON "ToolExecutionAction"("toolName");

-- CreateIndex
CREATE INDEX "ToolExecutionAction_status_idx" ON "ToolExecutionAction"("status");

-- CreateIndex
CREATE INDEX "ToolExecutionAction_riskLevel_idx" ON "ToolExecutionAction"("riskLevel");

-- CreateIndex
CREATE INDEX "ToolExecutionAction_requiresApproval_idx" ON "ToolExecutionAction"("requiresApproval");

-- CreateIndex
CREATE INDEX "ToolExecutionAction_createdAt_idx" ON "ToolExecutionAction"("createdAt");
