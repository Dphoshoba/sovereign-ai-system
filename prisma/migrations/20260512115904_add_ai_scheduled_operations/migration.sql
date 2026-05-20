-- CreateTable
CREATE TABLE "AiScheduledOperation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "frequency" TEXT NOT NULL,
    "payload" JSONB,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiScheduledOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiScheduledOperation_status_idx" ON "AiScheduledOperation"("status");

-- CreateIndex
CREATE INDEX "AiScheduledOperation_type_idx" ON "AiScheduledOperation"("type");

-- CreateIndex
CREATE INDEX "AiScheduledOperation_nextRunAt_idx" ON "AiScheduledOperation"("nextRunAt");
