-- CreateTable
CREATE TABLE "SemanticKnowledgeRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "workspaceId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "recordType" TEXT NOT NULL DEFAULT 'knowledge',
    "sourceLayer" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "importance" INTEGER NOT NULL DEFAULT 50,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "tags" JSONB,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SemanticKnowledgeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemanticEmbeddingIndex" (
    "id" TEXT NOT NULL,
    "knowledgeId" TEXT NOT NULL,
    "organizationId" TEXT,
    "workspaceId" TEXT,
    "embeddingModel" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "vectorHash" TEXT,
    "dimensions" INTEGER NOT NULL DEFAULT 1536,
    "contentPreview" TEXT,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'indexed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SemanticEmbeddingIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeGraphNode" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "workspaceId" TEXT,
    "nodeType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "importance" INTEGER NOT NULL DEFAULT 50,
    "sourceRecordId" TEXT,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeGraphNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeGraphEdge" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "workspaceId" TEXT,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "summary" TEXT,
    "evidence" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeGraphEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemanticMemoryQuery" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "workspaceId" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "matchedRecords" JSONB,
    "matchedNodes" JSONB,
    "reasoningPath" JSONB,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SemanticMemoryQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeGraphSynthesisRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "workspaceId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "graphHealth" INTEGER NOT NULL DEFAULT 75,
    "memoryHealth" INTEGER NOT NULL DEFAULT 75,
    "retrievalHealth" INTEGER NOT NULL DEFAULT 75,
    "summary" TEXT,
    "findings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeGraphSynthesisRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SemanticKnowledgeRecord_organizationId_idx" ON "SemanticKnowledgeRecord"("organizationId");

-- CreateIndex
CREATE INDEX "SemanticKnowledgeRecord_workspaceId_idx" ON "SemanticKnowledgeRecord"("workspaceId");

-- CreateIndex
CREATE INDEX "SemanticKnowledgeRecord_recordType_idx" ON "SemanticKnowledgeRecord"("recordType");

-- CreateIndex
CREATE INDEX "SemanticKnowledgeRecord_sourceLayer_idx" ON "SemanticKnowledgeRecord"("sourceLayer");

-- CreateIndex
CREATE INDEX "SemanticKnowledgeRecord_importance_idx" ON "SemanticKnowledgeRecord"("importance");

-- CreateIndex
CREATE INDEX "SemanticKnowledgeRecord_status_idx" ON "SemanticKnowledgeRecord"("status");

-- CreateIndex
CREATE INDEX "SemanticEmbeddingIndex_knowledgeId_idx" ON "SemanticEmbeddingIndex"("knowledgeId");

-- CreateIndex
CREATE INDEX "SemanticEmbeddingIndex_organizationId_idx" ON "SemanticEmbeddingIndex"("organizationId");

-- CreateIndex
CREATE INDEX "SemanticEmbeddingIndex_workspaceId_idx" ON "SemanticEmbeddingIndex"("workspaceId");

-- CreateIndex
CREATE INDEX "SemanticEmbeddingIndex_embeddingModel_idx" ON "SemanticEmbeddingIndex"("embeddingModel");

-- CreateIndex
CREATE INDEX "SemanticEmbeddingIndex_status_idx" ON "SemanticEmbeddingIndex"("status");

-- CreateIndex
CREATE INDEX "KnowledgeGraphNode_organizationId_idx" ON "KnowledgeGraphNode"("organizationId");

-- CreateIndex
CREATE INDEX "KnowledgeGraphNode_workspaceId_idx" ON "KnowledgeGraphNode"("workspaceId");

-- CreateIndex
CREATE INDEX "KnowledgeGraphNode_nodeType_idx" ON "KnowledgeGraphNode"("nodeType");

-- CreateIndex
CREATE INDEX "KnowledgeGraphNode_importance_idx" ON "KnowledgeGraphNode"("importance");

-- CreateIndex
CREATE INDEX "KnowledgeGraphNode_sourceRecordId_idx" ON "KnowledgeGraphNode"("sourceRecordId");

-- CreateIndex
CREATE INDEX "KnowledgeGraphNode_status_idx" ON "KnowledgeGraphNode"("status");

-- CreateIndex
CREATE INDEX "KnowledgeGraphEdge_organizationId_idx" ON "KnowledgeGraphEdge"("organizationId");

-- CreateIndex
CREATE INDEX "KnowledgeGraphEdge_workspaceId_idx" ON "KnowledgeGraphEdge"("workspaceId");

-- CreateIndex
CREATE INDEX "KnowledgeGraphEdge_sourceNodeId_idx" ON "KnowledgeGraphEdge"("sourceNodeId");

-- CreateIndex
CREATE INDEX "KnowledgeGraphEdge_targetNodeId_idx" ON "KnowledgeGraphEdge"("targetNodeId");

-- CreateIndex
CREATE INDEX "KnowledgeGraphEdge_relationType_idx" ON "KnowledgeGraphEdge"("relationType");

-- CreateIndex
CREATE INDEX "KnowledgeGraphEdge_strength_idx" ON "KnowledgeGraphEdge"("strength");

-- CreateIndex
CREATE INDEX "KnowledgeGraphEdge_status_idx" ON "KnowledgeGraphEdge"("status");

-- CreateIndex
CREATE INDEX "SemanticMemoryQuery_organizationId_idx" ON "SemanticMemoryQuery"("organizationId");

-- CreateIndex
CREATE INDEX "SemanticMemoryQuery_workspaceId_idx" ON "SemanticMemoryQuery"("workspaceId");

-- CreateIndex
CREATE INDEX "SemanticMemoryQuery_confidence_idx" ON "SemanticMemoryQuery"("confidence");

-- CreateIndex
CREATE INDEX "SemanticMemoryQuery_status_idx" ON "SemanticMemoryQuery"("status");

-- CreateIndex
CREATE INDEX "KnowledgeGraphSynthesisRun_organizationId_idx" ON "KnowledgeGraphSynthesisRun"("organizationId");

-- CreateIndex
CREATE INDEX "KnowledgeGraphSynthesisRun_workspaceId_idx" ON "KnowledgeGraphSynthesisRun"("workspaceId");

-- CreateIndex
CREATE INDEX "KnowledgeGraphSynthesisRun_status_idx" ON "KnowledgeGraphSynthesisRun"("status");

-- CreateIndex
CREATE INDEX "KnowledgeGraphSynthesisRun_graphHealth_idx" ON "KnowledgeGraphSynthesisRun"("graphHealth");
