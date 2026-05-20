-- CreateTable
CREATE TABLE "ExecutiveAgent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "mission" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "tools" TEXT,
    "memoryScope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutiveAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveAgentRun" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "output" JSONB,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutiveAgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExecutiveAgent_department_idx" ON "ExecutiveAgent"("department");

-- CreateIndex
CREATE INDEX "ExecutiveAgent_status_idx" ON "ExecutiveAgent"("status");

-- CreateIndex
CREATE INDEX "ExecutiveAgentRun_agentId_idx" ON "ExecutiveAgentRun"("agentId");

-- CreateIndex
CREATE INDEX "ExecutiveAgentRun_agentName_idx" ON "ExecutiveAgentRun"("agentName");

-- CreateIndex
CREATE INDEX "ExecutiveAgentRun_status_idx" ON "ExecutiveAgentRun"("status");

-- CreateIndex
CREATE INDEX "ExecutiveAgentRun_createdAt_idx" ON "ExecutiveAgentRun"("createdAt");
