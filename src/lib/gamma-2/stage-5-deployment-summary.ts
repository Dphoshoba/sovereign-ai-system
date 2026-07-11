import { buildGammaStage5EvidenceBundle } from "./stage-5-evidence";
import { buildGammaStage5PromotionChecklist } from "./stage-5-promotion-checklist";
import { buildGammaStage5ReadinessSnapshot } from "./stage-5-readiness";
import { buildGammaStage5ReleaseGate } from "./stage-5-release-gate";

export interface GammaStage5DeploymentSummary {
  id: "gamma_2_stage_5_deployment_summary";
  status: "ready-for-controlled-promotion";
  generatedAt: Date;
  productionUrl: string;
  phaseCount: number;
  verification: {
    tests: string;
    determinism: string;
    build: string;
    smoke: string;
  };
  apiSurface: string[];
  operatorRequiredCount: number;
  tags: string[];
  deploymentRule: "single-summary-for-readiness-evidence-release-and-promotion";
}

export function buildGammaStage5DeploymentSummary(): GammaStage5DeploymentSummary {
  const readiness = buildGammaStage5ReadinessSnapshot();
  const evidence = buildGammaStage5EvidenceBundle();
  const releaseGate = buildGammaStage5ReleaseGate();
  const promotionChecklist = buildGammaStage5PromotionChecklist();
  const operatorRequiredCount =
    releaseGate.checks.filter((check) => check.status === "operator-required").length +
    promotionChecklist.steps.filter((step) => step.status === "operator-required").length;

  return {
    id: "gamma_2_stage_5_deployment_summary",
    status: "ready-for-controlled-promotion",
    generatedAt: new Date(readiness.generatedAt),
    productionUrl: releaseGate.productionUrl,
    phaseCount: readiness.phases.length,
    verification: { ...readiness.verification },
    apiSurface: [
      "/api/gamma/stage-5/readiness",
      "/api/gamma/stage-5/evidence",
      "/api/gamma/stage-5/release-gate",
      "/api/gamma/stage-5/promotion-checklist",
      "/api/gamma/stage-5/deployment-summary",
    ],
    operatorRequiredCount,
    tags: [...evidence.tags, "gamma-2-stage-5-promotion-checklist"],
    deploymentRule: "single-summary-for-readiness-evidence-release-and-promotion",
  };
}
