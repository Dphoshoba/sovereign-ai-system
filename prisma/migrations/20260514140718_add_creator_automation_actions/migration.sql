-- CreateTable
CREATE TABLE "CreatorAutomationAction" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "actionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "leadId" TEXT,
    "auditId" TEXT,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorAutomationAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreatorAutomationAction_source_idx" ON "CreatorAutomationAction"("source");

-- CreateIndex
CREATE INDEX "CreatorAutomationAction_status_idx" ON "CreatorAutomationAction"("status");

-- CreateIndex
CREATE INDEX "CreatorAutomationAction_priority_idx" ON "CreatorAutomationAction"("priority");

-- CreateIndex
CREATE INDEX "CreatorAutomationAction_leadId_idx" ON "CreatorAutomationAction"("leadId");

-- CreateIndex
CREATE INDEX "CreatorAutomationAction_auditId_idx" ON "CreatorAutomationAction"("auditId");

-- CreateIndex
CREATE INDEX "CreatorAutomationAction_createdAt_idx" ON "CreatorAutomationAction"("createdAt");
