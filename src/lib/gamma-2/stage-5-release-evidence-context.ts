import { buildGammaStage5SharedReleaseGraph } from "./stage-5-shared-release-graph";

export interface GammaStage5ReleaseEvidenceContext {
  generatedAt: Date;
  authorizationLedger: ReturnType<typeof buildGammaStage5SharedReleaseGraph>["projections"]["authorizationLedger"];
  cutoverChecklist: ReturnType<typeof buildGammaStage5SharedReleaseGraph>["projections"]["cutoverChecklist"];
  trafficShiftPlan: ReturnType<typeof buildGammaStage5SharedReleaseGraph>["projections"]["trafficShiftPlan"];
  rollbackPlan: ReturnType<typeof buildGammaStage5SharedReleaseGraph>["projections"]["rollbackPlan"];
  monitoringPlan: ReturnType<typeof buildGammaStage5SharedReleaseGraph>["projections"]["monitoringPlan"];
  sourceBuilderCount: 1;
  graphProjectionCount: number;
  contextRule: "stage-5-release-evidence-context-projects-from-shared-release-graph";
}

export function buildGammaStage5ReleaseEvidenceContext(): GammaStage5ReleaseEvidenceContext {
  const graph = buildGammaStage5SharedReleaseGraph();
  const {
    authorizationLedger,
    cutoverChecklist,
    trafficShiftPlan,
    rollbackPlan,
    monitoringPlan,
  } = graph.projections;

  return {
    generatedAt: new Date(graph.generatedAt),
    authorizationLedger,
    cutoverChecklist,
    trafficShiftPlan,
    rollbackPlan,
    monitoringPlan,
    sourceBuilderCount: 1,
    graphProjectionCount: graph.projectionCount,
    contextRule: "stage-5-release-evidence-context-projects-from-shared-release-graph",
  };
}
