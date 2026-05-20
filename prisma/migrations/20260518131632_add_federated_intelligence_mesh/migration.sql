-- CreateTable
CREATE TABLE "FederatedMeshNode" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "nodeName" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL DEFAULT 'tenant',
    "domain" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "trustScore" INTEGER NOT NULL DEFAULT 70,
    "capabilities" JSONB,
    "policies" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FederatedMeshNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FederatedIntelligencePacket" (
    "id" TEXT NOT NULL,
    "sourceNodeId" TEXT,
    "targetNodeId" TEXT,
    "packetType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "classification" TEXT NOT NULL DEFAULT 'internal',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FederatedIntelligencePacket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FederationCoordinationSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL DEFAULT 'coordination',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "participatingNodes" JSONB,
    "coordinationGoal" TEXT,
    "decisions" JSONB,
    "risks" JSONB,
    "outcomes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FederationCoordinationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FederationAllianceProtocol" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "protocolType" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'tenant-federation',
    "status" TEXT NOT NULL DEFAULT 'active',
    "trustRequired" INTEGER NOT NULL DEFAULT 70,
    "rules" JSONB,
    "allowedPacketTypes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FederationAllianceProtocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeshAgentSociety" (
    "id" TEXT NOT NULL,
    "societyName" TEXT NOT NULL,
    "societyType" TEXT NOT NULL DEFAULT 'multi-agent',
    "status" TEXT NOT NULL DEFAULT 'active',
    "purpose" TEXT,
    "agents" JSONB,
    "coordinationRules" JSONB,
    "performanceScore" INTEGER NOT NULL DEFAULT 70,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeshAgentSociety_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FederationMeshRun" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "meshHealth" INTEGER NOT NULL DEFAULT 75,
    "trustHealth" INTEGER NOT NULL DEFAULT 75,
    "coordinationScore" INTEGER NOT NULL DEFAULT 70,
    "riskScore" INTEGER NOT NULL DEFAULT 35,
    "summary" TEXT,
    "findings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FederationMeshRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FederatedMeshNode_organizationId_idx" ON "FederatedMeshNode"("organizationId");

-- CreateIndex
CREATE INDEX "FederatedMeshNode_nodeType_idx" ON "FederatedMeshNode"("nodeType");

-- CreateIndex
CREATE INDEX "FederatedMeshNode_status_idx" ON "FederatedMeshNode"("status");

-- CreateIndex
CREATE INDEX "FederatedMeshNode_trustScore_idx" ON "FederatedMeshNode"("trustScore");

-- CreateIndex
CREATE INDEX "FederatedIntelligencePacket_sourceNodeId_idx" ON "FederatedIntelligencePacket"("sourceNodeId");

-- CreateIndex
CREATE INDEX "FederatedIntelligencePacket_targetNodeId_idx" ON "FederatedIntelligencePacket"("targetNodeId");

-- CreateIndex
CREATE INDEX "FederatedIntelligencePacket_packetType_idx" ON "FederatedIntelligencePacket"("packetType");

-- CreateIndex
CREATE INDEX "FederatedIntelligencePacket_priority_idx" ON "FederatedIntelligencePacket"("priority");

-- CreateIndex
CREATE INDEX "FederatedIntelligencePacket_classification_idx" ON "FederatedIntelligencePacket"("classification");

-- CreateIndex
CREATE INDEX "FederatedIntelligencePacket_status_idx" ON "FederatedIntelligencePacket"("status");

-- CreateIndex
CREATE INDEX "FederationCoordinationSession_sessionType_idx" ON "FederationCoordinationSession"("sessionType");

-- CreateIndex
CREATE INDEX "FederationCoordinationSession_status_idx" ON "FederationCoordinationSession"("status");

-- CreateIndex
CREATE INDEX "FederationCoordinationSession_createdAt_idx" ON "FederationCoordinationSession"("createdAt");

-- CreateIndex
CREATE INDEX "FederationAllianceProtocol_protocolType_idx" ON "FederationAllianceProtocol"("protocolType");

-- CreateIndex
CREATE INDEX "FederationAllianceProtocol_scope_idx" ON "FederationAllianceProtocol"("scope");

-- CreateIndex
CREATE INDEX "FederationAllianceProtocol_status_idx" ON "FederationAllianceProtocol"("status");

-- CreateIndex
CREATE INDEX "FederationAllianceProtocol_trustRequired_idx" ON "FederationAllianceProtocol"("trustRequired");

-- CreateIndex
CREATE INDEX "MeshAgentSociety_societyType_idx" ON "MeshAgentSociety"("societyType");

-- CreateIndex
CREATE INDEX "MeshAgentSociety_status_idx" ON "MeshAgentSociety"("status");

-- CreateIndex
CREATE INDEX "MeshAgentSociety_performanceScore_idx" ON "MeshAgentSociety"("performanceScore");

-- CreateIndex
CREATE INDEX "FederationMeshRun_status_idx" ON "FederationMeshRun"("status");

-- CreateIndex
CREATE INDEX "FederationMeshRun_meshHealth_idx" ON "FederationMeshRun"("meshHealth");

-- CreateIndex
CREATE INDEX "FederationMeshRun_trustHealth_idx" ON "FederationMeshRun"("trustHealth");

-- CreateIndex
CREATE INDEX "FederationMeshRun_coordinationScore_idx" ON "FederationMeshRun"("coordinationScore");

-- CreateIndex
CREATE INDEX "FederationMeshRun_riskScore_idx" ON "FederationMeshRun"("riskScore");
