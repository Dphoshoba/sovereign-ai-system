-- M2-PR3 emergency rollback for 20261118_add_connectors_and_istest.sql
-- Destructive. Apply ONLY with explicit Director authorisation after a failed forward apply.
-- Order: drop dependent Connector* tables, then isTest columns.

DROP TABLE IF EXISTS "ConnectorAudit" CASCADE;
DROP TABLE IF EXISTS "ConnectorApproval" CASCADE;
DROP TABLE IF EXISTS "ConnectorExecution" CASCADE;
DROP TABLE IF EXISTS "ConnectorAction" CASCADE;
DROP TABLE IF EXISTS "ConnectorConnection" CASCADE;
DROP TABLE IF EXISTS "ConnectorCredential" CASCADE;
DROP TABLE IF EXISTS "Connector" CASCADE;

ALTER TABLE "ClientProfile" DROP COLUMN IF EXISTS "isTest";
ALTER TABLE "ClientProject" DROP COLUMN IF EXISTS "isTest";
ALTER TABLE "ClientProjectTask" DROP COLUMN IF EXISTS "isTest";
ALTER TABLE "ClientInvoice" DROP COLUMN IF EXISTS "isTest";
ALTER TABLE "CreatorLead" DROP COLUMN IF EXISTS "isTest";
ALTER TABLE "CreatorProposal" DROP COLUMN IF EXISTS "isTest";
