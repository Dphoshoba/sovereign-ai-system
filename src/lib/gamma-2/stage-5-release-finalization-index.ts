import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5AuditLedger } from "./stage-5-audit-ledger";
import { buildGammaStage5DeploymentReceipt } from "./stage-5-deployment-receipt";
import { buildGammaStage5OperatorSignoffSource } from "./stage-5-operator-signoff";
import { buildGammaStage5ReleaseClosureLedgerSource } from "./stage-5-release-closure-ledger";
import { buildGammaStage5ReleaseCompletionCertificateSource } from "./stage-5-release-completion-certificate";
import { buildGammaStage5ReleaseProjectionContext } from "./stage-5-release-projection-context";
import { projectGammaStage5ReleaseFinalizationIndex } from "./stage-5-release-projection-registry";

export interface GammaStage5ReleaseFinalizationIndexEntry {
  order: number;
  id: string;
  source: string;
  evidence: string;
  owner: "operator" | "release-client";
  status: "pending-final-operator-review";
}

export interface GammaStage5ReleaseFinalizationIndex {
  id: "gamma_2_stage_5_release_finalization_index";
  status: "pending-final-operator-review";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  finalizationEntryCount: number;
  closureEntryCount: number;
  certificateEvidenceCount: number;
  signoffRequirementCount: number;
  auditEntryCount: number;
  receiptArtifactCount: number;
  openExceptionCount: 0;
  smoke: string;
  entries: GammaStage5ReleaseFinalizationIndexEntry[];
  finalizationRule: "stage-5-release-finalization-index-requires-certificate-closure-signoff-receipt-and-audit-evidence";
}

export function buildGammaStage5ReleaseFinalizationIndexSource(): GammaStage5ReleaseFinalizationIndex {
  const completionCertificate = buildGammaStage5ReleaseCompletionCertificateSource();
  const closureLedger = buildGammaStage5ReleaseClosureLedgerSource();
  const operatorSignoff = buildGammaStage5OperatorSignoffSource();
  const deploymentReceipt = buildGammaStage5DeploymentReceipt();
  const auditLedger = buildGammaStage5AuditLedger();

  const entries: GammaStage5ReleaseFinalizationIndexEntry[] = [
    {
      order: 1,
      id: "completion-certificate-bound",
      source: "/api/gamma/stage-5/release-completion-certificate",
      evidence: completionCertificate.certificateRule,
      owner: "operator",
      status: "pending-final-operator-review",
    },
    {
      order: 2,
      id: "closure-ledger-bound",
      source: "/api/gamma/stage-5/release-closure-ledger",
      evidence: closureLedger.closureRule,
      owner: "operator",
      status: "pending-final-operator-review",
    },
    {
      order: 3,
      id: "operator-signoff-bound",
      source: "/api/gamma/stage-5/operator-signoff",
      evidence: operatorSignoff.signoffRule,
      owner: "operator",
      status: "pending-final-operator-review",
    },
    {
      order: 4,
      id: "deployment-receipt-bound",
      source: "/api/gamma/stage-5/deployment-receipt",
      evidence: deploymentReceipt.receiptRule,
      owner: "operator",
      status: "pending-final-operator-review",
    },
    {
      order: 5,
      id: "audit-ledger-bound",
      source: "/api/gamma/stage-5/audit-ledger",
      evidence: auditLedger.auditRule,
      owner: "release-client",
      status: "pending-final-operator-review",
    },
  ];

  return {
    id: "gamma_2_stage_5_release_finalization_index",
    status: "pending-final-operator-review",
    generatedAt: new Date(completionCertificate.generatedAt),
    branch: completionCertificate.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: completionCertificate.apiSurfaceCount,
    finalizationEntryCount: entries.length,
    closureEntryCount: closureLedger.closureEntryCount,
    certificateEvidenceCount: completionCertificate.evidence.length,
    signoffRequirementCount: operatorSignoff.requirements.length,
    auditEntryCount: auditLedger.entries.length,
    receiptArtifactCount: deploymentReceipt.receiptArtifacts.length,
    openExceptionCount: completionCertificate.openExceptionCount,
    smoke: completionCertificate.smoke,
    entries,
    finalizationRule:
      "stage-5-release-finalization-index-requires-certificate-closure-signoff-receipt-and-audit-evidence",
  };
}

export function buildGammaStage5ReleaseFinalizationIndex(): GammaStage5ReleaseFinalizationIndex {
  return projectGammaStage5ReleaseFinalizationIndex(buildGammaStage5ReleaseProjectionContext());
}
