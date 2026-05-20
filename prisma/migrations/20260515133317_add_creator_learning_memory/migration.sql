-- CreateTable
CREATE TABLE "CreatorLearningMemory" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "insight" TEXT NOT NULL,
    "evidence" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorLearningMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorLearningRun" (
    "id" TEXT NOT NULL,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "findings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorLearningRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreatorLearningMemory_type_idx" ON "CreatorLearningMemory"("type");

-- CreateIndex
CREATE INDEX "CreatorLearningMemory_priority_idx" ON "CreatorLearningMemory"("priority");

-- CreateIndex
CREATE INDEX "CreatorLearningMemory_status_idx" ON "CreatorLearningMemory"("status");

-- CreateIndex
CREATE INDEX "CreatorLearningMemory_createdAt_idx" ON "CreatorLearningMemory"("createdAt");

-- CreateIndex
CREATE INDEX "CreatorLearningRun_status_idx" ON "CreatorLearningRun"("status");

-- CreateIndex
CREATE INDEX "CreatorLearningRun_createdAt_idx" ON "CreatorLearningRun"("createdAt");
