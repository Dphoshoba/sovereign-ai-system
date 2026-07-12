import { buildGammaStage5ReleaseCutoverChecklist } from "./stage-5-release-cutover-checklist";
import { buildGammaStage5ReleaseMonitoringPlan } from "./stage-5-release-monitoring-plan";
import { buildGammaStage5ReleaseProductionAuthorizationLedger } from "./stage-5-release-production-authorization-ledger";
import { buildGammaStage5ReleaseTrafficShiftPlan } from "./stage-5-release-traffic-shift-plan";
import { buildGammaStage5RollbackPlan } from "./stage-5-rollback-plan";

export interface GammaStage5SharedReleaseGraphProjectionSet {
  authorizationLedger: ReturnType<typeof buildGammaStage5ReleaseProductionAuthorizationLedger>;
  cutoverChecklist: ReturnType<typeof buildGammaStage5ReleaseCutoverChecklist>;
  trafficShiftPlan: ReturnType<typeof buildGammaStage5ReleaseTrafficShiftPlan>;
  rollbackPlan: ReturnType<typeof buildGammaStage5RollbackPlan>;
  monitoringPlan: ReturnType<typeof buildGammaStage5ReleaseMonitoringPlan>;
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
  const projections: GammaStage5SharedReleaseGraphProjectionSet = {
    authorizationLedger: buildGammaStage5ReleaseProductionAuthorizationLedger(),
    cutoverChecklist: buildGammaStage5ReleaseCutoverChecklist(),
    trafficShiftPlan: buildGammaStage5ReleaseTrafficShiftPlan(),
    rollbackPlan: buildGammaStage5RollbackPlan(),
    monitoringPlan: buildGammaStage5ReleaseMonitoringPlan(),
  };

  return {
    id: "gamma_2_stage_5_shared_release_graph",
    status: "ready-for-release-projections",
    generatedAt: new Date(projections.authorizationLedger.generatedAt),
    sourceArtifactCount: 5,
    projectionCount: 5,
    projections: Object.freeze(projections),
    graphRule: "stage-5-release-graph-composes-shared-evidence-once-for-release-projections",
  };
}
