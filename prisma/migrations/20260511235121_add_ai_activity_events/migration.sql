-- CreateTable
CREATE TABLE "AiActivityEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'info',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiActivityEvent_type_idx" ON "AiActivityEvent"("type");

-- CreateIndex
CREATE INDEX "AiActivityEvent_status_idx" ON "AiActivityEvent"("status");

-- CreateIndex
CREATE INDEX "AiActivityEvent_createdAt_idx" ON "AiActivityEvent"("createdAt");
