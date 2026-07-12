import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5ReadinessSnapshot } from "./stage-5-readiness";
import { buildGammaStage5ReleaseAttestation } from "./stage-5-release-attestation";
import { buildGammaStage5ReleaseCloseoutPacket } from "./stage-5-release-closeout-packet";
import { buildGammaStage5ReleaseClosureLedger } from "./stage-5-release-closure-ledger";
import { buildGammaStage5ReleaseRetentionPolicy } from "./stage-5-release-retention-policy";

export interface GammaStage5ReleaseCompletionCertificateEvidence {
  order: number;
  id: string;
  source: string;
  evidence: string;
  owner: "operator" | "release-client";
  status: "pending-operator-certification";
}

export interface GammaStage5ReleaseCompletionCertificate {
  id: "gamma_2_stage_5_release_completion_certificate";
  status: "pending-operator-certification";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  phaseCount: number;
  closureEntryCount: number;
  closeoutItemCount: number;
  retentionRuleCount: number;
  passCheckCount: number;
  openExceptionCount: 0;
  smoke: string;
  evidence: GammaStage5ReleaseCompletionCertificateEvidence[];
  certificateRule: "stage-5-release-completion-certificate-requires-readiness-closure-closeout-retention-and-attestation";
}

export function buildGammaStage5ReleaseCompletionCertificate(): GammaStage5ReleaseCompletionCertificate {
  const readiness = buildGammaStage5ReadinessSnapshot();
  const closureLedger = buildGammaStage5ReleaseClosureLedger();
  const closeoutPacket = buildGammaStage5ReleaseCloseoutPacket();
  const retentionPolicy = buildGammaStage5ReleaseRetentionPolicy();
  const attestation = buildGammaStage5ReleaseAttestation();

  const evidence: GammaStage5ReleaseCompletionCertificateEvidence[] = [
    {
      order: 1,
      id: "readiness-snapshot-bound",
      source: "/api/gamma/stage-5/readiness",
      evidence: readiness.completionTag,
      owner: "operator",
      status: "pending-operator-certification",
    },
    {
      order: 2,
      id: "closure-ledger-bound",
      source: "/api/gamma/stage-5/release-closure-ledger",
      evidence: closureLedger.closureRule,
      owner: "operator",
      status: "pending-operator-certification",
    },
    {
      order: 3,
      id: "closeout-packet-bound",
      source: "/api/gamma/stage-5/release-closeout-packet",
      evidence: closeoutPacket.closeoutRule,
      owner: "operator",
      status: "pending-operator-certification",
    },
    {
      order: 4,
      id: "retention-policy-bound",
      source: "/api/gamma/stage-5/release-retention-policy",
      evidence: retentionPolicy.retentionRule,
      owner: "operator",
      status: "pending-operator-certification",
    },
    {
      order: 5,
      id: "release-attestation-bound",
      source: "/api/gamma/stage-5/release-attestation",
      evidence: attestation.attestationRule,
      owner: "release-client",
      status: "pending-operator-certification",
    },
  ];

  return {
    id: "gamma_2_stage_5_release_completion_certificate",
    status: "pending-operator-certification",
    generatedAt: new Date(closureLedger.generatedAt),
    branch: closureLedger.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: closureLedger.apiSurfaceCount,
    phaseCount: readiness.phases.length,
    closureEntryCount: closureLedger.closureEntryCount,
    closeoutItemCount: closeoutPacket.closeoutItemCount,
    retentionRuleCount: retentionPolicy.retentionRules.length,
    passCheckCount: closureLedger.passCheckCount,
    openExceptionCount: closureLedger.openExceptionCount,
    smoke: closureLedger.smoke,
    evidence,
    certificateRule:
      "stage-5-release-completion-certificate-requires-readiness-closure-closeout-retention-and-attestation",
  };
}
