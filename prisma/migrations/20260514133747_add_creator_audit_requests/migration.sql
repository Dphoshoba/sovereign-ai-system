-- CreateTable
CREATE TABLE "CreatorAuditRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "creatorType" TEXT,
    "niche" TEXT,
    "audienceSize" TEXT,
    "publishingFrequency" TEXT,
    "monetizationMethod" TEXT,
    "currentTools" TEXT,
    "biggestBottleneck" TEXT,
    "automationGoals" TEXT,
    "status" TEXT NOT NULL DEFAULT 'audit-requested',
    "opportunityScore" INTEGER NOT NULL DEFAULT 50,
    "auditSummary" TEXT,
    "recommendedSystems" TEXT,
    "nextActions" TEXT,
    "proposalDraft" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorAuditRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreatorAuditRequest_email_idx" ON "CreatorAuditRequest"("email");

-- CreateIndex
CREATE INDEX "CreatorAuditRequest_status_idx" ON "CreatorAuditRequest"("status");

-- CreateIndex
CREATE INDEX "CreatorAuditRequest_opportunityScore_idx" ON "CreatorAuditRequest"("opportunityScore");

-- CreateIndex
CREATE INDEX "CreatorAuditRequest_createdAt_idx" ON "CreatorAuditRequest"("createdAt");
