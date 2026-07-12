import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5ReleaseEvidenceContext } from "./stage-5-release-evidence-context";

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
  const context = buildGammaStage5ReleaseEvidenceContext();
  const {
    authorizationLedger,
    cutoverChecklist,
    trafficShiftPlan,
    rollbackPlan,
    monitoringPlan,
  } = context;

  const items: GammaStage5ReleaseProductionCutoverPacketItem[] = [
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
