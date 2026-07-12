import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-operator-approval-receipt/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseOperatorApprovalReceipt } from "../../src/lib/gamma-2/stage-5-release-operator-approval-receipt";

describe("Gamma 2 Stage 5 release operator approval receipt", () => {
  it("builds a pending human approval receipt", () => {
    const receipt = buildGammaStage5ReleaseOperatorApprovalReceipt();

    expect(receipt.id).toBe("gamma_2_stage_5_release_operator_approval_receipt");
    expect(receipt.status).toBe("receipt-ready-pending-human-production-approval");
    expect(receipt.branch).toBe("gamma");
    expect(receipt.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(receipt.apiSurfaceCount).toBe(45);
    expect(receipt.receiptRecordCount).toBe(4);
    expect(receipt.auditEntryCount).toBe(5);
    expect(receipt.approvalRequirementCount).toBe(4);
    expect(receipt.queueItemCount).toBe(5);
    expect(receipt.smoke).toBe("68 routes passed, 0 failed");
    expect(receipt.approvalBoundary).toBe("human-approval-before-production");
  }, 120000);

  it("records receipt-ready approval evidence", () => {
    const receipt = buildGammaStage5ReleaseOperatorApprovalReceipt();

    expect(receipt.records).toEqual([
      {
        order: 1,
        id: "approval-packet-received",
        label: "Approval packet received",
        source: "/api/gamma/stage-5/release-operator-approval-packet",
        evidence:
          "stage-5-release-operator-approval-packet-requires-action-queue-signoff-and-human-production-approval",
        status: "receipt-ready",
      },
      {
        order: 2,
        id: "approval-audit-trail-received",
        label: "Approval audit trail received",
        source: "/api/gamma/stage-5/release-operator-approval-audit-trail",
        evidence:
          "stage-5-release-operator-approval-audit-trail-records-packet-queue-signoff-boundary-and-verification",
        status: "receipt-ready",
      },
      {
        order: 3,
        id: "human-boundary-received",
        label: "Human approval boundary received",
        source: "/api/gamma/stage-5/release-gate",
        evidence: "human-approval-before-production",
        status: "receipt-ready",
      },
      {
        order: 4,
        id: "smoke-evidence-received",
        label: "Smoke verification received",
        source: "/api/gamma/stage-5/health",
        evidence: "68 routes passed, 0 failed",
        status: "receipt-ready",
      },
    ]);
    expect(receipt.receiptRule).toBe(
      "stage-5-release-operator-approval-receipt-preserves-packet-audit-boundary-and-smoke-evidence"
    );
  }, 120000);

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseOperatorApprovalReceipt()).toEqual(
      buildGammaStage5ReleaseOperatorApprovalReceipt()
    );
  }, 180000);

  it("serves the receipt through the Stage 5 release operator approval receipt route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_operator_approval_receipt");
    expect(body.apiSurfaceCount).toBe(45);
    expect(body.status).toBe("receipt-ready-pending-human-production-approval");
    expect(body.records).toHaveLength(4);
  }, 120000);
});
