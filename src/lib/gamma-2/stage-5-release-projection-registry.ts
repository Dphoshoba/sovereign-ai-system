import { PRODUCTION_APP_URL } from "../site-config";
import type { GammaStage5OperatorHandoff } from "./stage-5-operator-handoff";
import type { GammaStage5OperatorSignoff } from "./stage-5-operator-signoff";
import type { GammaStage5ReleaseApprovalPacket } from "./stage-5-release-approval-packet";
import type { GammaStage5ReleaseCloseoutPacket } from "./stage-5-release-closeout-packet";
import type { GammaStage5ReleaseClosureLedger } from "./stage-5-release-closure-ledger";
import type { GammaStage5ReleaseCompletionCertificate } from "./stage-5-release-completion-certificate";
import type { GammaStage5ReleaseCutoverChecklist } from "./stage-5-release-cutover-checklist";
import type { GammaStage5ReleaseFinalizationIndex } from "./stage-5-release-finalization-index";
import type { GammaStage5ReleaseMonitoringPlan } from "./stage-5-release-monitoring-plan";
import type { GammaStage5ReleaseOperationsIndex } from "./stage-5-release-operations-index";
import type { GammaStage5ReleaseOperatorActionQueue } from "./stage-5-release-operator-action-queue";
import type { GammaStage5ReleaseOperatorApprovalAuditTrail } from "./stage-5-release-operator-approval-audit-trail";
import type { GammaStage5ReleaseOperatorApprovalPacket } from "./stage-5-release-operator-approval-packet";
import type { GammaStage5ReleaseOperatorApprovalReceipt } from "./stage-5-release-operator-approval-receipt";
import type { GammaStage5ReleaseOperatorRegistry } from "./stage-5-release-operator-registry";
import type { GammaStage5ReleasePostPromotionReview } from "./stage-5-release-post-promotion-review";
import type { GammaStage5ReleaseProductionAuthorizationLedger } from "./stage-5-release-production-authorization-ledger";
import type { GammaStage5ReleaseProductionCutoverPacket } from "./stage-5-release-production-cutover-packet";
import type { GammaStage5ReleasePromotionPlan } from "./stage-5-release-promotion-plan";
import type { GammaStage5ReleaseTrafficShiftPlan } from "./stage-5-release-traffic-shift-plan";
import type {
  GammaStage5ReleaseProjectionContext,
  GammaStage5ReleaseProjectionRegistryEntry,
} from "./stage-5-release-projection-types";
import type { GammaStage5RollbackPlan } from "./stage-5-rollback-plan";

export const GAMMA_STAGE_5_RELEASE_PROJECTION_REGISTRY: readonly GammaStage5ReleaseProjectionRegistryEntry[] =
  Object.freeze([
    {
      order: 1,
      id: "operator-handoff",
      source: "src/lib/gamma-2/stage-5-operator-handoff.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 2,
      id: "operator-signoff",
      source: "src/lib/gamma-2/stage-5-operator-signoff.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 3,
      id: "rollback-plan",
      source: "src/lib/gamma-2/stage-5-rollback-plan.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 4,
      id: "release-approval-packet",
      source: "src/lib/gamma-2/stage-5-release-approval-packet.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 5,
      id: "release-promotion-plan",
      source: "src/lib/gamma-2/stage-5-release-promotion-plan.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 6,
      id: "release-cutover-checklist",
      source: "src/lib/gamma-2/stage-5-release-cutover-checklist.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 7,
      id: "release-traffic-shift-plan",
      source: "src/lib/gamma-2/stage-5-release-traffic-shift-plan.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 8,
      id: "release-monitoring-plan",
      source: "src/lib/gamma-2/stage-5-release-monitoring-plan.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 9,
      id: "release-post-promotion-review",
      source: "src/lib/gamma-2/stage-5-release-post-promotion-review.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 10,
      id: "release-operations-index",
      source: "src/lib/gamma-2/stage-5-release-operations-index.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 11,
      id: "release-closeout-packet",
      source: "src/lib/gamma-2/stage-5-release-closeout-packet.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 12,
      id: "release-closure-ledger",
      source: "src/lib/gamma-2/stage-5-release-closure-ledger.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 13,
      id: "release-completion-certificate",
      source: "src/lib/gamma-2/stage-5-release-completion-certificate.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 14,
      id: "release-finalization-index",
      source: "src/lib/gamma-2/stage-5-release-finalization-index.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 15,
      id: "release-operator-registry",
      source: "src/lib/gamma-2/stage-5-release-operator-registry.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 16,
      id: "release-operator-action-queue",
      source: "src/lib/gamma-2/stage-5-release-operator-action-queue.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 17,
      id: "release-operator-approval-packet",
      source: "src/lib/gamma-2/stage-5-release-operator-approval-packet.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 18,
      id: "release-operator-approval-audit-trail",
      source: "src/lib/gamma-2/stage-5-release-operator-approval-audit-trail.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 19,
      id: "release-operator-approval-receipt",
      source: "src/lib/gamma-2/stage-5-release-operator-approval-receipt.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 20,
      id: "release-production-authorization-ledger",
      source: "src/lib/gamma-2/stage-5-release-production-authorization-ledger.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 21,
      id: "release-production-cutover-packet",
      source: "src/lib/gamma-2/stage-5-release-production-cutover-packet.ts",
      graphBacked: true,
      status: "migrated",
    },
  ]);

export function getGammaStage5ReleaseProjectionRegistry(): GammaStage5ReleaseProjectionRegistryEntry[] {
  return [...GAMMA_STAGE_5_RELEASE_PROJECTION_REGISTRY].sort((a, b) => a.order - b.order);
}

function cloneProjection<T>(projection: T): T {
  return structuredClone(projection);
}

export function projectGammaStage5OperatorHandoff(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5OperatorHandoff {
  return cloneProjection(context.graph.projections.operatorHandoff);
}

export function projectGammaStage5OperatorSignoff(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5OperatorSignoff {
  return cloneProjection(context.graph.projections.operatorSignoff);
}

export function projectGammaStage5RollbackPlan(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5RollbackPlan {
  return cloneProjection(context.graph.projections.rollbackPlan);
}

export function projectGammaStage5ReleaseApprovalPacket(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5ReleaseApprovalPacket {
  return cloneProjection(context.graph.projections.approvalPacket);
}

export function projectGammaStage5ReleasePromotionPlan(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5ReleasePromotionPlan {
  return cloneProjection(context.graph.projections.promotionPlan);
}

export function projectGammaStage5ReleaseCutoverChecklist(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5ReleaseCutoverChecklist {
  return cloneProjection(context.graph.projections.cutoverChecklist);
}

export function projectGammaStage5ReleaseTrafficShiftPlan(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5ReleaseTrafficShiftPlan {
  return cloneProjection(context.graph.projections.trafficShiftPlan);
}

export function projectGammaStage5ReleaseMonitoringPlan(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5ReleaseMonitoringPlan {
  return cloneProjection(context.graph.projections.monitoringPlan);
}

export function projectGammaStage5ReleasePostPromotionReview(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5ReleasePostPromotionReview {
  return cloneProjection(context.graph.projections.postPromotionReview);
}

export function projectGammaStage5ReleaseOperationsIndex(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5ReleaseOperationsIndex {
  return cloneProjection(context.graph.projections.operationsIndex);
}

export function projectGammaStage5ReleaseCloseoutPacket(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5ReleaseCloseoutPacket {
  return cloneProjection(context.graph.projections.closeoutPacket);
}

export function projectGammaStage5ReleaseClosureLedger(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5ReleaseClosureLedger {
  return cloneProjection(context.graph.projections.closureLedger);
}

export function projectGammaStage5ReleaseCompletionCertificate(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5ReleaseCompletionCertificate {
  return cloneProjection(context.graph.projections.completionCertificate);
}

export function projectGammaStage5ReleaseFinalizationIndex(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5ReleaseFinalizationIndex {
  return cloneProjection(context.graph.projections.finalizationIndex);
}

export function projectGammaStage5ReleaseOperatorRegistry(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5ReleaseOperatorRegistry {
  return cloneProjection(context.graph.projections.operatorRegistry);
}

export function projectGammaStage5ReleaseOperatorActionQueue(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5ReleaseOperatorActionQueue {
  return cloneProjection(context.graph.projections.operatorActionQueue);
}

export function projectGammaStage5ReleaseOperatorApprovalPacket(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5ReleaseOperatorApprovalPacket {
  return cloneProjection(context.graph.projections.operatorApprovalPacket);
}

export function projectGammaStage5ReleaseOperatorApprovalAuditTrail(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5ReleaseOperatorApprovalAuditTrail {
  return cloneProjection(context.graph.projections.operatorApprovalAuditTrail);
}

export function projectGammaStage5ReleaseOperatorApprovalReceipt(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5ReleaseOperatorApprovalReceipt {
  return cloneProjection(context.graph.projections.operatorApprovalReceipt);
}

export function projectGammaStage5ReleaseProductionAuthorizationLedger(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5ReleaseProductionAuthorizationLedger {
  return cloneProjection(context.graph.projections.authorizationLedger);
}

export function projectGammaStage5ReleaseProductionCutoverPacket(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5ReleaseProductionCutoverPacket {
  const {
    authorizationLedger,
    cutoverChecklist,
    trafficShiftPlan,
    rollbackPlan,
    monitoringPlan,
  } = context.graph.projections;

  const items: GammaStage5ReleaseProductionCutoverPacket["items"] = [
    {
      order: 1,
      id: "authorization-ledger-bound",
      label: "Bind production authorization ledger",
      source: "/api/gamma/stage-5/release-production-authorization-ledger",
      evidence: authorizationLedger.authorizationRule,
      status: "pending-operator-cutover",
    },
    {
      order: 2,
      id: "cutover-checklist-bound",
      label: "Bind cutover checklist",
      source: "/api/gamma/stage-5/release-cutover-checklist",
      evidence: cutoverChecklist.cutoverRule,
      status: "pending-operator-cutover",
    },
    {
      order: 3,
      id: "traffic-shift-plan-bound",
      label: "Bind traffic shift plan",
      source: "/api/gamma/stage-5/release-traffic-shift-plan",
      evidence: trafficShiftPlan.trafficShiftRule,
      status: "pending-operator-cutover",
    },
    {
      order: 4,
      id: "rollback-plan-bound",
      label: "Bind rollback plan",
      source: "/api/gamma/stage-5/rollback-plan",
      evidence: rollbackPlan.rollbackRule,
      status: "pending-operator-cutover",
    },
    {
      order: 5,
      id: "monitoring-plan-bound",
      label: "Bind monitoring plan",
      source: "/api/gamma/stage-5/release-monitoring-plan",
      evidence: monitoringPlan.monitoringRule,
      status: "pending-operator-cutover",
    },
    {
      order: 6,
      id: "human-approval-bound",
      label: "Bind human approval boundary",
      source: "/api/gamma/stage-5/release-gate",
      evidence: authorizationLedger.approvalBoundary,
      status: "pending-operator-cutover",
    },
  ];

  return {
    id: "gamma_2_stage_5_release_production_cutover_packet",
    status: "pending-operator-production-cutover",
    generatedAt: new Date(authorizationLedger.generatedAt),
    branch: authorizationLedger.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: authorizationLedger.apiSurfaceCount,
    cutoverItemCount: items.length,
    authorizationEntryCount: authorizationLedger.authorizationEntryCount,
    cutoverCheckCount: cutoverChecklist.cutoverCheckCount,
    trafficShiftStepCount: trafficShiftPlan.trafficShiftStepCount,
    rollbackStepCount: rollbackPlan.steps.length,
    monitoringCheckCount: monitoringPlan.monitoringCheckCount,
    smoke: authorizationLedger.smoke,
    approvalBoundary: authorizationLedger.approvalBoundary,
    items,
    cutoverPacketRule:
      "stage-5-production-cutover-packet-requires-authorization-cutover-traffic-rollback-monitoring-and-human-approval",
  };
}
