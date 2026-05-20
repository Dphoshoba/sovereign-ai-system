-- CreateTable
CREATE TABLE "AgentDelegation" (
    "id" TEXT NOT NULL,
    "fromAgentId" TEXT NOT NULL,
    "fromAgentName" TEXT NOT NULL,
    "toAgentId" TEXT NOT NULL,
    "toAgentName" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "context" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "responseSummary" TEXT,
    "responsePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentDelegation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentCollaborationSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "summary" TEXT,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentCollaborationSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentDelegation_fromAgentId_idx" ON "AgentDelegation"("fromAgentId");

-- CreateIndex
CREATE INDEX "AgentDelegation_toAgentId_idx" ON "AgentDelegation"("toAgentId");

-- CreateIndex
CREATE INDEX "AgentDelegation_status_idx" ON "AgentDelegation"("status");

-- CreateIndex
CREATE INDEX "AgentDelegation_priority_idx" ON "AgentDelegation"("priority");

-- CreateIndex
CREATE INDEX "AgentDelegation_createdAt_idx" ON "AgentDelegation"("createdAt");

-- CreateIndex
CREATE INDEX "AgentCollaborationSession_status_idx" ON "AgentCollaborationSession"("status");

-- CreateIndex
CREATE INDEX "AgentCollaborationSession_createdAt_idx" ON "AgentCollaborationSession"("createdAt");
