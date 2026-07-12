import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5AuditLedger } from "./stage-5-audit-ledger";
import { buildGammaStage5DeploymentReceipt } from "./stage-5-deployment-receipt";
import { buildGammaStage5OperatorSignoff } from "./stage-5-operator-signoff";
import { buildGammaStage5ReleaseDecisionRecord } from "./stage-5-release-decision-record";
import { buildGammaStage5ReleaseMonitoringPlanSource } from "./stage-5-release-monitoring-plan";

export interface GammaStage5ReleasePostPromotionReviewItem {
  order: number;
  id: string;
  title: string;
  owner: "operator";
  evidence: string;
  status: "pending-operator-review";
}

export interface GammaStage5ReleasePostPromotionReview {
  id: "gamma_2_stage_5_release_post_promotion_review";
  status: "pending-operator-review";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  reviewItemCount: number;
  monitoringCheckCount: number;
  operatorRequiredCount: number;
  openExceptionCount: 0;
  healthStatus: "healthy";
  smoke: string;
  items: GammaStage5ReleasePostPromotionReviewItem[];
  reviewRule: "stage-5-post-promotion-review-requires-monitoring-signoff-audit-and-receipt-evidence";
}

export function buildGammaStage5ReleasePostPromotionReview(): GammaStage5ReleasePostPromotionReview {
  const monitoringPlan = buildGammaStage5ReleaseMonitoringPlanSource();
  const signoff = buildGammaStage5OperatorSignoff();
  const auditLedger = buildGammaStage5AuditLedger();
  const deploymentReceipt = buildGammaStage5DeploymentReceipt();
  const decisionRecord = buildGammaStage5ReleaseDecisionRecord();

  const items: GammaStage5ReleasePostPromotionReviewItem[] = [
    {
      order: 1,
      id: "review-monitoring-plan",
      title: "Review post-shift monitoring plan",
      owner: "operator",
      evidence: monitoringPlan.monitoringRule,
      status: "pending-operator-review",
    },
    {
      order: 2,
      id: "confirm-signoff-boundary",
      title: "Confirm operator signoff boundary",
      owner: "operator",
      evidence: signoff.signoffRule,
      status: "pending-operator-review",
    },
    {
      order: 3,
      id: "review-audit-continuity",
      title: "Review audit ledger continuity",
      owner: "operator",
      evidence: auditLedger.auditRule,
      status: "pending-operator-review",
    },
    {
      order: 4,
      id: "confirm-deployment-receipt",
      title: "Confirm deployment receipt evidence",
      owner: "operator",
      evidence: deploymentReceipt.receiptRule,
      status: "pending-operator-review",
    },
    {
      order: 5,
      id: "close-promotion-decision",
      title: "Close production promotion decision review",
      owner: "operator",
      evidence: decisionRecord.decisionRule,
      status: "pending-operator-review",
    },
  ];

  return {
    id: "gamma_2_stage_5_release_post_promotion_review",
    status: "pending-operator-review",
    generatedAt: new Date(monitoringPlan.generatedAt),
    branch: monitoringPlan.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: monitoringPlan.apiSurfaceCount,
    reviewItemCount: items.length,
    monitoringCheckCount: monitoringPlan.monitoringCheckCount,
    operatorRequiredCount: signoff.operatorRequiredCount,
    openExceptionCount: decisionRecord.openExceptionCount,
    healthStatus: monitoringPlan.healthStatus,
    smoke: monitoringPlan.smoke,
    items,
    reviewRule:
      "stage-5-post-promotion-review-requires-monitoring-signoff-audit-and-receipt-evidence",
  };
}
