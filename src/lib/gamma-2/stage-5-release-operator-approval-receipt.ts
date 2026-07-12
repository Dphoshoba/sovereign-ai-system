import { PRODUCTION_APP_URL } from "../site-config";
import { buildGammaStage5ReleaseOperatorApprovalAuditTrail } from "./stage-5-release-operator-approval-audit-trail";

export interface GammaStage5ReleaseOperatorApprovalReceiptRecord {
  order: number;
  id: string;
  label: string;
  source: string;
  evidence: string;
  status: "receipt-ready";
}

export interface GammaStage5ReleaseOperatorApprovalReceipt {
  id: "gamma_2_stage_5_release_operator_approval_receipt";
  status: "receipt-ready-pending-human-production-approval";
  generatedAt: Date;
  branch: "gamma";
  productionUrl: typeof PRODUCTION_APP_URL;
  apiSurfaceCount: number;
  receiptRecordCount: number;
  auditEntryCount: number;
  approvalRequirementCount: number;
  queueItemCount: number;
  smoke: string;
  approvalBoundary: "human-approval-before-production";
  records: GammaStage5ReleaseOperatorApprovalReceiptRecord[];
  receiptRule: "stage-5-release-operator-approval-receipt-preserves-packet-audit-boundary-and-smoke-evidence";
}

export function buildGammaStage5ReleaseOperatorApprovalReceipt(): GammaStage5ReleaseOperatorApprovalReceipt {
  const approvalAuditTrail = buildGammaStage5ReleaseOperatorApprovalAuditTrail();

  const records: GammaStage5ReleaseOperatorApprovalReceiptRecord[] = [
    {
      order: 1,
      id: "approval-packet-received",
      label: "Approval packet received",
      source: "/api/gamma/stage-5/release-operator-approval-packet",
      evidence: approvalAuditTrail.approvalRule,
      status: "receipt-ready",
    },
    {
      order: 2,
      id: "approval-audit-trail-received",
      label: "Approval audit trail received",
      source: "/api/gamma/stage-5/release-operator-approval-audit-trail",
      evidence: approvalAuditTrail.auditRule,
      status: "receipt-ready",
    },
    {
      order: 3,
      id: "human-boundary-received",
      label: "Human approval boundary received",
      source: "/api/gamma/stage-5/release-gate",
      evidence: approvalAuditTrail.approvalBoundary,
      status: "receipt-ready",
    },
    {
      order: 4,
      id: "smoke-evidence-received",
      label: "Smoke verification received",
      source: "/api/gamma/stage-5/health",
      evidence: approvalAuditTrail.smoke,
      status: "receipt-ready",
    },
  ];

  return {
    id: "gamma_2_stage_5_release_operator_approval_receipt",
    status: "receipt-ready-pending-human-production-approval",
    generatedAt: new Date(approvalAuditTrail.generatedAt),
    branch: approvalAuditTrail.branch,
    productionUrl: PRODUCTION_APP_URL,
    apiSurfaceCount: approvalAuditTrail.apiSurfaceCount,
    receiptRecordCount: records.length,
    auditEntryCount: approvalAuditTrail.auditEntryCount,
    approvalRequirementCount: approvalAuditTrail.approvalRequirementCount,
    queueItemCount: approvalAuditTrail.queueItemCount,
    smoke: approvalAuditTrail.smoke,
    approvalBoundary: approvalAuditTrail.approvalBoundary,
    records,
    receiptRule:
      "stage-5-release-operator-approval-receipt-preserves-packet-audit-boundary-and-smoke-evidence",
  };
}
