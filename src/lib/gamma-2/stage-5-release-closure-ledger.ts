import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5AuditLedger } from "./stage-5-audit-ledger";
import { buildGammaStage5DeploymentReceipt } from "./stage-5-deployment-receipt";
import { buildGammaStage5ReleaseAttestation } from "./stage-5-release-attestation";
import { buildGammaStage5ReleaseCloseoutPacketSource } from "./stage-5-release-closeout-packet";
import { buildGammaStage5ReleaseDecisionRecord } from "./stage-5-release-decision-record";
import { buildGammaStage5ReleaseOperationsIndexSource } from "./stage-5-release-operations-index";
import { buildGammaStage5ReleaseProjectionContext } from "./stage-5-release-projection-context";
import { projectGammaStage5ReleaseClosureLedger } from "./stage-5-release-projection-registry";

export interface GammaStage5ReleaseClosureLedgerEntry {
  order: number;
  id: string;
  source: string;
  evidence: string;
  actor: "operator" | "release-client";
  status: "pending-closure-record";
}

export interface GammaStage5ReleaseClosureLedger {
  id: "gamma_2_stage_5_release_closure_ledger";
  status: "pending-operator-closure";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  closureEntryCount: number;
  operationsStepCount: number;
  closeoutItemCount: number;
  auditEntryCount: number;
  passCheckCount: number;
  openExceptionCount: 0;
  smoke: string;
  entries: GammaStage5ReleaseClosureLedgerEntry[];
  closureRule: "stage-5-release-closure-ledger-requires-attestation-decision-receipt-audit-operations-and-closeout";
}

export function buildGammaStage5ReleaseClosureLedgerSource(): GammaStage5ReleaseClosureLedger {
  const closeoutPacket = buildGammaStage5ReleaseCloseoutPacketSource();
  const operationsIndex = buildGammaStage5ReleaseOperationsIndexSource();
  const attestation = buildGammaStage5ReleaseAttestation();
  const decisionRecord = buildGammaStage5ReleaseDecisionRecord();
  const deploymentReceipt = buildGammaStage5DeploymentReceipt();
  const auditLedger = buildGammaStage5AuditLedger();

  const entries: GammaStage5ReleaseClosureLedgerEntry[] = [
    {
      order: 1,
      id: "release-attestation-bound",
      source: "/api/gamma/stage-5/release-attestation",
      evidence: attestation.attestationRule,
      actor: "release-client",
      status: "pending-closure-record",
    },
    {
      order: 2,
      id: "promotion-decision-bound",
      source: "/api/gamma/stage-5/release-decision-record",
      evidence: decisionRecord.decisionRule,
      actor: "operator",
      status: "pending-closure-record",
    },
    {
      order: 3,
      id: "deployment-receipt-bound",
      source: "/api/gamma/stage-5/deployment-receipt",
      evidence: deploymentReceipt.receiptRule,
      actor: "operator",
      status: "pending-closure-record",
    },
    {
      order: 4,
      id: "audit-ledger-bound",
      source: "/api/gamma/stage-5/audit-ledger",
      evidence: auditLedger.auditRule,
      actor: "operator",
      status: "pending-closure-record",
    },
    {
      order: 5,
      id: "operations-index-bound",
      source: "/api/gamma/stage-5/release-operations-index",
      evidence: operationsIndex.operationsRule,
      actor: "operator",
      status: "pending-closure-record",
    },
    {
      order: 6,
      id: "closeout-packet-bound",
      source: "/api/gamma/stage-5/release-closeout-packet",
      evidence: closeoutPacket.closeoutRule,
      actor: "operator",
      status: "pending-closure-record",
    },
  ];

  return {
    id: "gamma_2_stage_5_release_closure_ledger",
    status: "pending-operator-closure",
    generatedAt: new Date(closeoutPacket.generatedAt),
    branch: closeoutPacket.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: closeoutPacket.apiSurfaceCount,
    closureEntryCount: entries.length,
    operationsStepCount: operationsIndex.operationsStepCount,
    closeoutItemCount: closeoutPacket.closeoutItemCount,
    auditEntryCount: auditLedger.entries.length,
    passCheckCount: decisionRecord.passCheckCount,
    openExceptionCount: decisionRecord.openExceptionCount,
    smoke: closeoutPacket.smoke,
    entries,
    closureRule:
      "stage-5-release-closure-ledger-requires-attestation-decision-receipt-audit-operations-and-closeout",
  };
}

export function buildGammaStage5ReleaseClosureLedger(): GammaStage5ReleaseClosureLedger {
  return projectGammaStage5ReleaseClosureLedger(buildGammaStage5ReleaseProjectionContext());
}
