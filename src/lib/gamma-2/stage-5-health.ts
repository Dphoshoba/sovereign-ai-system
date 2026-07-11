import { buildGammaStage5DeploymentSummary } from "./stage-5-deployment-summary";
import { buildGammaStage5OperatorBrief } from "./stage-5-operator-brief";

export interface GammaStage5Health {
  id: "gamma_2_stage_5_health";
  status: "healthy";
  generatedAt: Date;
  apiSurfaceCount: number;
  phaseCount: number;
  smoke: string;
  operatorActionsRemaining: number;
  healthRule: "compact-health-for-stage-5-monitoring";
}

export function buildGammaStage5Health(): GammaStage5Health {
  const deploymentSummary = buildGammaStage5DeploymentSummary();
  const operatorBrief = buildGammaStage5OperatorBrief();

  return {
    id: "gamma_2_stage_5_health",
    status: "healthy",
    generatedAt: new Date(deploymentSummary.generatedAt),
    apiSurfaceCount: operatorBrief.apiSurface.length,
    phaseCount: deploymentSummary.phaseCount,
    smoke: deploymentSummary.verification.smoke,
    operatorActionsRemaining: operatorBrief.nextOperatorActions.length,
    healthRule: "compact-health-for-stage-5-monitoring",
  };
}
