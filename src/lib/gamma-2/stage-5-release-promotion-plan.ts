import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5PromotionChecklist } from "./stage-5-promotion-checklist";
import { buildGammaStage5ReleaseApprovalPacket } from "./stage-5-release-approval-packet";
import { buildGammaStage5ReleaseDecisionRecord } from "./stage-5-release-decision-record";
import { buildGammaStage5ReleaseGate } from "./stage-5-release-gate";
import { buildGammaStage5RollbackPlan } from "./stage-5-rollback-plan";

export interface GammaStage5ReleasePromotionStep {
  order: number;
  id: string;
  title: string;
  owner: "operator";
  evidence: string;
  status: "pending-operator-action";
}

export interface GammaStage5ReleasePromotionPlan {
  id: "gamma_2_stage_5_release_promotion_plan";
  status: "pending-operator-approval";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  approvalArtifactCount: number;
  promotionStepCount: number;
  rollbackStepCount: number;
  steps: GammaStage5ReleasePromotionStep[];
  promotionRule: "stage-5-promotion-plan-requires-approval-packet-before-production-action";
}

export function buildGammaStage5ReleasePromotionPlan(): GammaStage5ReleasePromotionPlan {
  const approvalPacket = buildGammaStage5ReleaseApprovalPacket();
  const decisionRecord = buildGammaStage5ReleaseDecisionRecord();
  const releaseGate = buildGammaStage5ReleaseGate();
  const checklist = buildGammaStage5PromotionChecklist();
  const rollbackPlan = buildGammaStage5RollbackPlan();

  const steps: GammaStage5ReleasePromotionStep[] = [
    {
      order: 1,
      id: "review-approval-packet",
      title: "Review release approval packet",
      owner: "operator",
      evidence: approvalPacket.approvalRule,
      status: "pending-operator-action",
    },
    {
      order: 2,
      id: "confirm-production-env",
      title: "Confirm production environment origin",
      owner: "operator",
      evidence: releaseGate.requiredPublicEnv.NEXT_PUBLIC_APP_URL,
      status: "pending-operator-action",
    },
    {
      order: 3,
      id: "complete-promotion-checklist",
      title: "Complete ordered promotion checklist",
      owner: "operator",
      evidence: checklist.checklistRule,
      status: "pending-operator-action",
    },
    {
      order: 4,
      id: "approve-decision-record",
      title: "Approve pending release decision",
      owner: "operator",
      evidence: decisionRecord.decisionRule,
      status: "pending-operator-action",
    },
    {
      order: 5,
      id: "retain-rollback-plan",
      title: "Retain rollback plan before production promotion",
      owner: "operator",
      evidence: rollbackPlan.rollbackRule,
      status: "pending-operator-action",
    },
  ];

  return {
    id: "gamma_2_stage_5_release_promotion_plan",
    status: "pending-operator-approval",
    generatedAt: new Date(approvalPacket.generatedAt),
    branch: approvalPacket.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: approvalPacket.apiSurfaceCount,
    approvalArtifactCount: approvalPacket.approvalArtifactCount,
    promotionStepCount: steps.length,
    rollbackStepCount: rollbackPlan.steps.length,
    steps,
    promotionRule: "stage-5-promotion-plan-requires-approval-packet-before-production-action",
  };
}
