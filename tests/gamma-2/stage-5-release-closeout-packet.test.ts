import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-closeout-packet/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseCloseoutPacket } from "../../src/lib/gamma-2/stage-5-release-closeout-packet";

describe("Gamma 2 Stage 5 release closeout packet", () => {
  it("builds a pending operator closeout packet", () => {
    const packet = buildGammaStage5ReleaseCloseoutPacket();

    expect(packet.id).toBe("gamma_2_stage_5_release_closeout_packet");
    expect(packet.status).toBe("pending-operator-closeout");
    expect(packet.branch).toBe("gamma");
    expect(packet.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(packet.apiSurfaceCount).toBe(40);
    expect(packet.closeoutItemCount).toBe(6);
    expect(packet.operationsStepCount).toBe(6);
    expect(packet.postPromotionReviewItemCount).toBe(5);
    expect(packet.bundleArtifactCount).toBe(5);
    expect(packet.archiveItemCount).toBe(5);
    expect(packet.retentionRuleCount).toBe(4);
    expect(packet.rollbackStepCount).toBe(4);
    expect(packet.smoke).toBe("63 routes passed, 0 failed");
  });

  it("keeps closeout items pending operator confirmation", () => {
    const packet = buildGammaStage5ReleaseCloseoutPacket();

    expect(packet.items).toEqual([
      {
        order: 1,
        id: "operations-sequence-reviewed",
        label: "Review release operations sequence",
        source: "/api/gamma/stage-5/release-operations-index",
        evidence:
          "stage-5-release-operations-index-orders-approval-promotion-cutover-shift-monitoring-and-review",
        owner: "operator",
        status: "pending-closeout-confirmation",
      },
      {
        order: 2,
        id: "post-promotion-review-confirmed",
        label: "Confirm post-promotion review",
        source: "/api/gamma/stage-5/release-post-promotion-review",
        evidence:
          "stage-5-post-promotion-review-requires-monitoring-signoff-audit-and-receipt-evidence",
        owner: "operator",
        status: "pending-closeout-confirmation",
      },
      {
        order: 3,
        id: "release-bundle-retained",
        label: "Retain release bundle",
        source: "/api/gamma/stage-5/release-bundle",
        evidence: "release-bundle-must-archive-index-signoff-attestation-and-digest",
        owner: "operator",
        status: "pending-closeout-confirmation",
      },
      {
        order: 4,
        id: "archive-manifest-retained",
        label: "Retain release archive manifest",
        source: "/api/gamma/stage-5/release-archive-manifest",
        evidence: "archive-manifest-must-preserve-release-bundle-and-evidence-index",
        owner: "operator",
        status: "pending-closeout-confirmation",
      },
      {
        order: 5,
        id: "retention-policy-confirmed",
        label: "Confirm release retention policy",
        source: "/api/gamma/stage-5/release-retention-policy",
        evidence: "stage-5-release-records-retained-until-next-attested-promotion",
        owner: "operator",
        status: "pending-closeout-confirmation",
      },
      {
        order: 6,
        id: "rollback-plan-retained",
        label: "Retain rollback plan",
        source: "/api/gamma/stage-5/rollback-plan",
        evidence: "operator-approved-rollback-to-last-attested-stage-5-tag",
        owner: "operator",
        status: "pending-closeout-confirmation",
      },
    ]);
    expect(packet.closeoutRule).toBe(
      "stage-5-release-closeout-requires-operations-review-bundle-archive-retention-and-rollback-evidence"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseCloseoutPacket()).toEqual(
      buildGammaStage5ReleaseCloseoutPacket()
    );
  }, 10000);

  it("serves the packet through the Stage 5 release closeout packet route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_closeout_packet");
    expect(body.apiSurfaceCount).toBe(40);
    expect(body.status).toBe("pending-operator-closeout");
    expect(body.items).toHaveLength(6);
  });
});
