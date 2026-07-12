import { describe, expect, it } from "vitest";
import { GAMMA_STAGE_5_SMOKE_SUMMARY, GAMMA_STAGE_5_SURFACE_COUNTS } from "../../src/lib/gamma-2/stage-5-surface-registry";
import { GET } from "../../app/api/gamma/stage-5/release-operator-registry/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseOperatorRegistry } from "../../src/lib/gamma-2/stage-5-release-operator-registry";

describe("Gamma 2 Stage 5 release operator registry", () => {
  it("builds an operator review registry over final release records", () => {
    const registry = buildGammaStage5ReleaseOperatorRegistry();

    expect(registry.id).toBe("gamma_2_stage_5_release_operator_registry");
    expect(registry.status).toBe("ready-for-operator-review");
    expect(registry.branch).toBe("gamma");
    expect(registry.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(registry.apiSurfaceCount).toBe(GAMMA_STAGE_5_SURFACE_COUNTS.totalEndpoints);
    expect(registry.registryRecordCount).toBe(5);
    expect(registry.finalizationEntryCount).toBe(5);
    expect(registry.dashboardCardCount).toBe(4);
    expect(registry.signoffRequirementCount).toBe(4);
    expect(registry.operatorActionCount).toBe(2);
    expect(registry.smoke).toBe(GAMMA_STAGE_5_SMOKE_SUMMARY);
  }, 30000);

  it("groups the operator-facing release records", () => {
    const registry = buildGammaStage5ReleaseOperatorRegistry();

    expect(registry.records).toEqual([
      {
        order: 1,
        id: "release-dashboard",
        label: "Release dashboard",
        source: "/api/gamma/stage-5/release-dashboard",
        status: "ready",
        owner: "operator",
        evidence: "single-dashboard-contract-for-stage-5-release-operations",
      },
      {
        order: 2,
        id: "release-finalization-index",
        label: "Release finalization index",
        source: "/api/gamma/stage-5/release-finalization-index",
        status: "operator-required",
        owner: "operator",
        evidence:
          "stage-5-release-finalization-index-requires-certificate-closure-signoff-receipt-and-audit-evidence",
      },
      {
        order: 3,
        id: "release-completion-certificate",
        label: "Release completion certificate",
        source: "/api/gamma/stage-5/release-completion-certificate",
        status: "operator-required",
        owner: "operator",
        evidence:
          "stage-5-release-completion-certificate-requires-readiness-closure-closeout-retention-and-attestation",
      },
      {
        order: 4,
        id: "operator-signoff",
        label: "Operator signoff",
        source: "/api/gamma/stage-5/operator-signoff",
        status: "operator-required",
        owner: "operator",
        evidence: "operator-signoff-required-before-production-promotion",
      },
      {
        order: 5,
        id: "release-closeout-packet",
        label: "Release closeout packet",
        source: "/api/gamma/stage-5/release-closeout-packet",
        status: "operator-required",
        owner: "operator",
        evidence:
          "stage-5-release-closeout-requires-operations-review-bundle-archive-retention-and-rollback-evidence",
      },
    ]);
    expect(registry.registryRule).toBe(
      "stage-5-release-operator-registry-groups-dashboard-finalization-certificate-signoff-and-closeout-records"
    );
  }, 30000);

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseOperatorRegistry()).toEqual(
      buildGammaStage5ReleaseOperatorRegistry()
    );
  }, 90000);

  it("serves the registry through the Stage 5 release operator registry route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_operator_registry");
    expect(body.apiSurfaceCount).toBe(GAMMA_STAGE_5_SURFACE_COUNTS.totalEndpoints);
    expect(body.status).toBe("ready-for-operator-review");
    expect(body.records).toHaveLength(5);
  }, 30000);
});
