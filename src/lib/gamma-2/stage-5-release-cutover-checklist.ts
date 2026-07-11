import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5DeploymentReceipt } from "./stage-5-deployment-receipt";
import { buildGammaStage5ReleaseApprovalPacket } from "./stage-5-release-approval-packet";
import { buildGammaStage5ReleaseDecisionRecord } from "./stage-5-release-decision-record";
import { buildGammaStage5ReleasePromotionPlan } from "./stage-5-release-promotion-plan";
import { buildGammaStage5RollbackPlan } from "./stage-5-rollback-plan";

export interface GammaStage5ReleaseCutoverCheck {
  order: number;
  id: string;
  owner: "operator";
  evidence: string;
  status: "pending-operator-confirmation";
}

export interface GammaStage5ReleaseCutoverChecklist {
  id: "gamma_2_stage_5_release_cutover_checklist";
  status: "pending-operator-cutover";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  cutoverCheckCount: number;
  promotionStepCount: number;
  rollbackStepCount: number;
  checks: GammaStage5ReleaseCutoverCheck[];
  cutoverRule: "stage-5-cutover-checklist-requires-operator-confirmation-before-traffic-shift";
}

export function buildGammaStage5ReleaseCutoverChecklist(): GammaStage5ReleaseCutoverChecklist {
  const promotionPlan = buildGammaStage5ReleasePromotionPlan();
  const approvalPacket = buildGammaStage5ReleaseApprovalPacket();
  const decisionRecord = buildGammaStage5ReleaseDecisionRecord();
  const rollbackPlan = buildGammaStage5RollbackPlan();
  const deploymentReceipt = buildGammaStage5DeploymentReceipt();

  const checks: GammaStage5ReleaseCutoverCheck[] = [
    {
      order: 1,
      id: "approval-packet-reviewed",
      owner: "operator",
      evidence: approvalPacket.approvalRule,
      status: "pending-operator-confirmation",
    },
    {
      order: 2,
      id: "promotion-plan-reviewed",
      owner: "operator",
      evidence: promotionPlan.promotionRule,
      status: "pending-operator-confirmation",
    },
    {
      order: 3,
      id: "decision-record-approved",
      owner: "operator",
      evidence: decisionRecord.decisionRule,
      status: "pending-operator-confirmation",
    },
    {
      order: 4,
      id: "rollback-plan-retained",
      owner: "operator",
      evidence: rollbackPlan.rollbackRule,
      status: "pending-operator-confirmation",
    },
    {
      order: 5,
      id: "deployment-receipt-reviewed",
      owner: "operator",
      evidence: deploymentReceipt.receiptRule,
      status: "pending-operator-confirmation",
    },
  ];

  return {
    id: "gamma_2_stage_5_release_cutover_checklist",
    status: "pending-operator-cutover",
    generatedAt: new Date(promotionPlan.generatedAt),
    branch: promotionPlan.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: promotionPlan.apiSurfaceCount,
    cutoverCheckCount: checks.length,
    promotionStepCount: promotionPlan.promotionStepCount,
    rollbackStepCount: promotionPlan.rollbackStepCount,
    checks,
    cutoverRule:
      "stage-5-cutover-checklist-requires-operator-confirmation-before-traffic-shift",
  };
}
