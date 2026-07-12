import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-operator-approval-packet/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseOperatorApprovalPacket } from "../../src/lib/gamma-2/stage-5-release-operator-approval-packet";

describe("Gamma 2 Stage 5 release operator approval packet", () => {
  it("builds a pending human production approval packet", () => {
    const packet = buildGammaStage5ReleaseOperatorApprovalPacket();

    expect(packet.id).toBe("gamma_2_stage_5_release_operator_approval_packet");
    expect(packet.status).toBe("pending-human-production-approval");
    expect(packet.branch).toBe("gamma");
    expect(packet.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(packet.apiSurfaceCount).toBe(42);
    expect(packet.queueItemCount).toBe(5);
    expect(packet.readyItemCount).toBe(1);
    expect(packet.operatorRequiredItemCount).toBe(4);
    expect(packet.signoffRequirementCount).toBe(4);
    expect(packet.approvalRequirementCount).toBe(4);
    expect(packet.smoke).toBe("65 routes passed, 0 failed");
  }, 30000);

  it("packages the final human approval requirements", () => {
    const packet = buildGammaStage5ReleaseOperatorApprovalPacket();

    expect(packet.requirements).toEqual([
      {
        order: 1,
        id: "review-ready-records",
        label: "Review ready release records",
        source: "/api/gamma/stage-5/release-operator-action-queue",
        evidence: "1 ready action",
        required: true,
      },
      {
        order: 2,
        id: "approve-required-records",
        label: "Confirm approval-required release records",
        source: "/api/gamma/stage-5/release-operator-action-queue",
        evidence: "4 operator-required actions",
        required: true,
      },
      {
        order: 3,
        id: "confirm-operator-signoff",
        label: "Confirm operator signoff requirements",
        source: "/api/gamma/stage-5/operator-signoff",
        evidence: "operator-signoff-required-before-production-promotion",
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
    ]);
    expect(packet.approvalBoundary).toBe("human-approval-before-production");
    expect(packet.approvalRule).toBe(
      "stage-5-release-operator-approval-packet-requires-action-queue-signoff-and-human-production-approval"
    );
  }, 30000);

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseOperatorApprovalPacket()).toEqual(
      buildGammaStage5ReleaseOperatorApprovalPacket()
    );
  }, 90000);

  it("serves the packet through the Stage 5 release operator approval packet route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_operator_approval_packet");
    expect(body.apiSurfaceCount).toBe(42);
    expect(body.status).toBe("pending-human-production-approval");
    expect(body.requirements).toHaveLength(4);
  }, 30000);
});
