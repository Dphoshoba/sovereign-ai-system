import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5ReleaseProjectionContext } from "./stage-5-release-projection-context";
import { projectGammaStage5ReleaseProductionCutoverPacket } from "./stage-5-release-projection-registry";

export interface GammaStage5ReleaseProductionCutoverPacketItem {
  order: number;
  id: string;
  label: string;
  source: string;
  evidence: string;
  status: "pending-operator-cutover";
}

export interface GammaStage5ReleaseProductionCutoverPacket {
  id: "gamma_2_stage_5_release_production_cutover_packet";
  status: "pending-operator-production-cutover";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  cutoverItemCount: number;
  authorizationEntryCount: number;
  cutoverCheckCount: number;
  trafficShiftStepCount: number;
  rollbackStepCount: number;
  monitoringCheckCount: number;
  smoke: string;
  approvalBoundary: "human-approval-before-production";
  items: GammaStage5ReleaseProductionCutoverPacketItem[];
  cutoverPacketRule: "stage-5-production-cutover-packet-requires-authorization-cutover-traffic-rollback-monitoring-and-human-approval";
}

export function buildGammaStage5ReleaseProductionCutoverPacket(): GammaStage5ReleaseProductionCutoverPacket {
  return projectGammaStage5ReleaseProductionCutoverPacket(
    buildGammaStage5ReleaseProjectionContext()
  );
}
