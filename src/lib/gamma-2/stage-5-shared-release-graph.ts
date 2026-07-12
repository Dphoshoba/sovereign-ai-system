import { buildGammaStage5ReleaseApprovalPacketSource } from "./stage-5-release-approval-packet";
import { buildGammaStage5ReleaseCutoverChecklistSource } from "./stage-5-release-cutover-checklist";
import { buildGammaStage5ReleaseMonitoringPlanSource } from "./stage-5-release-monitoring-plan";
import { buildGammaStage5ReleaseProductionAuthorizationLedgerSource } from "./stage-5-release-production-authorization-ledger";
import { buildGammaStage5ReleaseTrafficShiftPlanSource } from "./stage-5-release-traffic-shift-plan";
import { buildGammaStage5RollbackPlanSource } from "./stage-5-rollback-plan";

export interface GammaStage5SharedReleaseGraphProjectionSet {
  approvalPacket: ReturnType<typeof buildGammaStage5ReleaseApprovalPacketSource>;
  authorizationLedger: ReturnType<typeof buildGammaStage5ReleaseProductionAuthorizationLedgerSource>;
  cutoverChecklist: ReturnType<typeof buildGammaStage5ReleaseCutoverChecklistSource>;
  trafficShiftPlan: ReturnType<typeof buildGammaStage5ReleaseTrafficShiftPlanSource>;
  rollbackPlan: ReturnType<typeof buildGammaStage5RollbackPlanSource>;
  monitoringPlan: ReturnType<typeof buildGammaStage5ReleaseMonitoringPlanSource>;
}

export interface GammaStage5SharedReleaseGraph {
  id: "gamma_2_stage_5_shared_release_graph";
  status: "ready-for-release-projections";
  generatedAt: Date;
  sourceArtifactCount: 5;
  projectionCount: 5;
  projections: Readonly<GammaStage5SharedReleaseGraphProjectionSet>;
  graphRule: "stage-5-release-graph-composes-shared-evidence-once-for-release-projections";
}

export function buildGammaStage5SharedReleaseGraph(): GammaStage5SharedReleaseGraph {
  const projections = Object.freeze({
    get authorizationLedger() {
      return buildGammaStage5ReleaseProductionAuthorizationLedgerSource();
    },
    get approvalPacket() {
      return buildGammaStage5ReleaseApprovalPacketSource();
    },
    get cutoverChecklist() {
      return buildGammaStage5ReleaseCutoverChecklistSource();
    },
    get trafficShiftPlan() {
      return buildGammaStage5ReleaseTrafficShiftPlanSource();
    },
    get rollbackPlan() {
      return buildGammaStage5RollbackPlanSource();
    },
    get monitoringPlan() {
      return buildGammaStage5ReleaseMonitoringPlanSource();
    },
  }) satisfies Readonly<GammaStage5SharedReleaseGraphProjectionSet>;

  return {
    id: "gamma_2_stage_5_shared_release_graph",
    status: "ready-for-release-projections",
    generatedAt: new Date("2026-07-12T00:00:00.000Z"),
    sourceArtifactCount: 5,
    projectionCount: 5,
    projections,
    graphRule: "stage-5-release-graph-composes-shared-evidence-once-for-release-projections",
  };
}
