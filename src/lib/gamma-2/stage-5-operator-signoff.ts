import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5DeploymentSummary } from "./stage-5-deployment-summary";
import { buildGammaStage5OperatorHandoff } from "./stage-5-operator-handoff";
import { buildGammaStage5PromotionChecklist } from "./stage-5-promotion-checklist";
import { buildGammaStage5PromotionJournal } from "./stage-5-promotion-journal";
import { buildGammaStage5ReleaseGate } from "./stage-5-release-gate";

export interface GammaStage5OperatorSignoffRequirement {
  id: string;
  label: string;
  evidence: string;
  required: true;
}

export interface GammaStage5OperatorSignoff {
  id: "gamma_2_stage_5_operator_signoff";
  status: "pending-operator-approval";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  digestFingerprint: string;
  operatorRequiredCount: number;
  requirements: GammaStage5OperatorSignoffRequirement[];
  signoffArtifacts: string[];
  signoffRule: "operator-signoff-required-before-production-promotion";
}

export function buildGammaStage5OperatorSignoff(): GammaStage5OperatorSignoff {
  const deploymentSummary = buildGammaStage5DeploymentSummary();
  const releaseGate = buildGammaStage5ReleaseGate();
  const checklist = buildGammaStage5PromotionChecklist();
  const handoff = buildGammaStage5OperatorHandoff();
  const journal = buildGammaStage5PromotionJournal();
  const operatorRequiredCount =
    releaseGate.checks.filter((check) => check.status === "operator-required").length +
    checklist.steps.filter((step) => step.status === "operator-required").length;

  return {
    id: "gamma_2_stage_5_operator_signoff",
    status: "pending-operator-approval",
    generatedAt: new Date(deploymentSummary.generatedAt),
    branch: releaseGate.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: deploymentSummary.apiSurface.length,
    digestFingerprint: journal.digestFingerprint,
    operatorRequiredCount,
    requirements: [
      {
        id: "confirm-production-env",
        label: "Confirm production public URLs match the canonical origin",
        evidence: releaseGate.requiredPublicEnv.NEXT_PUBLIC_APP_URL,
        required: true,
      },
      {
        id: "review-handoff",
        label: "Review operator handoff packet",
        evidence: handoff.handoffRule,
        required: true,
      },
      {
        id: "review-promotion-journal",
        label: "Review promotion journal evidence sequence",
        evidence: journal.journalRule,
        required: true,
      },
      {
        id: "approve-promotion",
        label: "Approve production promotion",
        evidence: checklist.approvalBoundary,
        required: true,
      },
    ],
    signoffArtifacts: [
      "/api/gamma/stage-5/operator-handoff",
      "/api/gamma/stage-5/promotion-journal",
      "/api/gamma/stage-5/release-gate",
      "/api/gamma/stage-5/promotion-checklist",
      "/api/gamma/stage-5/deployment-summary",
    ],
    signoffRule: "operator-signoff-required-before-production-promotion",
  };
}
