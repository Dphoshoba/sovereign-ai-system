-- CreateTable
CREATE TABLE "GovernancePolicy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "policyType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "enforcement" TEXT NOT NULL DEFAULT 'advisory',
    "status" TEXT NOT NULL DEFAULT 'active',
    "conditions" JSONB,
    "actions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceArbitration" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "arbitrationType" TEXT NOT NULL,
    "targetSystem" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "rationale" TEXT,
    "competingItems" JSONB,
    "resolution" JSONB,
    "riskScore" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceArbitration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceApproval" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "requestedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "rationale" TEXT,
    "decisionNotes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceRiskSignal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "affectedArea" TEXT,
    "description" TEXT,
    "recommendation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceRiskSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalSignalSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "url" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "scanCadence" TEXT NOT NULL DEFAULT 'manual',
    "lastScanned" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalSignalSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalIntelligenceSignal" (
    "id" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "relevanceScore" INTEGER NOT NULL DEFAULT 50,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "opportunity" BOOLEAN NOT NULL DEFAULT false,
    "risk" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalIntelligenceSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalWorldScan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scanType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "summary" TEXT,
    "findings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalWorldScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GovernancePolicy_policyType_idx" ON "GovernancePolicy"("policyType");

-- CreateIndex
CREATE INDEX "GovernancePolicy_severity_idx" ON "GovernancePolicy"("severity");

-- CreateIndex
CREATE INDEX "GovernancePolicy_enforcement_idx" ON "GovernancePolicy"("enforcement");

-- CreateIndex
CREATE INDEX "GovernancePolicy_status_idx" ON "GovernancePolicy"("status");

-- CreateIndex
CREATE INDEX "GovernanceArbitration_arbitrationType_idx" ON "GovernanceArbitration"("arbitrationType");

-- CreateIndex
CREATE INDEX "GovernanceArbitration_targetSystem_idx" ON "GovernanceArbitration"("targetSystem");

-- CreateIndex
CREATE INDEX "GovernanceArbitration_status_idx" ON "GovernanceArbitration"("status");

-- CreateIndex
CREATE INDEX "GovernanceArbitration_severity_idx" ON "GovernanceArbitration"("severity");

-- CreateIndex
CREATE INDEX "GovernanceArbitration_riskScore_idx" ON "GovernanceArbitration"("riskScore");

-- CreateIndex
CREATE INDEX "GovernanceApproval_targetType_idx" ON "GovernanceApproval"("targetType");

-- CreateIndex
CREATE INDEX "GovernanceApproval_targetId_idx" ON "GovernanceApproval"("targetId");

-- CreateIndex
CREATE INDEX "GovernanceApproval_status_idx" ON "GovernanceApproval"("status");

-- CreateIndex
CREATE INDEX "GovernanceApproval_priority_idx" ON "GovernanceApproval"("priority");

-- CreateIndex
CREATE INDEX "GovernanceRiskSignal_signalType_idx" ON "GovernanceRiskSignal"("signalType");

-- CreateIndex
CREATE INDEX "GovernanceRiskSignal_severity_idx" ON "GovernanceRiskSignal"("severity");

-- CreateIndex
CREATE INDEX "GovernanceRiskSignal_affectedArea_idx" ON "GovernanceRiskSignal"("affectedArea");

-- CreateIndex
CREATE INDEX "GovernanceRiskSignal_status_idx" ON "GovernanceRiskSignal"("status");

-- CreateIndex
CREATE INDEX "ExternalSignalSource_sourceType_idx" ON "ExternalSignalSource"("sourceType");

-- CreateIndex
CREATE INDEX "ExternalSignalSource_category_idx" ON "ExternalSignalSource"("category");

-- CreateIndex
CREATE INDEX "ExternalSignalSource_enabled_idx" ON "ExternalSignalSource"("enabled");

-- CreateIndex
CREATE INDEX "ExternalIntelligenceSignal_signalType_idx" ON "ExternalIntelligenceSignal"("signalType");

-- CreateIndex
CREATE INDEX "ExternalIntelligenceSignal_category_idx" ON "ExternalIntelligenceSignal"("category");

-- CreateIndex
CREATE INDEX "ExternalIntelligenceSignal_relevanceScore_idx" ON "ExternalIntelligenceSignal"("relevanceScore");

-- CreateIndex
CREATE INDEX "ExternalIntelligenceSignal_severity_idx" ON "ExternalIntelligenceSignal"("severity");

-- CreateIndex
CREATE INDEX "ExternalIntelligenceSignal_status_idx" ON "ExternalIntelligenceSignal"("status");

-- CreateIndex
CREATE INDEX "ExternalWorldScan_scanType_idx" ON "ExternalWorldScan"("scanType");

-- CreateIndex
CREATE INDEX "ExternalWorldScan_status_idx" ON "ExternalWorldScan"("status");

-- CreateIndex
CREATE INDEX "ExternalWorldScan_createdAt_idx" ON "ExternalWorldScan"("createdAt");
