import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5ReleaseApprovalPacket } from "./stage-5-release-approval-packet";
import { buildGammaStage5ReleaseCutoverChecklist } from "./stage-5-release-cutover-checklist";
import { buildGammaStage5ReleaseMonitoringPlan } from "./stage-5-release-monitoring-plan";
import { buildGammaStage5ReleasePostPromotionReview } from "./stage-5-release-post-promotion-review";
import { buildGammaStage5ReleasePromotionPlan } from "./stage-5-release-promotion-plan";
import { buildGammaStage5ReleaseTrafficShiftPlan } from "./stage-5-release-traffic-shift-plan";

export interface GammaStage5ReleaseOperationsStep {
  order: number;
  id: string;
  label: string;
  source: string;
  evidence: string;
  owner: "operator" | "monitor";
  status: "pending-operator-sequence";
}

export interface GammaStage5ReleaseOperationsIndex {
  id: "gamma_2_stage_5_release_operations_index";
  status: "ready-for-operator-sequencing";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  operationsStepCount: number;
  approvalArtifactCount: number;
  promotionStepCount: number;
  cutoverCheckCount: number;
  trafficShiftStepCount: number;
  monitoringCheckCount: number;
  postPromotionReviewItemCount: number;
  smoke: string;
  steps: GammaStage5ReleaseOperationsStep[];
  operationsRule: "stage-5-release-operations-index-orders-approval-promotion-cutover-shift-monitoring-and-review";
}

export function buildGammaStage5ReleaseOperationsIndex(): GammaStage5ReleaseOperationsIndex {
  const approvalPacket = buildGammaStage5ReleaseApprovalPacket();
  const promotionPlan = buildGammaStage5ReleasePromotionPlan();
  const cutoverChecklist = buildGammaStage5ReleaseCutoverChecklist();
  const trafficShiftPlan = buildGammaStage5ReleaseTrafficShiftPlan();
  const monitoringPlan = buildGammaStage5ReleaseMonitoringPlan();
  const postPromotionReview = buildGammaStage5ReleasePostPromotionReview();

  const steps: GammaStage5ReleaseOperationsStep[] = [
    {
      order: 1,
      id: "approval-packet",
      label: "Review release approval packet",
      source: "/api/gamma/stage-5/release-approval-packet",
      evidence: approvalPacket.approvalRule,
      owner: "operator",
      status: "pending-operator-sequence",
    },
    {
      order: 2,
      id: "promotion-plan",
      label: "Execute release promotion plan",
      source: "/api/gamma/stage-5/release-promotion-plan",
      evidence: promotionPlan.promotionRule,
      owner: "operator",
      status: "pending-operator-sequence",
    },
    {
      order: 3,
      id: "cutover-checklist",
      label: "Complete release cutover checklist",
      source: "/api/gamma/stage-5/release-cutover-checklist",
      evidence: cutoverChecklist.cutoverRule,
      owner: "operator",
      status: "pending-operator-sequence",
    },
    {
      order: 4,
      id: "traffic-shift-plan",
      label: "Shift traffic under operator control",
      source: "/api/gamma/stage-5/release-traffic-shift-plan",
      evidence: trafficShiftPlan.trafficShiftRule,
      owner: "operator",
      status: "pending-operator-sequence",
    },
    {
      order: 5,
      id: "monitoring-plan",
      label: "Observe post-shift monitoring plan",
      source: "/api/gamma/stage-5/release-monitoring-plan",
      evidence: monitoringPlan.monitoringRule,
      owner: "monitor",
      status: "pending-operator-sequence",
    },
    {
      order: 6,
      id: "post-promotion-review",
      label: "Review post-promotion evidence",
      source: "/api/gamma/stage-5/release-post-promotion-review",
      evidence: postPromotionReview.reviewRule,
      owner: "operator",
      status: "pending-operator-sequence",
    },
  ];

  return {
    id: "gamma_2_stage_5_release_operations_index",
    status: "ready-for-operator-sequencing",
    generatedAt: new Date(postPromotionReview.generatedAt),
    branch: postPromotionReview.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: postPromotionReview.apiSurfaceCount,
    operationsStepCount: steps.length,
    approvalArtifactCount: approvalPacket.approvalArtifactCount,
    promotionStepCount: promotionPlan.promotionStepCount,
    cutoverCheckCount: cutoverChecklist.cutoverCheckCount,
    trafficShiftStepCount: trafficShiftPlan.trafficShiftStepCount,
    monitoringCheckCount: monitoringPlan.monitoringCheckCount,
    postPromotionReviewItemCount: postPromotionReview.reviewItemCount,
    smoke: postPromotionReview.smoke,
    steps,
    operationsRule:
      "stage-5-release-operations-index-orders-approval-promotion-cutover-shift-monitoring-and-review",
  };
}
