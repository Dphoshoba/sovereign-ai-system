import { buildGammaStage5DeploymentSummary } from "./stage-5-deployment-summary";
import { buildGammaStage5Health } from "./stage-5-health";
import { buildGammaStage5OperatorBrief } from "./stage-5-operator-brief";
import { buildGammaStage5PromotionChecklist } from "./stage-5-promotion-checklist";
import { buildGammaStage5ReleaseGate } from "./stage-5-release-gate";

export interface GammaStage5ReleaseDashboardCard {
  id: string;
  label: string;
  value: string;
  tone: "ready" | "operator-required";
  evidence: string;
}

export interface GammaStage5ReleaseDashboard {
  id: "gamma_2_stage_5_release_dashboard";
  status: "ready-for-dashboard-review";
  generatedAt: Date;
  productionUrl: string;
  health: {
    status: "healthy";
    phaseCount: number;
    apiSurfaceCount: number;
    smoke: string;
  };
  releaseChecks: {
    passed: number;
    operatorRequired: number;
    total: number;
  };
  promotionSteps: {
    complete: number;
    operatorRequired: number;
    total: number;
  };
  dashboardCards: GammaStage5ReleaseDashboardCard[];
  operatorActions: string[];
  apiSurface: string[];
  dashboardRule: "single-dashboard-contract-for-stage-5-release-operations";
}

export function buildGammaStage5ReleaseDashboard(): GammaStage5ReleaseDashboard {
  const deploymentSummary = buildGammaStage5DeploymentSummary();
  const releaseGate = buildGammaStage5ReleaseGate();
  const promotionChecklist = buildGammaStage5PromotionChecklist();
  const operatorBrief = buildGammaStage5OperatorBrief();
  const health = buildGammaStage5Health();
  const passedReleaseChecks = releaseGate.checks.filter((check) => check.status === "pass").length;
  const operatorRequiredReleaseChecks = releaseGate.checks.filter(
    (check) => check.status === "operator-required"
  ).length;
  const completePromotionSteps = promotionChecklist.steps.filter(
    (step) => step.status === "complete"
  ).length;
  const operatorRequiredPromotionSteps = promotionChecklist.steps.filter(
    (step) => step.status === "operator-required"
  ).length;

  return {
    id: "gamma_2_stage_5_release_dashboard",
    status: "ready-for-dashboard-review",
    generatedAt: new Date(deploymentSummary.generatedAt),
    productionUrl: deploymentSummary.productionUrl,
    health: {
      status: health.status,
      phaseCount: health.phaseCount,
      apiSurfaceCount: health.apiSurfaceCount,
      smoke: health.smoke,
    },
    releaseChecks: {
      passed: passedReleaseChecks,
      operatorRequired: operatorRequiredReleaseChecks,
      total: releaseGate.checks.length,
    },
    promotionSteps: {
      complete: completePromotionSteps,
      operatorRequired: operatorRequiredPromotionSteps,
      total: promotionChecklist.steps.length,
    },
    dashboardCards: [
      {
        id: "stage-5-health",
        label: "Stage 5 Health",
        value: health.status,
        tone: "ready",
        evidence: health.healthRule,
      },
      {
        id: "release-checks",
        label: "Release Checks",
        value: `${passedReleaseChecks}/${releaseGate.checks.length} passed`,
        tone: operatorRequiredReleaseChecks > 0 ? "operator-required" : "ready",
        evidence: releaseGate.releaseRule,
      },
      {
        id: "promotion-steps",
        label: "Promotion Steps",
        value: `${completePromotionSteps}/${promotionChecklist.steps.length} complete`,
        tone: operatorRequiredPromotionSteps > 0 ? "operator-required" : "ready",
        evidence: promotionChecklist.checklistRule,
      },
      {
        id: "operator-brief",
        label: "Operator Brief",
        value: operatorBrief.status,
        tone: "ready",
        evidence: operatorBrief.briefRule,
      },
    ],
    operatorActions: [...operatorBrief.nextOperatorActions],
    apiSurface: Array.from(
      new Set([...deploymentSummary.apiSurface, "/api/gamma/stage-5/release-dashboard"])
    ),
    dashboardRule: "single-dashboard-contract-for-stage-5-release-operations",
  };
}
