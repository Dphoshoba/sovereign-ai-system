import { describe, expect, it } from "vitest";
import { GAMMA_STAGE_5_SMOKE_SUMMARY, GAMMA_STAGE_5_SURFACE_COUNTS } from "../../src/lib/gamma-2/stage-5-surface-registry";
import { GET } from "../../app/api/gamma/stage-5/release-production-authorization-ledger/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseProductionAuthorizationLedger } from "../../src/lib/gamma-2/stage-5-release-production-authorization-ledger";

describe("Gamma 2 Stage 5 release production authorization ledger", () => {
  it("builds a pending human production authorization ledger", () => {
    const ledger = buildGammaStage5ReleaseProductionAuthorizationLedger();

    expect(ledger.id).toBe("gamma_2_stage_5_release_production_authorization_ledger");
    expect(ledger.status).toBe("authorization-pending-human-production-approval");
    expect(ledger.branch).toBe("gamma");
    expect(ledger.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(ledger.apiSurfaceCount).toBe(GAMMA_STAGE_5_SURFACE_COUNTS.totalEndpoints);
    expect(ledger.authorizationEntryCount).toBe(5);
    expect(ledger.receiptRecordCount).toBe(4);
    expect(ledger.releaseGateCheckCount).toBe(5);
    expect(ledger.operatorRequiredCheckCount).toBe(2);
    expect(ledger.smoke).toBe(GAMMA_STAGE_5_SMOKE_SUMMARY);
    expect(ledger.approvalBoundary).toBe("human-approval-before-production");
  }, 120000);

  it("records authorization-pending release evidence", () => {
    const ledger = buildGammaStage5ReleaseProductionAuthorizationLedger();

    expect(ledger.entries).toEqual([
      {
        order: 1,
        id: "operator-approval-receipt-bound",
        label: "Bind operator approval receipt",
        source: "/api/gamma/stage-5/release-operator-approval-receipt",
        evidence:
          "stage-5-release-operator-approval-receipt-preserves-packet-audit-boundary-and-smoke-evidence",
        status: "authorization-pending",
      },
      {
        order: 2,
        id: "release-gate-bound",
        label: "Bind release gate",
        source: "/api/gamma/stage-5/release-gate",
        evidence: "operator-promotes-after-env-domain-and-evidence-review",
        status: "authorization-pending",
      },
      {
        order: 3,
        id: "production-origin-bound",
        label: "Bind production origin",
        source: "/api/gamma/stage-5/release-gate",
        evidence: PRODUCTION_APP_URL,
        status: "authorization-pending",
      },
      {
        order: 4,
        id: "human-approval-bound",
        label: "Bind human approval boundary",
        source: "/api/gamma/stage-5/release-gate",
        evidence: "human-approval-before-production",
        status: "authorization-pending",
      },
      {
        order: 5,
        id: "verification-bound",
        label: "Bind smoke verification",
        source: "/api/gamma/stage-5/health",
        evidence: GAMMA_STAGE_5_SMOKE_SUMMARY,
        status: "authorization-pending",
      },
    ]);
    expect(ledger.authorizationRule).toBe(
      "stage-5-production-authorization-ledger-requires-receipt-release-gate-env-confirmation-and-human-approval"
    );
  }, 120000);

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseProductionAuthorizationLedger()).toEqual(
      buildGammaStage5ReleaseProductionAuthorizationLedger()
    );
  }, 180000);

  it("serves the ledger through the Stage 5 release production authorization route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_production_authorization_ledger");
    expect(body.apiSurfaceCount).toBe(GAMMA_STAGE_5_SURFACE_COUNTS.totalEndpoints);
    expect(body.status).toBe("authorization-pending-human-production-approval");
    expect(body.entries).toHaveLength(5);
  }, 120000);
});
