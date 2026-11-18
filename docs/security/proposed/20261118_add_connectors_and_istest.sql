-- M2-PR3 proposed forward migration (NOT APPLIED)
-- Source: prisma migrate diff --from-schema origin/main --to-schema 6258cada
-- Scope: six isTest columns + seven Connector* tables/indexes/FKs
-- Safety: additive only (no DROP/TRUNCATE/DELETE)
-- Apply only with explicit Director authorisation to a named target DB.
-- Do NOT run against Production or Preview without that authorisation.

-- AlterTable
ALTER TABLE "ClientProfile" ADD COLUMN     "isTest" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ClientProject" ADD COLUMN     "isTest" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ClientProjectTask" ADD COLUMN     "isTest" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ClientInvoice" ADD COLUMN     "isTest" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CreatorLead" ADD COLUMN     "isTest" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CreatorProposal" ADD COLUMN     "isTest" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Connector" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "authType" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectorConnection" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "accountId" TEXT NOT NULL,
    "email" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastUsedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectorConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectorAction" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "scope" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "inputSchema" JSONB NOT NULL,
    "outputSchema" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectorAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectorExecution" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "actionName" TEXT NOT NULL,
    "actionParams" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "preview" JSONB,
    "previewedAt" TIMESTAMP(3),
    "approvalStatus" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvalNote" TEXT,
    "approvedAt" TIMESTAMP(3),
    "result" JSONB,
    "error" TEXT,
    "executedAt" TIMESTAMP(3),
    "queuedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectorExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectorApproval" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "reviewer" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT,
    "requestedChange" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectorApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectorAudit" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "input" JSONB,
    "output" JSONB,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "approvalPath" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectorAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectorCredential" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'dev',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectorCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Connector_key_key" ON "Connector"("key");

-- CreateIndex
CREATE INDEX "Connector_provider_idx" ON "Connector"("provider");

-- CreateIndex
CREATE INDEX "Connector_category_idx" ON "Connector"("category");

-- CreateIndex
CREATE INDEX "Connector_enabled_idx" ON "Connector"("enabled");

-- CreateIndex
CREATE INDEX "ConnectorConnection_userId_idx" ON "ConnectorConnection"("userId");

-- CreateIndex
CREATE INDEX "ConnectorConnection_status_idx" ON "ConnectorConnection"("status");

-- CreateIndex
CREATE INDEX "ConnectorConnection_createdAt_idx" ON "ConnectorConnection"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectorConnection_connectorId_userId_accountId_key" ON "ConnectorConnection"("connectorId", "userId", "accountId");

-- CreateIndex
CREATE INDEX "ConnectorAction_riskLevel_idx" ON "ConnectorAction"("riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectorAction_connectorId_name_key" ON "ConnectorAction"("connectorId", "name");

-- CreateIndex
CREATE INDEX "ConnectorExecution_status_idx" ON "ConnectorExecution"("status");

-- CreateIndex
CREATE INDEX "ConnectorExecution_approvalStatus_idx" ON "ConnectorExecution"("approvalStatus");

-- CreateIndex
CREATE INDEX "ConnectorExecution_actionName_idx" ON "ConnectorExecution"("actionName");

-- CreateIndex
CREATE INDEX "ConnectorExecution_createdAt_idx" ON "ConnectorExecution"("createdAt");

-- CreateIndex
CREATE INDEX "ConnectorApproval_executionId_idx" ON "ConnectorApproval"("executionId");

-- CreateIndex
CREATE INDEX "ConnectorApproval_reviewer_idx" ON "ConnectorApproval"("reviewer");

-- CreateIndex
CREATE INDEX "ConnectorApproval_decision_idx" ON "ConnectorApproval"("decision");

-- CreateIndex
CREATE INDEX "ConnectorAudit_connectorId_idx" ON "ConnectorAudit"("connectorId");

-- CreateIndex
CREATE INDEX "ConnectorAudit_action_idx" ON "ConnectorAudit"("action");

-- CreateIndex
CREATE INDEX "ConnectorAudit_operator_idx" ON "ConnectorAudit"("operator");

-- CreateIndex
CREATE INDEX "ConnectorAudit_status_idx" ON "ConnectorAudit"("status");

-- CreateIndex
CREATE INDEX "ConnectorAudit_timestamp_idx" ON "ConnectorAudit"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectorCredential_key_key" ON "ConnectorCredential"("key");

-- CreateIndex
CREATE INDEX "ConnectorCredential_key_idx" ON "ConnectorCredential"("key");

-- CreateIndex
CREATE INDEX "ConnectorCredential_environment_idx" ON "ConnectorCredential"("environment");

-- AddForeignKey
ALTER TABLE "ConnectorConnection" ADD CONSTRAINT "ConnectorConnection_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorAction" ADD CONSTRAINT "ConnectorAction_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorExecution" ADD CONSTRAINT "ConnectorExecution_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorExecution" ADD CONSTRAINT "ConnectorExecution_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ConnectorConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorApproval" ADD CONSTRAINT "ConnectorApproval_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "ConnectorExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorAudit" ADD CONSTRAINT "ConnectorAudit_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorAudit" ADD CONSTRAINT "ConnectorAudit_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ConnectorConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorAudit" ADD CONSTRAINT "ConnectorAudit_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "ConnectorExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
