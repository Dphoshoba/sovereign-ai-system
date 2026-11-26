import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5AuditLedger } from "./stage-5-audit-ledger";
import { buildGammaStage5DeploymentReceipt } from "./stage-5-deployment-receipt";
import { buildGammaStage5Health } from "./stage-5-health";
import { buildGammaStage5PromotionJournal } from "./stage-5-promotion-journal";
import { buildGammaStage5ReleaseProjectionContext } from "./stage-5-release-projection-context";
import { projectGammaStage5ReleaseMonitoringPlan } from "./stage-5-release-projection-registry";
import { buildGammaStage5ReleaseTrafficShiftPlanSource } from "./stage-5-release-traffic-shift-plan";

export interface GammaStage5ReleaseMonitoringCheck {
  order: number;
  id: string;
  title: string;
  owner: "operator" | "monitor";
  evidence: string;
  status: "pending-post-shift-observation";
}

export interface GammaStage5ReleaseMonitoringPlan {
  id: "gamma_2_stage_5_release_monitoring_plan";
  status: "pending-post-shift-monitoring";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  monitoringCheckCount: number;
  trafficShiftStepCount: number;
  operatorActionsRemaining: number;
  healthStatus: "healthy";
  smoke: string;
  checks: GammaStage5ReleaseMonitoringCheck[];
  monitoringRule: "stage-5-post-shift-monitoring-requires-health-audit-and-receipt-evidence";
}

export function buildGammaStage5ReleaseMonitoringPlanSource(): GammaStage5ReleaseMonitoringPlan {
  const trafficShiftPlan = buildGammaStage5ReleaseTrafficShiftPlanSource();
  const health = buildGammaStage5Health();
  const auditLedger = buildGammaStage5AuditLedger();
  const deploymentReceipt = buildGammaStage5DeploymentReceipt();
  const promotionJournal = buildGammaStage5PromotionJournal();

  const checks: GammaStage5ReleaseMonitoringCheck[] = [
    {
      order: 1,
      id: "observe-compact-health",
      title: "Observe compact Stage 5 health",
      owner: "monitor",
      evidence: health.healthRule,
      status: "pending-post-shift-observation",
    },
    {
      order: 2,
      id: "confirm-post-shift-smoke",
      title: "Confirm post-shift smoke evidence",
      owner: "operator",
      evidence: health.smoke,
      status: "pending-post-shift-observation",
    },
    {
      order: 3,
      id: "review-audit-ledger",
      title: "Review audit ledger continuity",
      owner: "operator",
      evidence: auditLedger.auditRule,
      status: "pending-post-shift-observation",
    },
    {
      order: 4,
      id: "record-deployment-receipt",
      title: "Record deployment receipt after traffic shift",
      owner: "operator",
      evidence: deploymentReceipt.receiptRule,
      status: "pending-post-shift-observation",
    },
    {
      order: 5,
      id: "append-promotion-journal",
      title: "Append promotion journal observation",
      owner: "operator",
      evidence: promotionJournal.journalRule,
      status: "pending-post-shift-observation",
    },
  ];

  return {
    id: "gamma_2_stage_5_release_monitoring_plan",
    status: "pending-post-shift-monitoring",
    generatedAt: new Date(trafficShiftPlan.generatedAt),
    branch: trafficShiftPlan.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: trafficShiftPlan.apiSurfaceCount,
    monitoringCheckCount: checks.length,
    trafficShiftStepCount: trafficShiftPlan.trafficShiftStepCount,
    operatorActionsRemaining: health.operatorActionsRemaining,
    healthStatus: health.status,
    smoke: health.smoke,
    checks,
    monitoringRule: "stage-5-post-shift-monitoring-requires-health-audit-and-receipt-evidence",
  };
}

export function buildGammaStage5ReleaseMonitoringPlan(): GammaStage5ReleaseMonitoringPlan {
  return projectGammaStage5ReleaseMonitoringPlan(buildGammaStage5ReleaseProjectionContext());
}
