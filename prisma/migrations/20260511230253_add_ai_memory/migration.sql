-- CreateTable
CREATE TABLE "AiMemory" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiMemory_type_idx" ON "AiMemory"("type");

-- CreateIndex
CREATE INDEX "AiMemory_createdAt_idx" ON "AiMemory"("createdAt");
