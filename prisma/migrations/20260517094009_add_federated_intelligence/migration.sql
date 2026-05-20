-- CreateTable
CREATE TABLE "FederatedNode" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL,
    "domain" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "trustLevel" INTEGER NOT NULL DEFAULT 50,
    "capabilities" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FederatedNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FederationSignal" (
    "id" TEXT NOT NULL,
    "sourceNode" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'new',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FederationSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FederationCouncilSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "purpose" TEXT,
    "participants" JSONB,
    "findings" JSONB,
    "decisions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FederationCouncilSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FederationAgreement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "agreementType" TEXT NOT NULL,
    "parties" JSONB,
    "terms" JSONB,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FederationAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FederationAction" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetNode" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "rationale" TEXT,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FederationAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FederatedNode_nodeType_idx" ON "FederatedNode"("nodeType");

-- CreateIndex
CREATE INDEX "FederatedNode_status_idx" ON "FederatedNode"("status");

-- CreateIndex
CREATE INDEX "FederatedNode_trustLevel_idx" ON "FederatedNode"("trustLevel");

-- CreateIndex
CREATE INDEX "FederationSignal_sourceNode_idx" ON "FederationSignal"("sourceNode");

-- CreateIndex
CREATE INDEX "FederationSignal_signalType_idx" ON "FederationSignal"("signalType");

-- CreateIndex
CREATE INDEX "FederationSignal_priority_idx" ON "FederationSignal"("priority");

-- CreateIndex
CREATE INDEX "FederationSignal_status_idx" ON "FederationSignal"("status");

-- CreateIndex
CREATE INDEX "FederationCouncilSession_status_idx" ON "FederationCouncilSession"("status");

-- CreateIndex
CREATE INDEX "FederationCouncilSession_createdAt_idx" ON "FederationCouncilSession"("createdAt");

-- CreateIndex
CREATE INDEX "FederationAgreement_agreementType_idx" ON "FederationAgreement"("agreementType");

-- CreateIndex
CREATE INDEX "FederationAgreement_status_idx" ON "FederationAgreement"("status");

-- CreateIndex
CREATE INDEX "FederationAgreement_riskLevel_idx" ON "FederationAgreement"("riskLevel");

-- CreateIndex
CREATE INDEX "FederationAction_actionType_idx" ON "FederationAction"("actionType");

-- CreateIndex
CREATE INDEX "FederationAction_targetNode_idx" ON "FederationAction"("targetNode");

-- CreateIndex
CREATE INDEX "FederationAction_priority_idx" ON "FederationAction"("priority");

-- CreateIndex
CREATE INDEX "FederationAction_status_idx" ON "FederationAction"("status");
