import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5ReleaseArchiveManifest } from "./stage-5-release-archive-manifest";
import { buildGammaStage5ReleaseBundle } from "./stage-5-release-bundle";
import { buildGammaStage5ReleaseOperationsIndexSource } from "./stage-5-release-operations-index";
import { buildGammaStage5ReleasePostPromotionReviewSource } from "./stage-5-release-post-promotion-review";
import { buildGammaStage5ReleaseProjectionContext } from "./stage-5-release-projection-context";
import { projectGammaStage5ReleaseCloseoutPacket } from "./stage-5-release-projection-registry";
import { buildGammaStage5ReleaseRetentionPolicy } from "./stage-5-release-retention-policy";
import { buildGammaStage5RollbackPlanSource } from "./stage-5-rollback-plan";

export interface GammaStage5ReleaseCloseoutItem {
  order: number;
  id: string;
  label: string;
  source: string;
  evidence: string;
  owner: "operator";
  status: "pending-closeout-confirmation";
}

export interface GammaStage5ReleaseCloseoutPacket {
  id: "gamma_2_stage_5_release_closeout_packet";
  status: "pending-operator-closeout";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  closeoutItemCount: number;
  operationsStepCount: number;
  postPromotionReviewItemCount: number;
  bundleArtifactCount: number;
  archiveItemCount: number;
  retentionRuleCount: number;
  rollbackStepCount: number;
  smoke: string;
  items: GammaStage5ReleaseCloseoutItem[];
  closeoutRule: "stage-5-release-closeout-requires-operations-review-bundle-archive-retention-and-rollback-evidence";
}

export function buildGammaStage5ReleaseCloseoutPacketSource(): GammaStage5ReleaseCloseoutPacket {
  const operationsIndex = buildGammaStage5ReleaseOperationsIndexSource();
  const postPromotionReview = buildGammaStage5ReleasePostPromotionReviewSource();
  const releaseBundle = buildGammaStage5ReleaseBundle();
  const archiveManifest = buildGammaStage5ReleaseArchiveManifest();
  const retentionPolicy = buildGammaStage5ReleaseRetentionPolicy();
  const rollbackPlan = buildGammaStage5RollbackPlanSource();

  const items: GammaStage5ReleaseCloseoutItem[] = [
    {
      order: 1,
      id: "operations-sequence-reviewed",
      label: "Review release operations sequence",
      source: "/api/gamma/stage-5/release-operations-index",
      evidence: operationsIndex.operationsRule,
      owner: "operator",
      status: "pending-closeout-confirmation",
    },
    {
      order: 2,
      id: "post-promotion-review-confirmed",
      label: "Confirm post-promotion review",
      source: "/api/gamma/stage-5/release-post-promotion-review",
      evidence: postPromotionReview.reviewRule,
      owner: "operator",
      status: "pending-closeout-confirmation",
    },
    {
      order: 3,
      id: "release-bundle-retained",
      label: "Retain release bundle",
      source: "/api/gamma/stage-5/release-bundle",
      evidence: releaseBundle.bundleRule,
      owner: "operator",
      status: "pending-closeout-confirmation",
    },
    {
      order: 4,
      id: "archive-manifest-retained",
      label: "Retain release archive manifest",
      source: "/api/gamma/stage-5/release-archive-manifest",
      evidence: archiveManifest.archiveRule,
      owner: "operator",
      status: "pending-closeout-confirmation",
    },
    {
      order: 5,
      id: "retention-policy-confirmed",
      label: "Confirm release retention policy",
      source: "/api/gamma/stage-5/release-retention-policy",
      evidence: retentionPolicy.retentionRule,
      owner: "operator",
      status: "pending-closeout-confirmation",
    },
    {
      order: 6,
      id: "rollback-plan-retained",
      label: "Retain rollback plan",
      source: "/api/gamma/stage-5/rollback-plan",
      evidence: rollbackPlan.rollbackRule,
      owner: "operator",
      status: "pending-closeout-confirmation",
    },
  ];

  return {
    id: "gamma_2_stage_5_release_closeout_packet",
    status: "pending-operator-closeout",
    generatedAt: new Date(operationsIndex.generatedAt),
    branch: operationsIndex.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: operationsIndex.apiSurfaceCount,
    closeoutItemCount: items.length,
    operationsStepCount: operationsIndex.operationsStepCount,
    postPromotionReviewItemCount: postPromotionReview.reviewItemCount,
    bundleArtifactCount: releaseBundle.artifacts.length,
    archiveItemCount: archiveManifest.archiveItems.length,
    retentionRuleCount: retentionPolicy.retentionRules.length,
    rollbackStepCount: rollbackPlan.steps.length,
    smoke: operationsIndex.smoke,
    items,
    closeoutRule:
      "stage-5-release-closeout-requires-operations-review-bundle-archive-retention-and-rollback-evidence",
  };
}

export function buildGammaStage5ReleaseCloseoutPacket(): GammaStage5ReleaseCloseoutPacket {
  return projectGammaStage5ReleaseCloseoutPacket(buildGammaStage5ReleaseProjectionContext());
}
