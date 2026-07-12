import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5OperatorSignoff } from "./stage-5-operator-signoff";
import { buildGammaStage5ReleaseOperatorActionQueue } from "./stage-5-release-operator-action-queue";

export interface GammaStage5ReleaseOperatorApprovalPacketRequirement {
  order: number;
  id: string;
  label: string;
  source: string;
  evidence: string;
  required: true;
}

export interface GammaStage5ReleaseOperatorApprovalPacket {
  id: "gamma_2_stage_5_release_operator_approval_packet";
  status: "pending-human-production-approval";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  queueItemCount: number;
  readyItemCount: number;
  operatorRequiredItemCount: number;
  signoffRequirementCount: number;
  approvalRequirementCount: number;
  smoke: string;
  requirements: GammaStage5ReleaseOperatorApprovalPacketRequirement[];
  approvalBoundary: "human-approval-before-production";
  queueRule: "stage-5-release-operator-action-queue-requires-human-review-before-production-approval";
  approvalRule: "stage-5-release-operator-approval-packet-requires-action-queue-signoff-and-human-production-approval";
}

export function buildGammaStage5ReleaseOperatorApprovalPacket(): GammaStage5ReleaseOperatorApprovalPacket {
  const queue = buildGammaStage5ReleaseOperatorActionQueue();
  const signoff = buildGammaStage5OperatorSignoff();

  const requirements: GammaStage5ReleaseOperatorApprovalPacketRequirement[] = [
    {
      order: 1,
      id: "review-ready-records",
      label: "Review ready release records",
      source: "/api/gamma/stage-5/release-operator-action-queue",
      evidence: `${queue.readyItemCount} ready action`,
      required: true,
    },
    {
      order: 2,
      id: "approve-required-records",
      label: "Confirm approval-required release records",
      source: "/api/gamma/stage-5/release-operator-action-queue",
      evidence: `${queue.operatorRequiredItemCount} operator-required actions`,
      required: true,
    },
    {
      order: 3,
      id: "confirm-operator-signoff",
      label: "Confirm operator signoff requirements",
      source: "/api/gamma/stage-5/operator-signoff",
      evidence: signoff.signoffRule,
      required: true,
    },
    {
      order: 4,
      id: "retain-approval-boundary",
      label: "Retain human approval boundary",
      source: "/api/gamma/stage-5/release-gate",
      evidence: "human-approval-before-production",
      required: true,
    },
  ];

  return {
    id: "gamma_2_stage_5_release_operator_approval_packet",
    status: "pending-human-production-approval",
    generatedAt: new Date(queue.generatedAt),
    branch: queue.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: queue.apiSurfaceCount,
    queueItemCount: queue.queueItemCount,
    readyItemCount: queue.readyItemCount,
    operatorRequiredItemCount: queue.operatorRequiredItemCount,
    signoffRequirementCount: signoff.requirements.length,
    approvalRequirementCount: requirements.length,
    smoke: queue.smoke,
    requirements,
    approvalBoundary: "human-approval-before-production",
    queueRule: queue.queueRule,
    approvalRule:
      "stage-5-release-operator-approval-packet-requires-action-queue-signoff-and-human-production-approval",
  };
}
