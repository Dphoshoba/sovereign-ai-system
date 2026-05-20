-- CreateTable
CREATE TABLE "CognitiveEntity" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "importance" INTEGER NOT NULL DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CognitiveEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CognitiveRelation" (
    "id" TEXT NOT NULL,
    "sourceEntityId" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "summary" TEXT,
    "evidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CognitiveRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CognitiveSynthesisRun" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "summary" TEXT,
    "graphHealth" INTEGER NOT NULL DEFAULT 75,
    "findings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CognitiveSynthesisRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CognitiveInsight" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "title" TEXT NOT NULL,
    "insight" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "relatedEntities" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CognitiveInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CognitiveEntity_entityType_idx" ON "CognitiveEntity"("entityType");

-- CreateIndex
CREATE INDEX "CognitiveEntity_entityId_idx" ON "CognitiveEntity"("entityId");

-- CreateIndex
CREATE INDEX "CognitiveEntity_importance_idx" ON "CognitiveEntity"("importance");

-- CreateIndex
CREATE INDEX "CognitiveEntity_status_idx" ON "CognitiveEntity"("status");

-- CreateIndex
CREATE INDEX "CognitiveRelation_sourceEntityId_idx" ON "CognitiveRelation"("sourceEntityId");

-- CreateIndex
CREATE INDEX "CognitiveRelation_targetEntityId_idx" ON "CognitiveRelation"("targetEntityId");

-- CreateIndex
CREATE INDEX "CognitiveRelation_relationType_idx" ON "CognitiveRelation"("relationType");

-- CreateIndex
CREATE INDEX "CognitiveRelation_strength_idx" ON "CognitiveRelation"("strength");

-- CreateIndex
CREATE INDEX "CognitiveSynthesisRun_status_idx" ON "CognitiveSynthesisRun"("status");

-- CreateIndex
CREATE INDEX "CognitiveSynthesisRun_graphHealth_idx" ON "CognitiveSynthesisRun"("graphHealth");

-- CreateIndex
CREATE INDEX "CognitiveSynthesisRun_createdAt_idx" ON "CognitiveSynthesisRun"("createdAt");

-- CreateIndex
CREATE INDEX "CognitiveInsight_runId_idx" ON "CognitiveInsight"("runId");

-- CreateIndex
CREATE INDEX "CognitiveInsight_insightType_idx" ON "CognitiveInsight"("insightType");

-- CreateIndex
CREATE INDEX "CognitiveInsight_priority_idx" ON "CognitiveInsight"("priority");

-- CreateIndex
CREATE INDEX "CognitiveInsight_confidence_idx" ON "CognitiveInsight"("confidence");

-- CreateIndex
CREATE INDEX "CognitiveInsight_status_idx" ON "CognitiveInsight"("status");
