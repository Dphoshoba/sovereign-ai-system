import { buildGammaStage5ReleaseGate } from "./stage-5-release-gate";

export type GammaStage5PromotionStepStatus = "complete" | "operator-required";

export interface GammaStage5PromotionStep {
  id: string;
  order: number;
  title: string;
  status: GammaStage5PromotionStepStatus;
  evidence: string;
}

export interface GammaStage5PromotionChecklist {
  id: "gamma_2_stage_5_promotion_checklist";
  status: "operator-review-ready";
  generatedAt: Date;
  productionUrl: string;
  steps: GammaStage5PromotionStep[];
  rollbackPlan: string[];
  approvalBoundary: "human-approval-before-production";
  checklistRule: "ordered-operator-steps-before-production-promotion";
}

export function buildGammaStage5PromotionChecklist(): GammaStage5PromotionChecklist {
  const releaseGate = buildGammaStage5ReleaseGate();

  return {
    id: "gamma_2_stage_5_promotion_checklist",
    status: "operator-review-ready",
    generatedAt: new Date(releaseGate.generatedAt),
    productionUrl: releaseGate.productionUrl,
    steps: [
      {
        id: "review-readiness",
        order: 1,
        title: "Review Stage 5 readiness snapshot",
        status: "complete",
        evidence: "/api/gamma/stage-5/readiness",
      },
      {
        id: "review-evidence",
        order: 2,
        title: "Review Stage 5 evidence bundle",
        status: "complete",
        evidence: "/api/gamma/stage-5/evidence",
      },
      {
        id: "review-release-gate",
        order: 3,
        title: "Review Stage 5 release gate",
        status: "complete",
        evidence: "/api/gamma/stage-5/release-gate",
      },
      {
        id: "confirm-env",
        order: 4,
        title: "Confirm Vercel public app URLs match production origin",
        status: "operator-required",
        evidence: releaseGate.productionUrl,
      },
      {
        id: "operator-approval",
        order: 5,
        title: "Approve production promotion",
        status: "operator-required",
        evidence: "human-approval-before-production",
      },
    ],
    rollbackPlan: [
      "Keep branch gamma as the verified source of truth",
      "Use the previous production deployment if promotion fails",
      "Re-run npm run smoke:v1 against the promoted origin",
      "Do not bypass human approval for external connector execution",
    ],
    approvalBoundary: "human-approval-before-production",
    checklistRule: "ordered-operator-steps-before-production-promotion",
  };
}
