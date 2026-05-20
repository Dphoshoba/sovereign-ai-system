-- CreateTable
CREATE TABLE "PublishingCadenceGoal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'youtube',
    "goalType" TEXT NOT NULL,
    "target" INTEGER NOT NULL DEFAULT 1,
    "period" TEXT NOT NULL DEFAULT 'weekly',
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublishingCadenceGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YouTubePublishingAsset" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT,
    "title" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idea',
    "hook" TEXT,
    "script" TEXT,
    "description" TEXT,
    "thumbnailIdea" TEXT,
    "cta" TEXT,
    "publishAt" TIMESTAMP(3),
    "pillar" TEXT,
    "score" INTEGER NOT NULL DEFAULT 70,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YouTubePublishingAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YouTubeIntelligenceRun" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "cadenceScore" INTEGER NOT NULL DEFAULT 70,
    "focusScore" INTEGER NOT NULL DEFAULT 70,
    "audienceFitScore" INTEGER NOT NULL DEFAULT 70,
    "funnelScore" INTEGER NOT NULL DEFAULT 70,
    "summary" TEXT,
    "findings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YouTubeIntelligenceRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishingWorkflowEvent" (
    "id" TEXT NOT NULL,
    "assetId" TEXT,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublishingWorkflowEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublishingCadenceGoal_channel_idx" ON "PublishingCadenceGoal"("channel");

-- CreateIndex
CREATE INDEX "PublishingCadenceGoal_goalType_idx" ON "PublishingCadenceGoal"("goalType");

-- CreateIndex
CREATE INDEX "PublishingCadenceGoal_status_idx" ON "PublishingCadenceGoal"("status");

-- CreateIndex
CREATE INDEX "YouTubePublishingAsset_contentItemId_idx" ON "YouTubePublishingAsset"("contentItemId");

-- CreateIndex
CREATE INDEX "YouTubePublishingAsset_assetType_idx" ON "YouTubePublishingAsset"("assetType");

-- CreateIndex
CREATE INDEX "YouTubePublishingAsset_status_idx" ON "YouTubePublishingAsset"("status");

-- CreateIndex
CREATE INDEX "YouTubePublishingAsset_pillar_idx" ON "YouTubePublishingAsset"("pillar");

-- CreateIndex
CREATE INDEX "YouTubePublishingAsset_publishAt_idx" ON "YouTubePublishingAsset"("publishAt");

-- CreateIndex
CREATE INDEX "YouTubeIntelligenceRun_status_idx" ON "YouTubeIntelligenceRun"("status");

-- CreateIndex
CREATE INDEX "YouTubeIntelligenceRun_cadenceScore_idx" ON "YouTubeIntelligenceRun"("cadenceScore");

-- CreateIndex
CREATE INDEX "YouTubeIntelligenceRun_focusScore_idx" ON "YouTubeIntelligenceRun"("focusScore");

-- CreateIndex
CREATE INDEX "YouTubeIntelligenceRun_funnelScore_idx" ON "YouTubeIntelligenceRun"("funnelScore");

-- CreateIndex
CREATE INDEX "PublishingWorkflowEvent_assetId_idx" ON "PublishingWorkflowEvent"("assetId");

-- CreateIndex
CREATE INDEX "PublishingWorkflowEvent_eventType_idx" ON "PublishingWorkflowEvent"("eventType");

-- CreateIndex
CREATE INDEX "PublishingWorkflowEvent_status_idx" ON "PublishingWorkflowEvent"("status");
