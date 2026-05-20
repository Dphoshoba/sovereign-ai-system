-- CreateTable
CREATE TABLE "ExecutiveCopilotConversation" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutiveCopilotConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveCopilotMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutiveCopilotMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExecutiveCopilotConversation_createdAt_idx" ON "ExecutiveCopilotConversation"("createdAt");

-- CreateIndex
CREATE INDEX "ExecutiveCopilotMessage_conversationId_idx" ON "ExecutiveCopilotMessage"("conversationId");

-- CreateIndex
CREATE INDEX "ExecutiveCopilotMessage_role_idx" ON "ExecutiveCopilotMessage"("role");

-- CreateIndex
CREATE INDEX "ExecutiveCopilotMessage_createdAt_idx" ON "ExecutiveCopilotMessage"("createdAt");
