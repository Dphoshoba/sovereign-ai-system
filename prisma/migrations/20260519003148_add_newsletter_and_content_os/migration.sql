-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "source" TEXT NOT NULL DEFAULT 'echoesandvisions-ai',
    "status" TEXT NOT NULL DEFAULT 'active',
    "tags" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentOperatingItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'youtube',
    "pillar" TEXT,
    "status" TEXT NOT NULL DEFAULT 'idea',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "script" TEXT,
    "hook" TEXT,
    "description" TEXT,
    "cta" TEXT,
    "tags" JSONB,
    "publishAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentOperatingItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_email_idx" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_source_idx" ON "NewsletterSubscriber"("source");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_status_idx" ON "NewsletterSubscriber"("status");

-- CreateIndex
CREATE INDEX "ContentOperatingItem_contentType_idx" ON "ContentOperatingItem"("contentType");

-- CreateIndex
CREATE INDEX "ContentOperatingItem_channel_idx" ON "ContentOperatingItem"("channel");

-- CreateIndex
CREATE INDEX "ContentOperatingItem_pillar_idx" ON "ContentOperatingItem"("pillar");

-- CreateIndex
CREATE INDEX "ContentOperatingItem_status_idx" ON "ContentOperatingItem"("status");

-- CreateIndex
CREATE INDEX "ContentOperatingItem_priority_idx" ON "ContentOperatingItem"("priority");

-- CreateIndex
CREATE INDEX "ContentOperatingItem_publishAt_idx" ON "ContentOperatingItem"("publishAt");
