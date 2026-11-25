import { buildGammaStage5OperatorBrief } from "./stage-5-operator-brief";
import { buildGammaStage5ReleaseAttestation } from "./stage-5-release-attestation";
import { buildGammaStage5ReleaseProjectionContext } from "./stage-5-release-projection-context";
import { projectGammaStage5OperatorHandoff } from "./stage-5-release-projection-registry";
import { buildGammaStage5RollbackPlanSource } from "./stage-5-rollback-plan";

export interface GammaStage5OperatorHandoff {
  id: "gamma_2_stage_5_operator_handoff";
  status: "ready-for-operator-handoff";
  generatedAt: Date;
  headline: string;
  digestFingerprint: string;
  nextOperatorActions: string[];
  rollbackSteps: string[];
  requiredArtifactPaths: string[];
  handoffRule: "operator-reviews-brief-attestation-and-rollback-before-promotion";
}

export function buildGammaStage5OperatorHandoffSource(): GammaStage5OperatorHandoff {
  const brief = buildGammaStage5OperatorBrief();
  const attestation = buildGammaStage5ReleaseAttestation();
  const rollbackPlan = buildGammaStage5RollbackPlanSource();

  return {
    id: "gamma_2_stage_5_operator_handoff",
    status: "ready-for-operator-handoff",
    generatedAt: new Date(brief.generatedAt),
    headline: brief.headline,
    digestFingerprint: attestation.digest.fingerprint,
    nextOperatorActions: [...brief.nextOperatorActions],
    rollbackSteps: rollbackPlan.steps.map((step) => step.title),
    requiredArtifactPaths: [
      "/api/gamma/stage-5/operator-brief",
      "/api/gamma/stage-5/release-attestation",
      "/api/gamma/stage-5/rollback-plan",
      "/api/gamma/stage-5/contract-digest",
    ],
    handoffRule: "operator-reviews-brief-attestation-and-rollback-before-promotion",
  };
}

export function buildGammaStage5OperatorHandoff(): GammaStage5OperatorHandoff {
  return projectGammaStage5OperatorHandoff(buildGammaStage5ReleaseProjectionContext());
}
