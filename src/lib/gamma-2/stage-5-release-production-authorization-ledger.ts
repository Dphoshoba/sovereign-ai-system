import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5ReleaseGate } from "./stage-5-release-gate";
import { buildGammaStage5ReleaseOperatorApprovalReceipt } from "./stage-5-release-operator-approval-receipt";
import { buildGammaStage5ReleaseProjectionContext } from "./stage-5-release-projection-context";
import { projectGammaStage5ReleaseProductionAuthorizationLedger } from "./stage-5-release-projection-registry";

export interface GammaStage5ReleaseProductionAuthorizationEntry {
  order: number;
  id: string;
  label: string;
  source: string;
  evidence: string;
  status: "authorization-pending";
}

export interface GammaStage5ReleaseProductionAuthorizationLedger {
  id: "gamma_2_stage_5_release_production_authorization_ledger";
  status: "authorization-pending-human-production-approval";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  authorizationEntryCount: number;
  receiptRecordCount: number;
  releaseGateCheckCount: number;
  operatorRequiredCheckCount: number;
  smoke: string;
  approvalBoundary: "human-approval-before-production";
  entries: GammaStage5ReleaseProductionAuthorizationEntry[];
  authorizationRule: "stage-5-production-authorization-ledger-requires-receipt-release-gate-env-confirmation-and-human-approval";
}

export function buildGammaStage5ReleaseProductionAuthorizationLedgerSource(): GammaStage5ReleaseProductionAuthorizationLedger {
  const receipt = buildGammaStage5ReleaseOperatorApprovalReceipt();
  const releaseGate = buildGammaStage5ReleaseGate();
  const operatorRequiredCheckCount = releaseGate.checks.filter(
    (check) => check.status === "operator-required"
  ).length;

  const entries: GammaStage5ReleaseProductionAuthorizationEntry[] = [
    {
      order: 1,
      id: "operator-approval-receipt-bound",
      label: "Bind operator approval receipt",
      source: "/api/gamma/stage-5/release-operator-approval-receipt",
      evidence: receipt.receiptRule,
      status: "authorization-pending",
    },
    {
      order: 2,
      id: "release-gate-bound",
      label: "Bind release gate",
      source: "/api/gamma/stage-5/release-gate",
      evidence: releaseGate.releaseRule,
      status: "authorization-pending",
    },
    {
      order: 3,
      id: "production-origin-bound",
      label: "Bind production origin",
      source: "/api/gamma/stage-5/release-gate",
      evidence: PRODUCTION_APP_URL,
      status: "authorization-pending",
    },
    {
      order: 4,
      id: "human-approval-bound",
      label: "Bind human approval boundary",
      source: "/api/gamma/stage-5/release-gate",
      evidence: receipt.approvalBoundary,
      status: "authorization-pending",
    },
    {
      order: 5,
      id: "verification-bound",
      label: "Bind smoke verification",
      source: "/api/gamma/stage-5/health",
      evidence: receipt.smoke,
      status: "authorization-pending",
    },
  ];

  return {
    id: "gamma_2_stage_5_release_production_authorization_ledger",
    status: "authorization-pending-human-production-approval",
    generatedAt: new Date(receipt.generatedAt),
    branch: receipt.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: receipt.apiSurfaceCount,
    authorizationEntryCount: entries.length,
    receiptRecordCount: receipt.receiptRecordCount,
    releaseGateCheckCount: releaseGate.checks.length,
    operatorRequiredCheckCount,
    smoke: receipt.smoke,
    approvalBoundary: receipt.approvalBoundary,
    entries,
    authorizationRule:
      "stage-5-production-authorization-ledger-requires-receipt-release-gate-env-confirmation-and-human-approval",
  };
}

export function buildGammaStage5ReleaseProductionAuthorizationLedger(): GammaStage5ReleaseProductionAuthorizationLedger {
  return projectGammaStage5ReleaseProductionAuthorizationLedger(
    buildGammaStage5ReleaseProjectionContext()
  );
}
