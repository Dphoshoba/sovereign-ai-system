-- CreateTable
CREATE TABLE "EmailExecution" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "provider" TEXT NOT NULL DEFAULT 'resend',
    "leadId" TEXT,
    "source" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "providerId" TEXT,
    "error" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailExecution_to_idx" ON "EmailExecution"("to");

-- CreateIndex
CREATE INDEX "EmailExecution_status_idx" ON "EmailExecution"("status");

-- CreateIndex
CREATE INDEX "EmailExecution_leadId_idx" ON "EmailExecution"("leadId");

-- CreateIndex
CREATE INDEX "EmailExecution_provider_idx" ON "EmailExecution"("provider");

-- CreateIndex
CREATE INDEX "EmailExecution_createdAt_idx" ON "EmailExecution"("createdAt");
