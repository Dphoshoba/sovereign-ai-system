-- CreateTable
CREATE TABLE "AiWorkflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiWorkflow_status_idx" ON "AiWorkflow"("status");

-- CreateIndex
CREATE INDEX "AiWorkflow_trigger_idx" ON "AiWorkflow"("trigger");
