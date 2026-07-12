import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-governance-map/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseGovernanceMap } from "../../src/lib/gamma-2/stage-5-release-governance-map";

describe("Gamma 2 Stage 5 release governance map", () => {
  it("builds a governance map from release approval and evidence contracts", () => {
    const map = buildGammaStage5ReleaseGovernanceMap();

    expect(map.id).toBe("gamma_2_stage_5_release_governance_map");
    expect(map.status).toBe("ready-for-governance-review");
    expect(map.branch).toBe("gamma");
    expect(map.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(map.apiSurfaceCount).toBe(38);
    expect(map.governanceLaneCount).toBe(5);
    expect(map.openExceptionCount).toBe(0);
    expect(map.operatorRequiredCount).toBe(4);
  });

  it("maps governance lanes to source surfaces", () => {
    const map = buildGammaStage5ReleaseGovernanceMap();

    expect(map.lanes).toEqual([
      {
        id: "operator-approval",
        owner: "operator",
        source: "/api/gamma/stage-5/operator-signoff",
        evidence: "operator-signoff-required-before-production-promotion",
        status: "mapped",
      },
      {
        id: "compliance-controls",
        owner: "release-client",
        source: "/api/gamma/stage-5/release-compliance-matrix",
        evidence: "stage-5-compliance-controls-map-to-signoff-retention-and-evidence",
        status: "mapped",
      },
      {
        id: "exception-review",
        owner: "operator",
        source: "/api/gamma/stage-5/release-exception-register",
        evidence: "stage-5-release-exceptions-require-operator-approval-before-promotion",
        status: "mapped",
      },
      {
        id: "record-retention",
        owner: "operator",
        source: "/api/gamma/stage-5/release-retention-policy",
        evidence: "stage-5-release-records-retained-until-next-attested-promotion",
        status: "mapped",
      },
      {
        id: "rollback-readiness",
        owner: "operator",
        source: "/api/gamma/stage-5/rollback-plan",
        evidence: "operator-approved-rollback-to-last-attested-stage-5-tag",
        status: "mapped",
      },
    ]);
    expect(map.governanceRule).toBe(
      "stage-5-release-governance-map-links-approval-compliance-exceptions-retention-and-rollback"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseGovernanceMap()).toEqual(
      buildGammaStage5ReleaseGovernanceMap()
    );
  });

  it("serves the map through the Stage 5 release governance map route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_governance_map");
    expect(body.apiSurfaceCount).toBe(38);
    expect(body.governanceLaneCount).toBe(5);
    expect(body.openExceptionCount).toBe(0);
  });
});
