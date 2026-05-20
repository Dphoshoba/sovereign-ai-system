-- CreateTable
CREATE TABLE "AiAutonomousAction" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "actionType" TEXT NOT NULL,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiAutonomousAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiAutonomousAction_status_idx" ON "AiAutonomousAction"("status");

-- CreateIndex
CREATE INDEX "AiAutonomousAction_priority_idx" ON "AiAutonomousAction"("priority");

-- CreateIndex
CREATE INDEX "AiAutonomousAction_actionType_idx" ON "AiAutonomousAction"("actionType");

-- CreateIndex
CREATE INDEX "AiAutonomousAction_createdAt_idx" ON "AiAutonomousAction"("createdAt");
