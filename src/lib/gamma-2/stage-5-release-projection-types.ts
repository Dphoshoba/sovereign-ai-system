import type { GammaStage5SharedReleaseGraph } from "./stage-5-shared-release-graph";

export type GammaStage5ReleaseProjectionId =
  | "operator-handoff"
  | "operator-signoff"
  | "rollback-plan"
  | "release-approval-packet"
  | "release-promotion-plan"
  | "release-cutover-checklist"
  | "release-traffic-shift-plan"
  | "release-monitoring-plan"
  | "release-post-promotion-review"
  | "release-operations-index"
  | "release-closeout-packet"
  | "release-closure-ledger"
  | "release-completion-certificate"
  | "release-finalization-index"
  | "release-operator-registry"
  | "release-operator-action-queue"
  | "release-operator-approval-packet"
  | "release-operator-approval-audit-trail"
  | "release-operator-approval-receipt"
  | "release-production-authorization-ledger"
  | "release-production-cutover-packet";

export interface GammaStage5ReleaseProjectionContextMetrics {
  graphConstructionCount: 1;
  projectionInvocationCount: number;
  lateBuilderInvocationCount: 0;
  duplicateGraphCompositionCount: 0;
}

export interface GammaStage5ReleaseProjectionContext {
  graph: GammaStage5SharedReleaseGraph;
  metrics: Readonly<GammaStage5ReleaseProjectionContextMetrics>;
  contextRule: "stage-5-release-projections-consume-one-shared-release-graph";
}

export interface GammaStage5ReleaseProjectionRegistryEntry {
  order: number;
  id: GammaStage5ReleaseProjectionId;
  source: string;
  graphBacked: true;
  status: "migrated";
}
