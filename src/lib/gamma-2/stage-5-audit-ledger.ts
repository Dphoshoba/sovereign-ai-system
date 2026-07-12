import { buildGammaStage5DeploymentSummary } from "./stage-5-deployment-summary";
import { buildGammaStage5OperatorHandoffSource } from "./stage-5-operator-handoff";
import { buildGammaStage5ReleaseAttestation } from "./stage-5-release-attestation";
import { buildGammaStage5RollbackPlanSource } from "./stage-5-rollback-plan";

export interface GammaStage5AuditLedgerEntry {
  order: number;
  event: string;
  evidence: string;
  actor: "codex" | "operator" | "release-client";
}

export interface GammaStage5AuditLedger {
  id: "gamma_2_stage_5_audit_ledger";
  status: "audit-ready";
  generatedAt: Date;
  branch: "gamma";
  digestFingerprint: string;
  apiSurfaceCount: number;
  entries: GammaStage5AuditLedgerEntry[];
  artifactPaths: string[];
  auditRule: "ordered-ledger-for-stage-5-release-evidence";
}

export function buildGammaStage5AuditLedger(): GammaStage5AuditLedger {
  const deploymentSummary = buildGammaStage5DeploymentSummary();
  const attestation = buildGammaStage5ReleaseAttestation();
  const rollbackPlan = buildGammaStage5RollbackPlanSource();
  const handoff = buildGammaStage5OperatorHandoffSource();

  return {
    id: "gamma_2_stage_5_audit_ledger",
    status: "audit-ready",
    generatedAt: new Date(deploymentSummary.generatedAt),
    branch: attestation.branch,
    digestFingerprint: attestation.digest.fingerprint,
    apiSurfaceCount: deploymentSummary.apiSurface.length,
    entries: [
      {
        order: 1,
        event: "Stage 5 contract surface verified",
        evidence: deploymentSummary.verification.smoke,
        actor: "codex",
      },
      {
        order: 2,
        event: "Release attestation generated",
        evidence: attestation.attestationRule,
        actor: "release-client",
      },
      {
        order: 3,
        event: "Rollback plan prepared",
        evidence: rollbackPlan.rollbackRule,
        actor: "operator",
      },
      {
        order: 4,
        event: "Operator handoff packet prepared",
        evidence: handoff.handoffRule,
        actor: "operator",
      },
    ],
    artifactPaths: [
      "/api/gamma/stage-5/deployment-summary",
      "/api/gamma/stage-5/release-attestation",
      "/api/gamma/stage-5/rollback-plan",
      "/api/gamma/stage-5/operator-handoff",
      "/api/gamma/stage-5/contract-digest",
    ],
    auditRule: "ordered-ledger-for-stage-5-release-evidence",
  };
}
