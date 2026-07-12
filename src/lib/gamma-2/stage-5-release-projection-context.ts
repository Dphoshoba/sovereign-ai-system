import { buildGammaStage5SharedReleaseGraph } from "./stage-5-shared-release-graph";
import type { GammaStage5ReleaseProjectionContext } from "./stage-5-release-projection-types";

export function buildGammaStage5ReleaseProjectionContext(): GammaStage5ReleaseProjectionContext {
  return Object.freeze({
    graph: buildGammaStage5SharedReleaseGraph(),
    contextRule: "stage-5-release-projections-consume-one-shared-release-graph",
  });
}
