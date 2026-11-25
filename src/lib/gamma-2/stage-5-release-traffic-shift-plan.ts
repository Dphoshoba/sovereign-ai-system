import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5DeploymentReceipt } from "./stage-5-deployment-receipt";
import { buildGammaStage5Health } from "./stage-5-health";
import { buildGammaStage5ReleaseCutoverChecklistSource } from "./stage-5-release-cutover-checklist";
import { buildGammaStage5ReleaseProjectionContext } from "./stage-5-release-projection-context";
import { projectGammaStage5ReleaseTrafficShiftPlan } from "./stage-5-release-projection-registry";
import { buildGammaStage5RollbackPlanSource } from "./stage-5-rollback-plan";

export interface GammaStage5ReleaseTrafficShiftStep {
  order: number;
  id: string;
  title: string;
  owner: "operator";
  evidence: string;
  status: "pending-operator-action";
}

export interface GammaStage5ReleaseTrafficShiftPlan {
  id: "gamma_2_stage_5_release_traffic_shift_plan";
  status: "pending-operator-traffic-shift";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  trafficShiftStepCount: number;
  cutoverCheckCount: number;
  rollbackStepCount: number;
  healthStatus: "healthy";
  smoke: string;
  steps: GammaStage5ReleaseTrafficShiftStep[];
  trafficShiftRule: "stage-5-traffic-shift-requires-cutover-checklist-health-and-rollback-evidence";
}

export function buildGammaStage5ReleaseTrafficShiftPlanSource(): GammaStage5ReleaseTrafficShiftPlan {
  const cutoverChecklist = buildGammaStage5ReleaseCutoverChecklistSource();
  const health = buildGammaStage5Health();
  const rollbackPlan = buildGammaStage5RollbackPlanSource();
  const deploymentReceipt = buildGammaStage5DeploymentReceipt();

  const steps: GammaStage5ReleaseTrafficShiftStep[] = [
    {
      order: 1,
      id: "confirm-cutover-checklist",
      title: "Confirm release cutover checklist",
      owner: "operator",
      evidence: cutoverChecklist.cutoverRule,
      status: "pending-operator-action",
    },
    {
      order: 2,
      id: "verify-stage-5-health",
      title: "Verify Stage 5 health endpoint",
      owner: "operator",
      evidence: health.healthRule,
      status: "pending-operator-action",
    },
    {
      order: 3,
      id: "retain-rollback-control",
      title: "Retain rollback control before shifting traffic",
      owner: "operator",
      evidence: rollbackPlan.rollbackRule,
      status: "pending-operator-action",
    },
    {
      order: 4,
      id: "shift-traffic-after-approval",
      title: "Shift traffic only after operator approval",
      owner: "operator",
      evidence: deploymentReceipt.receiptRule,
      status: "pending-operator-action",
    },
    {
      order: 5,
      id: "run-post-shift-smoke",
      title: "Run post-shift smoke verification",
      owner: "operator",
      evidence: health.smoke,
      status: "pending-operator-action",
    },
  ];

  return {
    id: "gamma_2_stage_5_release_traffic_shift_plan",
    status: "pending-operator-traffic-shift",
    generatedAt: new Date(cutoverChecklist.generatedAt),
    branch: cutoverChecklist.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: cutoverChecklist.apiSurfaceCount,
    trafficShiftStepCount: steps.length,
    cutoverCheckCount: cutoverChecklist.cutoverCheckCount,
    rollbackStepCount: rollbackPlan.steps.length,
    healthStatus: health.status,
    smoke: health.smoke,
    steps,
    trafficShiftRule:
      "stage-5-traffic-shift-requires-cutover-checklist-health-and-rollback-evidence",
  };
}

export function buildGammaStage5ReleaseTrafficShiftPlan(): GammaStage5ReleaseTrafficShiftPlan {
  return projectGammaStage5ReleaseTrafficShiftPlan(buildGammaStage5ReleaseProjectionContext());
}
