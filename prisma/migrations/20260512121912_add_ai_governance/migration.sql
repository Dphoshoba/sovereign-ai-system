-- CreateTable
CREATE TABLE "AiPermissionRule" (
    "id" TEXT NOT NULL,
    "agentId" TEXT,
    "department" TEXT,
    "action" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiPermissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiApprovalRequest" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiPermissionRule_agentId_idx" ON "AiPermissionRule"("agentId");

-- CreateIndex
CREATE INDEX "AiPermissionRule_department_idx" ON "AiPermissionRule"("department");

-- CreateIndex
CREATE INDEX "AiPermissionRule_action_idx" ON "AiPermissionRule"("action");

-- CreateIndex
CREATE INDEX "AiApprovalRequest_status_idx" ON "AiApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "AiApprovalRequest_action_idx" ON "AiApprovalRequest"("action");
