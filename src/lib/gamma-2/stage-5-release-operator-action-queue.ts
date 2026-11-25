import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5ReleaseOperatorRegistrySource } from "./stage-5-release-operator-registry";
import { buildGammaStage5ReleaseProjectionContext } from "./stage-5-release-projection-context";
import { projectGammaStage5ReleaseOperatorActionQueue } from "./stage-5-release-projection-registry";

export interface GammaStage5ReleaseOperatorActionQueueItem {
  order: number;
  id: string;
  label: string;
  source: string;
  action: string;
  status: "ready" | "operator-required";
  owner: "operator";
  evidence: string;
}

export interface GammaStage5ReleaseOperatorActionQueue {
  id: "gamma_2_stage_5_release_operator_action_queue";
  status: "pending-operator-actions";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  queueItemCount: number;
  readyItemCount: number;
  operatorRequiredItemCount: number;
  registryRecordCount: number;
  smoke: string;
  items: GammaStage5ReleaseOperatorActionQueueItem[];
  queueRule: "stage-5-release-operator-action-queue-requires-human-review-before-production-approval";
}

function actionForStatus(status: "ready" | "operator-required") {
  return status === "ready" ? "review-record" : "confirm-and-approve-record";
}

export function buildGammaStage5ReleaseOperatorActionQueueSource(): GammaStage5ReleaseOperatorActionQueue {
  const registry = buildGammaStage5ReleaseOperatorRegistrySource();
  const items = registry.records.map((record): GammaStage5ReleaseOperatorActionQueueItem => ({
    order: record.order,
    id: `${record.id}-action`,
    label: record.label,
    source: record.source,
    action: actionForStatus(record.status),
    status: record.status,
    owner: record.owner,
    evidence: record.evidence,
  }));
  const readyItemCount = items.filter((item) => item.status === "ready").length;
  const operatorRequiredItemCount = items.filter(
    (item) => item.status === "operator-required"
  ).length;

  return {
    id: "gamma_2_stage_5_release_operator_action_queue",
    status: "pending-operator-actions",
    generatedAt: new Date(registry.generatedAt),
    branch: registry.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: registry.apiSurfaceCount,
    queueItemCount: items.length,
    readyItemCount,
    operatorRequiredItemCount,
    registryRecordCount: registry.registryRecordCount,
    smoke: registry.smoke,
    items,
    queueRule:
      "stage-5-release-operator-action-queue-requires-human-review-before-production-approval",
  };
}

export function buildGammaStage5ReleaseOperatorActionQueue(): GammaStage5ReleaseOperatorActionQueue {
  return projectGammaStage5ReleaseOperatorActionQueue(buildGammaStage5ReleaseProjectionContext());
}
