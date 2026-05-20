-- CreateTable
CREATE TABLE "CreatorNurtureEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorNurtureEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorLeadInsight" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "insight" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "recommendedAction" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorLeadInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreatorNurtureEvent_leadId_idx" ON "CreatorNurtureEvent"("leadId");

-- CreateIndex
CREATE INDEX "CreatorNurtureEvent_status_idx" ON "CreatorNurtureEvent"("status");

-- CreateIndex
CREATE INDEX "CreatorNurtureEvent_type_idx" ON "CreatorNurtureEvent"("type");

-- CreateIndex
CREATE INDEX "CreatorNurtureEvent_createdAt_idx" ON "CreatorNurtureEvent"("createdAt");

-- CreateIndex
CREATE INDEX "CreatorLeadInsight_leadId_idx" ON "CreatorLeadInsight"("leadId");

-- CreateIndex
CREATE INDEX "CreatorLeadInsight_priority_idx" ON "CreatorLeadInsight"("priority");

-- CreateIndex
CREATE INDEX "CreatorLeadInsight_createdAt_idx" ON "CreatorLeadInsight"("createdAt");
