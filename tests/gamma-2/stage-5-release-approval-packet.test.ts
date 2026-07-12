import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-approval-packet/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseApprovalPacket } from "../../src/lib/gamma-2/stage-5-release-approval-packet";

describe("Gamma 2 Stage 5 release approval packet", () => {
  it("builds a pending approval packet from decision and signoff evidence", () => {
    const packet = buildGammaStage5ReleaseApprovalPacket();

    expect(packet.id).toBe("gamma_2_stage_5_release_approval_packet");
    expect(packet.status).toBe("pending-operator-signoff");
    expect(packet.branch).toBe("gamma");
    expect(packet.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(packet.apiSurfaceCount).toBe(37);
    expect(packet.operatorRequiredCount).toBe(4);
    expect(packet.approvalArtifactCount).toBe(5);
  });

  it("bundles the required operator approval artifacts", () => {
    const packet = buildGammaStage5ReleaseApprovalPacket();

    expect(packet.approvalArtifacts).toEqual([
      {
        id: "release-decision",
        path: "/api/gamma/stage-5/release-decision-record",
        evidence: "stage-5-production-promotion-remains-pending-until-operator-approval",
        required: true,
      },
      {
        id: "operator-signoff",
        path: "/api/gamma/stage-5/operator-signoff",
        evidence: "operator-signoff-required-before-production-promotion",
        required: true,
      },
      {
        id: "operator-handoff",
        path: "/api/gamma/stage-5/operator-handoff",
        evidence: "operator-reviews-brief-attestation-and-rollback-before-promotion",
        required: true,
      },
      {
        id: "governance-review",
        path: "/api/gamma/stage-5/release-governance-map",
        evidence:
          "stage-5-release-governance-map-links-approval-compliance-exceptions-retention-and-rollback",
        required: true,
      },
      {
        id: "release-attestation",
        path: "/api/gamma/stage-5/release-attestation",
        evidence: "digest-verification-and-release-gate-required-for-promotion",
        required: true,
      },
    ]);
    expect(packet.approvalRule).toBe(
      "stage-5-release-approval-packet-requires-human-signoff-before-promotion"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseApprovalPacket()).toEqual(
      buildGammaStage5ReleaseApprovalPacket()
    );
  });

  it("serves the packet through the Stage 5 release approval packet route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_approval_packet");
    expect(body.apiSurfaceCount).toBe(37);
    expect(body.status).toBe("pending-operator-signoff");
    expect(body.approvalArtifacts).toHaveLength(5);
  });
});
