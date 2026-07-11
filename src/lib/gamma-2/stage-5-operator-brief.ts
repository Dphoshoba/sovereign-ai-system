import { buildGammaStage5DeploymentSummary } from "./stage-5-deployment-summary";
import { buildGammaStage5PromotionChecklist } from "./stage-5-promotion-checklist";

export interface GammaStage5OperatorBrief {
  id: "gamma_2_stage_5_operator_brief";
  status: "ready-for-operator-review";
  generatedAt: Date;
  headline: "Gamma 2 Stage 5 is verified and ready for controlled promotion.";
  summary: string[];
  nextOperatorActions: string[];
  apiSurface: string[];
  briefRule: "single-operator-brief-for-stage-5-handoff";
}

export function buildGammaStage5OperatorBrief(): GammaStage5OperatorBrief {
  const deploymentSummary = buildGammaStage5DeploymentSummary();
  const promotionChecklist = buildGammaStage5PromotionChecklist();
  const nextOperatorActions = promotionChecklist.steps
    .filter((step) => step.status === "operator-required")
    .map((step) => step.title);

  return {
    id: "gamma_2_stage_5_operator_brief",
    status: "ready-for-operator-review",
    generatedAt: new Date(deploymentSummary.generatedAt),
    headline: "Gamma 2 Stage 5 is verified and ready for controlled promotion.",
    summary: [
      `${deploymentSummary.phaseCount} roadmap phases complete`,
      deploymentSummary.verification.smoke,
      `${deploymentSummary.apiSurface.length} Stage 5 API endpoints available`,
      `${deploymentSummary.operatorRequiredCount} operator-required checks remain`,
    ],
    nextOperatorActions,
    apiSurface: Array.from(
      new Set([...deploymentSummary.apiSurface, "/api/gamma/stage-5/operator-brief"])
    ),
    briefRule: "single-operator-brief-for-stage-5-handoff",
  };
}
