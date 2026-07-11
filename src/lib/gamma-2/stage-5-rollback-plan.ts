import { buildGammaStage5DeploymentSummary } from "./stage-5-deployment-summary";
import { buildGammaStage5ReleaseAttestation } from "./stage-5-release-attestation";

export interface GammaStage5RollbackStep {
  order: number;
  title: string;
  owner: "operator" | "release-client";
  evidence: string;
}

export interface GammaStage5RollbackPlan {
  id: "gamma_2_stage_5_rollback_plan";
  status: "ready-for-controlled-rollback";
  generatedAt: Date;
  branch: "gamma";
  protectedTag: "gamma-2-roadmap-complete";
  digestFingerprint: string;
  apiSurfaceCount: number;
  steps: GammaStage5RollbackStep[];
  rollbackRule: "operator-approved-rollback-to-last-attested-stage-5-tag";
}

export function buildGammaStage5RollbackPlan(): GammaStage5RollbackPlan {
  const deploymentSummary = buildGammaStage5DeploymentSummary();
  const attestation = buildGammaStage5ReleaseAttestation();

  return {
    id: "gamma_2_stage_5_rollback_plan",
    status: "ready-for-controlled-rollback",
    generatedAt: new Date(deploymentSummary.generatedAt),
    branch: attestation.branch,
    protectedTag: "gamma-2-roadmap-complete",
    digestFingerprint: attestation.digest.fingerprint,
    apiSurfaceCount: deploymentSummary.apiSurface.length,
    steps: [
      {
        order: 1,
        title: "Pause production promotion or traffic shift",
        owner: "operator",
        evidence: attestation.operatorRule,
      },
      {
        order: 2,
        title: "Compare production digest against the last attested fingerprint",
        owner: "release-client",
        evidence: attestation.digest.fingerprint,
      },
      {
        order: 3,
        title: "Restore the last protected Stage 5 tag",
        owner: "operator",
        evidence: "gamma-2-roadmap-complete",
      },
      {
        order: 4,
        title: "Rerun build, smoke, and release attestation before resuming",
        owner: "operator",
        evidence: deploymentSummary.verification.smoke,
      },
    ],
    rollbackRule: "operator-approved-rollback-to-last-attested-stage-5-tag",
  };
}
