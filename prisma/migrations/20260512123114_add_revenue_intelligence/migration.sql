-- CreateTable
CREATE TABLE "RevenueRecord" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "clientName" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'received',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueInsight" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "insight" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "confidence" DOUBLE PRECISION,
    "source" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RevenueRecord_source_idx" ON "RevenueRecord"("source");

-- CreateIndex
CREATE INDEX "RevenueRecord_category_idx" ON "RevenueRecord"("category");

-- CreateIndex
CREATE INDEX "RevenueRecord_status_idx" ON "RevenueRecord"("status");

-- CreateIndex
CREATE INDEX "RevenueRecord_createdAt_idx" ON "RevenueRecord"("createdAt");

-- CreateIndex
CREATE INDEX "RevenueInsight_priority_idx" ON "RevenueInsight"("priority");

-- CreateIndex
CREATE INDEX "RevenueInsight_createdAt_idx" ON "RevenueInsight"("createdAt");
