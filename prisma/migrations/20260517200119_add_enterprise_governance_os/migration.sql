-- CreateTable
CREATE TABLE "GovernanceRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB,
    "authorityLevel" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceActor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "actorType" TEXT NOT NULL DEFAULT 'human',
    "roleId" TEXT,
    "roleName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceActor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstitutionalPolicy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "policyArea" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "enforcement" TEXT NOT NULL DEFAULT 'approval-required',
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'active',
    "conditions" JSONB,
    "allowedRoles" JSONB,
    "blockedActions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstitutionalPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionAuthorizationRequest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "requestedBy" TEXT,
    "requestedRole" TEXT,
    "actionType" TEXT NOT NULL,
    "targetLayer" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rationale" TEXT,
    "policyMatches" JSONB,
    "approvedBy" TEXT,
    "rejectedBy" TEXT,
    "decisionNotes" TEXT,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutionAuthorizationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceAuditTrail" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actor" TEXT,
    "actorRole" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "action" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernanceAuditTrail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GovernanceRole_name_key" ON "GovernanceRole"("name");

-- CreateIndex
CREATE INDEX "GovernanceRole_authorityLevel_idx" ON "GovernanceRole"("authorityLevel");

-- CreateIndex
CREATE INDEX "GovernanceRole_status_idx" ON "GovernanceRole"("status");

-- CreateIndex
CREATE INDEX "GovernanceActor_email_idx" ON "GovernanceActor"("email");

-- CreateIndex
CREATE INDEX "GovernanceActor_actorType_idx" ON "GovernanceActor"("actorType");

-- CreateIndex
CREATE INDEX "GovernanceActor_roleName_idx" ON "GovernanceActor"("roleName");

-- CreateIndex
CREATE INDEX "GovernanceActor_status_idx" ON "GovernanceActor"("status");

-- CreateIndex
CREATE INDEX "ConstitutionalPolicy_policyArea_idx" ON "ConstitutionalPolicy"("policyArea");

-- CreateIndex
CREATE INDEX "ConstitutionalPolicy_ruleType_idx" ON "ConstitutionalPolicy"("ruleType");

-- CreateIndex
CREATE INDEX "ConstitutionalPolicy_enforcement_idx" ON "ConstitutionalPolicy"("enforcement");

-- CreateIndex
CREATE INDEX "ConstitutionalPolicy_severity_idx" ON "ConstitutionalPolicy"("severity");

-- CreateIndex
CREATE INDEX "ConstitutionalPolicy_status_idx" ON "ConstitutionalPolicy"("status");

-- CreateIndex
CREATE INDEX "ExecutionAuthorizationRequest_targetType_idx" ON "ExecutionAuthorizationRequest"("targetType");

-- CreateIndex
CREATE INDEX "ExecutionAuthorizationRequest_targetId_idx" ON "ExecutionAuthorizationRequest"("targetId");

-- CreateIndex
CREATE INDEX "ExecutionAuthorizationRequest_actionType_idx" ON "ExecutionAuthorizationRequest"("actionType");

-- CreateIndex
CREATE INDEX "ExecutionAuthorizationRequest_targetLayer_idx" ON "ExecutionAuthorizationRequest"("targetLayer");

-- CreateIndex
CREATE INDEX "ExecutionAuthorizationRequest_riskLevel_idx" ON "ExecutionAuthorizationRequest"("riskLevel");

-- CreateIndex
CREATE INDEX "ExecutionAuthorizationRequest_status_idx" ON "ExecutionAuthorizationRequest"("status");

-- CreateIndex
CREATE INDEX "GovernanceAuditTrail_eventType_idx" ON "GovernanceAuditTrail"("eventType");

-- CreateIndex
CREATE INDEX "GovernanceAuditTrail_actor_idx" ON "GovernanceAuditTrail"("actor");

-- CreateIndex
CREATE INDEX "GovernanceAuditTrail_actorRole_idx" ON "GovernanceAuditTrail"("actorRole");

-- CreateIndex
CREATE INDEX "GovernanceAuditTrail_targetType_idx" ON "GovernanceAuditTrail"("targetType");

-- CreateIndex
CREATE INDEX "GovernanceAuditTrail_outcome_idx" ON "GovernanceAuditTrail"("outcome");

-- CreateIndex
CREATE INDEX "GovernanceAuditTrail_severity_idx" ON "GovernanceAuditTrail"("severity");
