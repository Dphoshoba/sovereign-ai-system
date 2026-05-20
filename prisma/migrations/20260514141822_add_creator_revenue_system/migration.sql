-- CreateTable
CREATE TABLE "CreatorProposal" (
    "id" TEXT NOT NULL,
    "auditId" TEXT,
    "leadId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "packageType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "estimatedValue" DOUBLE PRECISION,
    "implementationWeeks" INTEGER,
    "proposalContent" TEXT,
    "pricingBreakdown" JSONB,
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorInvoice" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT,
    "leadId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "paymentLink" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorRevenueEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "leadId" TEXT,
    "proposalId" TEXT,
    "invoiceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorRevenueEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreatorProposal_auditId_idx" ON "CreatorProposal"("auditId");

-- CreateIndex
CREATE INDEX "CreatorProposal_leadId_idx" ON "CreatorProposal"("leadId");

-- CreateIndex
CREATE INDEX "CreatorProposal_status_idx" ON "CreatorProposal"("status");

-- CreateIndex
CREATE INDEX "CreatorProposal_createdAt_idx" ON "CreatorProposal"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorInvoice_invoiceNumber_key" ON "CreatorInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "CreatorInvoice_proposalId_idx" ON "CreatorInvoice"("proposalId");

-- CreateIndex
CREATE INDEX "CreatorInvoice_leadId_idx" ON "CreatorInvoice"("leadId");

-- CreateIndex
CREATE INDEX "CreatorInvoice_status_idx" ON "CreatorInvoice"("status");

-- CreateIndex
CREATE INDEX "CreatorInvoice_createdAt_idx" ON "CreatorInvoice"("createdAt");

-- CreateIndex
CREATE INDEX "CreatorRevenueEvent_type_idx" ON "CreatorRevenueEvent"("type");

-- CreateIndex
CREATE INDEX "CreatorRevenueEvent_status_idx" ON "CreatorRevenueEvent"("status");

-- CreateIndex
CREATE INDEX "CreatorRevenueEvent_leadId_idx" ON "CreatorRevenueEvent"("leadId");

-- CreateIndex
CREATE INDEX "CreatorRevenueEvent_createdAt_idx" ON "CreatorRevenueEvent"("createdAt");
