-- CreateTable
CREATE TABLE "IdentityUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "defaultOrgId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentitySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organizationId" TEXT,
    "workspaceId" TEXT,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentitySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationInvitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "invitedBy" TEXT,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessDecisionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "organizationId" TEXT,
    "workspaceId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT,
    "role" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessDecisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantAccessPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "allowedRoles" JSONB,
    "enforcement" TEXT NOT NULL DEFAULT 'strict',
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantAccessPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdentityUser_email_key" ON "IdentityUser"("email");

-- CreateIndex
CREATE INDEX "IdentityUser_email_idx" ON "IdentityUser"("email");

-- CreateIndex
CREATE INDEX "IdentityUser_status_idx" ON "IdentityUser"("status");

-- CreateIndex
CREATE INDEX "IdentityUser_defaultOrgId_idx" ON "IdentityUser"("defaultOrgId");

-- CreateIndex
CREATE INDEX "IdentitySession_userId_idx" ON "IdentitySession"("userId");

-- CreateIndex
CREATE INDEX "IdentitySession_email_idx" ON "IdentitySession"("email");

-- CreateIndex
CREATE INDEX "IdentitySession_organizationId_idx" ON "IdentitySession"("organizationId");

-- CreateIndex
CREATE INDEX "IdentitySession_workspaceId_idx" ON "IdentitySession"("workspaceId");

-- CreateIndex
CREATE INDEX "IdentitySession_status_idx" ON "IdentitySession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationInvitation_token_key" ON "OrganizationInvitation"("token");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_organizationId_idx" ON "OrganizationInvitation"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_email_idx" ON "OrganizationInvitation"("email");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_role_idx" ON "OrganizationInvitation"("role");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_status_idx" ON "OrganizationInvitation"("status");

-- CreateIndex
CREATE INDEX "AccessDecisionLog_userId_idx" ON "AccessDecisionLog"("userId");

-- CreateIndex
CREATE INDEX "AccessDecisionLog_email_idx" ON "AccessDecisionLog"("email");

-- CreateIndex
CREATE INDEX "AccessDecisionLog_organizationId_idx" ON "AccessDecisionLog"("organizationId");

-- CreateIndex
CREATE INDEX "AccessDecisionLog_workspaceId_idx" ON "AccessDecisionLog"("workspaceId");

-- CreateIndex
CREATE INDEX "AccessDecisionLog_action_idx" ON "AccessDecisionLog"("action");

-- CreateIndex
CREATE INDEX "AccessDecisionLog_decision_idx" ON "AccessDecisionLog"("decision");

-- CreateIndex
CREATE INDEX "TenantAccessPolicy_organizationId_idx" ON "TenantAccessPolicy"("organizationId");

-- CreateIndex
CREATE INDEX "TenantAccessPolicy_resource_idx" ON "TenantAccessPolicy"("resource");

-- CreateIndex
CREATE INDEX "TenantAccessPolicy_action_idx" ON "TenantAccessPolicy"("action");

-- CreateIndex
CREATE INDEX "TenantAccessPolicy_status_idx" ON "TenantAccessPolicy"("status");
