-- CreateTable
CREATE TABLE "OperationalEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "status" TEXT NOT NULL DEFAULT 'new',
    "entityType" TEXT,
    "entityId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OperationalEvent_type_idx" ON "OperationalEvent"("type");

-- CreateIndex
CREATE INDEX "OperationalEvent_source_idx" ON "OperationalEvent"("source");

-- CreateIndex
CREATE INDEX "OperationalEvent_severity_idx" ON "OperationalEvent"("severity");

-- CreateIndex
CREATE INDEX "OperationalEvent_status_idx" ON "OperationalEvent"("status");

-- CreateIndex
CREATE INDEX "OperationalEvent_entityType_idx" ON "OperationalEvent"("entityType");

-- CreateIndex
CREATE INDEX "OperationalEvent_createdAt_idx" ON "OperationalEvent"("createdAt");
