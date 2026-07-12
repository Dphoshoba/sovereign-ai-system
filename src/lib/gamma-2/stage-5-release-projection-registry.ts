import { PRODUCTION_APP_URL } from "../site-config";
import type { GammaStage5ReleaseCutoverChecklist } from "./stage-5-release-cutover-checklist";
import type { GammaStage5ReleaseMonitoringPlan } from "./stage-5-release-monitoring-plan";
import type { GammaStage5ReleaseProductionAuthorizationLedger } from "./stage-5-release-production-authorization-ledger";
import type { GammaStage5ReleaseProductionCutoverPacket } from "./stage-5-release-production-cutover-packet";
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
      id: "rollback-plan",
      source: "src/lib/gamma-2/stage-5-rollback-plan.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 2,
      id: "release-cutover-checklist",
      source: "src/lib/gamma-2/stage-5-release-cutover-checklist.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 3,
      id: "release-traffic-shift-plan",
      source: "src/lib/gamma-2/stage-5-release-traffic-shift-plan.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 4,
      id: "release-monitoring-plan",
      source: "src/lib/gamma-2/stage-5-release-monitoring-plan.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 5,
      id: "release-production-authorization-ledger",
      source: "src/lib/gamma-2/stage-5-release-production-authorization-ledger.ts",
      graphBacked: true,
      status: "migrated",
    },
    {
      order: 6,
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

export function projectGammaStage5RollbackPlan(
  context: GammaStage5ReleaseProjectionContext
): GammaStage5RollbackPlan {
  return cloneProjection(context.graph.projections.rollbackPlan);
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
