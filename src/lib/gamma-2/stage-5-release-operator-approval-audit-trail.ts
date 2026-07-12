import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5OperatorSignoff } from "./stage-5-operator-signoff";
import { buildGammaStage5ReleaseOperatorActionQueue } from "./stage-5-release-operator-action-queue";
import { buildGammaStage5ReleaseOperatorApprovalPacket } from "./stage-5-release-operator-approval-packet";

export interface GammaStage5ReleaseOperatorApprovalAuditEntry {
  order: number;
  id: string;
  event: string;
  source: string;
  evidence: string;
  actor: "operator" | "release-client";
  status: "audit-ready";
}

export interface GammaStage5ReleaseOperatorApprovalAuditTrail {
  id: "gamma_2_stage_5_release_operator_approval_audit_trail";
  status: "audit-ready-pending-human-approval";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  auditEntryCount: number;
  queueItemCount: number;
  approvalRequirementCount: number;
  operatorRequiredItemCount: number;
  signoffRequirementCount: number;
  smoke: string;
  entries: GammaStage5ReleaseOperatorApprovalAuditEntry[];
  auditRule: "stage-5-release-operator-approval-audit-trail-records-packet-queue-signoff-boundary-and-verification";
}

export function buildGammaStage5ReleaseOperatorApprovalAuditTrail(): GammaStage5ReleaseOperatorApprovalAuditTrail {
  const approvalPacket = buildGammaStage5ReleaseOperatorApprovalPacket();
  const actionQueue = buildGammaStage5ReleaseOperatorActionQueue();
  const signoff = buildGammaStage5OperatorSignoff();

  const entries: GammaStage5ReleaseOperatorApprovalAuditEntry[] = [
    {
      order: 1,
      id: "operator-approval-packet-recorded",
      event: "Operator approval packet prepared",
      source: "/api/gamma/stage-5/release-operator-approval-packet",
      evidence: approvalPacket.approvalRule,
      actor: "operator",
      status: "audit-ready",
    },
    {
      order: 2,
      id: "operator-action-queue-recorded",
      event: "Operator action queue prepared",
      source: "/api/gamma/stage-5/release-operator-action-queue",
      evidence: actionQueue.queueRule,
      actor: "operator",
      status: "audit-ready",
    },
    {
      order: 3,
      id: "operator-signoff-recorded",
      event: "Operator signoff requirements recorded",
      source: "/api/gamma/stage-5/operator-signoff",
      evidence: signoff.signoffRule,
      actor: "operator",
      status: "audit-ready",
    },
    {
      order: 4,
      id: "approval-boundary-recorded",
      event: "Human approval boundary retained",
      source: "/api/gamma/stage-5/release-gate",
      evidence: approvalPacket.approvalBoundary,
      actor: "release-client",
      status: "audit-ready",
    },
    {
      order: 5,
      id: "verification-recorded",
      event: "Stage 5 smoke verification recorded",
      source: "/api/gamma/stage-5/health",
      evidence: approvalPacket.smoke,
      actor: "release-client",
      status: "audit-ready",
    },
  ];

  return {
    id: "gamma_2_stage_5_release_operator_approval_audit_trail",
    status: "audit-ready-pending-human-approval",
    generatedAt: new Date(approvalPacket.generatedAt),
    branch: approvalPacket.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: approvalPacket.apiSurfaceCount,
    auditEntryCount: entries.length,
    queueItemCount: approvalPacket.queueItemCount,
    approvalRequirementCount: approvalPacket.approvalRequirementCount,
    operatorRequiredItemCount: approvalPacket.operatorRequiredItemCount,
    signoffRequirementCount: approvalPacket.signoffRequirementCount,
    smoke: approvalPacket.smoke,
    entries,
    auditRule:
      "stage-5-release-operator-approval-audit-trail-records-packet-queue-signoff-boundary-and-verification",
  };
}
