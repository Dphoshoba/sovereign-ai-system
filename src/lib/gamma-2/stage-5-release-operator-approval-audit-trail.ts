import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5OperatorSignoffSource } from "./stage-5-operator-signoff";
import { buildGammaStage5ReleaseOperatorApprovalPacketSource } from "./stage-5-release-operator-approval-packet";
import { buildGammaStage5ReleaseProjectionContext } from "./stage-5-release-projection-context";
import { projectGammaStage5ReleaseOperatorApprovalAuditTrail } from "./stage-5-release-projection-registry";

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
  approvalBoundary: "human-approval-before-production";
  approvalRule: "stage-5-release-operator-approval-packet-requires-action-queue-signoff-and-human-production-approval";
  auditRule: "stage-5-release-operator-approval-audit-trail-records-packet-queue-signoff-boundary-and-verification";
}

export function buildGammaStage5ReleaseOperatorApprovalAuditTrailSource(): GammaStage5ReleaseOperatorApprovalAuditTrail {
  const approvalPacket = buildGammaStage5ReleaseOperatorApprovalPacketSource();
  const signoff = buildGammaStage5OperatorSignoffSource();

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
      evidence: approvalPacket.queueRule,
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
    approvalBoundary: approvalPacket.approvalBoundary,
    approvalRule: approvalPacket.approvalRule,
    auditRule:
      "stage-5-release-operator-approval-audit-trail-records-packet-queue-signoff-boundary-and-verification",
  };
}

export function buildGammaStage5ReleaseOperatorApprovalAuditTrail(): GammaStage5ReleaseOperatorApprovalAuditTrail {
  return projectGammaStage5ReleaseOperatorApprovalAuditTrail(buildGammaStage5ReleaseProjectionContext());
}
