-- CreateTable
CREATE TABLE "BillingPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "priceAud" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "limits" JSONB,
    "features" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSubscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT,
    "planSlug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageMeterEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "meterType" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'event',
    "sourceLayer" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "costAud" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageMeterEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantQuotaState" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "meterType" TEXT NOT NULL,
    "limitValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usedValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "resetPeriod" TEXT NOT NULL DEFAULT 'monthly',
    "resetAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'within-limit',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantQuotaState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingInvoiceRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "amountAud" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "stripeInvoiceId" TEXT,
    "lineItems" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingInvoiceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingIntelligenceRun" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "revenueHealth" INTEGER NOT NULL DEFAULT 75,
    "usageHealth" INTEGER NOT NULL DEFAULT 75,
    "quotaRisk" INTEGER NOT NULL DEFAULT 30,
    "costRisk" INTEGER NOT NULL DEFAULT 30,
    "summary" TEXT,
    "findings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingIntelligenceRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingPlan_name_key" ON "BillingPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BillingPlan_slug_key" ON "BillingPlan"("slug");

-- CreateIndex
CREATE INDEX "BillingPlan_slug_idx" ON "BillingPlan"("slug");

-- CreateIndex
CREATE INDEX "BillingPlan_status_idx" ON "BillingPlan"("status");

-- CreateIndex
CREATE INDEX "TenantSubscription_organizationId_idx" ON "TenantSubscription"("organizationId");

-- CreateIndex
CREATE INDEX "TenantSubscription_planSlug_idx" ON "TenantSubscription"("planSlug");

-- CreateIndex
CREATE INDEX "TenantSubscription_status_idx" ON "TenantSubscription"("status");

-- CreateIndex
CREATE INDEX "TenantSubscription_stripeCustomerId_idx" ON "TenantSubscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "TenantSubscription_stripeSubscriptionId_idx" ON "TenantSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "UsageMeterEvent_organizationId_idx" ON "UsageMeterEvent"("organizationId");

-- CreateIndex
CREATE INDEX "UsageMeterEvent_workspaceId_idx" ON "UsageMeterEvent"("workspaceId");

-- CreateIndex
CREATE INDEX "UsageMeterEvent_meterType_idx" ON "UsageMeterEvent"("meterType");

-- CreateIndex
CREATE INDEX "UsageMeterEvent_sourceLayer_idx" ON "UsageMeterEvent"("sourceLayer");

-- CreateIndex
CREATE INDEX "UsageMeterEvent_referenceType_idx" ON "UsageMeterEvent"("referenceType");

-- CreateIndex
CREATE INDEX "UsageMeterEvent_createdAt_idx" ON "UsageMeterEvent"("createdAt");

-- CreateIndex
CREATE INDEX "TenantQuotaState_organizationId_idx" ON "TenantQuotaState"("organizationId");

-- CreateIndex
CREATE INDEX "TenantQuotaState_meterType_idx" ON "TenantQuotaState"("meterType");

-- CreateIndex
CREATE INDEX "TenantQuotaState_status_idx" ON "TenantQuotaState"("status");

-- CreateIndex
CREATE INDEX "TenantQuotaState_resetAt_idx" ON "TenantQuotaState"("resetAt");

-- CreateIndex
CREATE UNIQUE INDEX "TenantQuotaState_organizationId_meterType_key" ON "TenantQuotaState"("organizationId", "meterType");

-- CreateIndex
CREATE INDEX "BillingInvoiceRecord_organizationId_idx" ON "BillingInvoiceRecord"("organizationId");

-- CreateIndex
CREATE INDEX "BillingInvoiceRecord_status_idx" ON "BillingInvoiceRecord"("status");

-- CreateIndex
CREATE INDEX "BillingInvoiceRecord_invoiceNumber_idx" ON "BillingInvoiceRecord"("invoiceNumber");

-- CreateIndex
CREATE INDEX "BillingInvoiceRecord_stripeInvoiceId_idx" ON "BillingInvoiceRecord"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "BillingIntelligenceRun_status_idx" ON "BillingIntelligenceRun"("status");

-- CreateIndex
CREATE INDEX "BillingIntelligenceRun_revenueHealth_idx" ON "BillingIntelligenceRun"("revenueHealth");

-- CreateIndex
CREATE INDEX "BillingIntelligenceRun_quotaRisk_idx" ON "BillingIntelligenceRun"("quotaRisk");

-- CreateIndex
CREATE INDEX "BillingIntelligenceRun_costRisk_idx" ON "BillingIntelligenceRun"("costRisk");
