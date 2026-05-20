-- CreateTable
CREATE TABLE "AudienceProfile" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "source" TEXT,
    "audienceType" TEXT NOT NULL DEFAULT 'unknown',
    "relationshipStage" TEXT NOT NULL DEFAULT 'visitor',
    "trustScore" INTEGER NOT NULL DEFAULT 50,
    "engagementScore" INTEGER NOT NULL DEFAULT 50,
    "resonanceScore" INTEGER NOT NULL DEFAULT 50,
    "tags" JSONB,
    "interests" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudienceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudienceInteraction" (
    "id" TEXT NOT NULL,
    "audienceProfileId" TEXT,
    "interactionType" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "score" INTEGER NOT NULL DEFAULT 50,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudienceInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudienceTopicSignal" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "pillar" TEXT,
    "signalType" TEXT NOT NULL,
    "strength" INTEGER NOT NULL DEFAULT 50,
    "source" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudienceTopicSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityInsightRun" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "audienceHealth" INTEGER NOT NULL DEFAULT 70,
    "resonanceHealth" INTEGER NOT NULL DEFAULT 70,
    "conversionHealth" INTEGER NOT NULL DEFAULT 70,
    "findings" JSONB,
    "recommendations" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityInsightRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AudienceProfile_email_key" ON "AudienceProfile"("email");

-- CreateIndex
CREATE INDEX "AudienceProfile_email_idx" ON "AudienceProfile"("email");

-- CreateIndex
CREATE INDEX "AudienceProfile_source_idx" ON "AudienceProfile"("source");

-- CreateIndex
CREATE INDEX "AudienceProfile_audienceType_idx" ON "AudienceProfile"("audienceType");

-- CreateIndex
CREATE INDEX "AudienceProfile_relationshipStage_idx" ON "AudienceProfile"("relationshipStage");

-- CreateIndex
CREATE INDEX "AudienceInteraction_audienceProfileId_idx" ON "AudienceInteraction"("audienceProfileId");

-- CreateIndex
CREATE INDEX "AudienceInteraction_interactionType_idx" ON "AudienceInteraction"("interactionType");

-- CreateIndex
CREATE INDEX "AudienceInteraction_channel_idx" ON "AudienceInteraction"("channel");

-- CreateIndex
CREATE INDEX "AudienceTopicSignal_topic_idx" ON "AudienceTopicSignal"("topic");

-- CreateIndex
CREATE INDEX "AudienceTopicSignal_pillar_idx" ON "AudienceTopicSignal"("pillar");

-- CreateIndex
CREATE INDEX "AudienceTopicSignal_signalType_idx" ON "AudienceTopicSignal"("signalType");

-- CreateIndex
CREATE INDEX "CommunityInsightRun_audienceHealth_idx" ON "CommunityInsightRun"("audienceHealth");

-- CreateIndex
CREATE INDEX "CommunityInsightRun_resonanceHealth_idx" ON "CommunityInsightRun"("resonanceHealth");
