import type { GammaStage5SharedReleaseGraph } from "./stage-5-shared-release-graph";

export type GammaStage5ReleaseProjectionId =
  | "rollback-plan"
  | "release-cutover-checklist"
  | "release-traffic-shift-plan"
  | "release-monitoring-plan"
  | "release-production-authorization-ledger"
  | "release-production-cutover-packet";

export interface GammaStage5ReleaseProjectionContext {
  graph: GammaStage5SharedReleaseGraph;
  contextRule: "stage-5-release-projections-consume-one-shared-release-graph";
}

export interface GammaStage5ReleaseProjectionRegistryEntry {
  order: number;
  id: GammaStage5ReleaseProjectionId;
  source: string;
  graphBacked: true;
  status: "migrated";
}
