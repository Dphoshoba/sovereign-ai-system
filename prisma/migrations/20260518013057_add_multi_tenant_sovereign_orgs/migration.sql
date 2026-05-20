-- CreateTable
CREATE TABLE "SovereignOrganization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "orgType" TEXT NOT NULL DEFAULT 'creator',
    "status" TEXT NOT NULL DEFAULT 'active',
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "ownerEmail" TEXT,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SovereignOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationWorkspace" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "workspaceType" TEXT NOT NULL DEFAULT 'operations',
    "status" TEXT NOT NULL DEFAULT 'active',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "status" TEXT NOT NULL DEFAULT 'active',
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantIntelligenceRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "recordType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "sourceLayer" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'active',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantIntelligenceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantGovernancePolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "policyType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "enforcement" TEXT NOT NULL DEFAULT 'approval-required',
    "status" TEXT NOT NULL DEFAULT 'active',
    "rules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantGovernancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantRuntimeSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "healthScore" INTEGER NOT NULL DEFAULT 75,
    "governanceScore" INTEGER NOT NULL DEFAULT 75,
    "executionScore" INTEGER NOT NULL DEFAULT 75,
    "economicScore" INTEGER NOT NULL DEFAULT 75,
    "summary" TEXT,
    "state" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantRuntimeSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SovereignOrganization_slug_key" ON "SovereignOrganization"("slug");

-- CreateIndex
CREATE INDEX "SovereignOrganization_slug_idx" ON "SovereignOrganization"("slug");

-- CreateIndex
CREATE INDEX "SovereignOrganization_orgType_idx" ON "SovereignOrganization"("orgType");

-- CreateIndex
CREATE INDEX "SovereignOrganization_status_idx" ON "SovereignOrganization"("status");

-- CreateIndex
CREATE INDEX "SovereignOrganization_plan_idx" ON "SovereignOrganization"("plan");

-- CreateIndex
CREATE INDEX "OrganizationWorkspace_organizationId_idx" ON "OrganizationWorkspace"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationWorkspace_slug_idx" ON "OrganizationWorkspace"("slug");

-- CreateIndex
CREATE INDEX "OrganizationWorkspace_workspaceType_idx" ON "OrganizationWorkspace"("workspaceType");

-- CreateIndex
CREATE INDEX "OrganizationWorkspace_status_idx" ON "OrganizationWorkspace"("status");

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationMember_email_idx" ON "OrganizationMember"("email");

-- CreateIndex
CREATE INDEX "OrganizationMember_role_idx" ON "OrganizationMember"("role");

-- CreateIndex
CREATE INDEX "OrganizationMember_status_idx" ON "OrganizationMember"("status");

-- CreateIndex
CREATE INDEX "TenantIntelligenceRecord_organizationId_idx" ON "TenantIntelligenceRecord"("organizationId");

-- CreateIndex
CREATE INDEX "TenantIntelligenceRecord_workspaceId_idx" ON "TenantIntelligenceRecord"("workspaceId");

-- CreateIndex
CREATE INDEX "TenantIntelligenceRecord_recordType_idx" ON "TenantIntelligenceRecord"("recordType");

-- CreateIndex
CREATE INDEX "TenantIntelligenceRecord_sourceLayer_idx" ON "TenantIntelligenceRecord"("sourceLayer");

-- CreateIndex
CREATE INDEX "TenantIntelligenceRecord_priority_idx" ON "TenantIntelligenceRecord"("priority");

-- CreateIndex
CREATE INDEX "TenantIntelligenceRecord_status_idx" ON "TenantIntelligenceRecord"("status");

-- CreateIndex
CREATE INDEX "TenantGovernancePolicy_organizationId_idx" ON "TenantGovernancePolicy"("organizationId");

-- CreateIndex
CREATE INDEX "TenantGovernancePolicy_policyType_idx" ON "TenantGovernancePolicy"("policyType");

-- CreateIndex
CREATE INDEX "TenantGovernancePolicy_severity_idx" ON "TenantGovernancePolicy"("severity");

-- CreateIndex
CREATE INDEX "TenantGovernancePolicy_enforcement_idx" ON "TenantGovernancePolicy"("enforcement");

-- CreateIndex
CREATE INDEX "TenantGovernancePolicy_status_idx" ON "TenantGovernancePolicy"("status");

-- CreateIndex
CREATE INDEX "TenantRuntimeSnapshot_organizationId_idx" ON "TenantRuntimeSnapshot"("organizationId");

-- CreateIndex
CREATE INDEX "TenantRuntimeSnapshot_workspaceId_idx" ON "TenantRuntimeSnapshot"("workspaceId");

-- CreateIndex
CREATE INDEX "TenantRuntimeSnapshot_status_idx" ON "TenantRuntimeSnapshot"("status");

-- CreateIndex
CREATE INDEX "TenantRuntimeSnapshot_healthScore_idx" ON "TenantRuntimeSnapshot"("healthScore");
