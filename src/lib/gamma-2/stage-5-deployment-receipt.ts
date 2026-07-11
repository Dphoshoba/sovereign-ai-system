import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5AuditLedger } from "./stage-5-audit-ledger";
import { buildGammaStage5DeploymentSummary } from "./stage-5-deployment-summary";
import { buildGammaStage5ReleaseAttestation } from "./stage-5-release-attestation";

export interface GammaStage5DeploymentReceipt {
  id: "gamma_2_stage_5_deployment_receipt";
  status: "ready-for-post-promotion-record";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  digestFingerprint: string;
  apiSurfaceCount: number;
  auditEntryCount: number;
  verification: {
    build: string;
    smoke: string;
  };
  receiptArtifacts: string[];
  receiptRule: "post-promotion-record-must-reference-attestation-and-audit-ledger";
}

export function buildGammaStage5DeploymentReceipt(): GammaStage5DeploymentReceipt {
  const deploymentSummary = buildGammaStage5DeploymentSummary();
  const attestation = buildGammaStage5ReleaseAttestation();
  const auditLedger = buildGammaStage5AuditLedger();

  return {
    id: "gamma_2_stage_5_deployment_receipt",
    status: "ready-for-post-promotion-record",
    generatedAt: new Date(deploymentSummary.generatedAt),
    branch: attestation.branch,
    productionUrl: PRODUCTION_APP_URL,
    digestFingerprint: attestation.digest.fingerprint,
    apiSurfaceCount: deploymentSummary.apiSurface.length,
    auditEntryCount: auditLedger.entries.length,
    verification: {
      build: deploymentSummary.verification.build,
      smoke: deploymentSummary.verification.smoke,
    },
    receiptArtifacts: [
      "/api/gamma/stage-5/release-attestation",
      "/api/gamma/stage-5/audit-ledger",
      "/api/gamma/stage-5/deployment-summary",
      "/api/gamma/stage-5/contract-digest",
    ],
    receiptRule: "post-promotion-record-must-reference-attestation-and-audit-ledger",
  };
}
