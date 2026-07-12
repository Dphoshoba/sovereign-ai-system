import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-closure-ledger/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseClosureLedger } from "../../src/lib/gamma-2/stage-5-release-closure-ledger";

describe("Gamma 2 Stage 5 release closure ledger", () => {
  it("builds a pending operator closure ledger", () => {
    const ledger = buildGammaStage5ReleaseClosureLedger();

    expect(ledger.id).toBe("gamma_2_stage_5_release_closure_ledger");
    expect(ledger.status).toBe("pending-operator-closure");
    expect(ledger.branch).toBe("gamma");
    expect(ledger.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(ledger.apiSurfaceCount).toBe(37);
    expect(ledger.closureEntryCount).toBe(6);
    expect(ledger.operationsStepCount).toBe(6);
    expect(ledger.closeoutItemCount).toBe(6);
    expect(ledger.auditEntryCount).toBe(4);
    expect(ledger.passCheckCount).toBe(3);
    expect(ledger.openExceptionCount).toBe(0);
    expect(ledger.smoke).toBe("60 routes passed, 0 failed");
  }, 10000);

  it("binds the final release closure evidence sequence", () => {
    const ledger = buildGammaStage5ReleaseClosureLedger();

    expect(ledger.entries).toEqual([
      {
        order: 1,
        id: "release-attestation-bound",
        source: "/api/gamma/stage-5/release-attestation",
        evidence: "digest-verification-and-release-gate-required-for-promotion",
        actor: "release-client",
        status: "pending-closure-record",
      },
      {
        order: 2,
        id: "promotion-decision-bound",
        source: "/api/gamma/stage-5/release-decision-record",
        evidence: "stage-5-production-promotion-remains-pending-until-operator-approval",
        actor: "operator",
        status: "pending-closure-record",
      },
      {
        order: 3,
        id: "deployment-receipt-bound",
        source: "/api/gamma/stage-5/deployment-receipt",
        evidence: "post-promotion-record-must-reference-attestation-and-audit-ledger",
        actor: "operator",
        status: "pending-closure-record",
      },
      {
        order: 4,
        id: "audit-ledger-bound",
        source: "/api/gamma/stage-5/audit-ledger",
        evidence: "ordered-ledger-for-stage-5-release-evidence",
        actor: "operator",
        status: "pending-closure-record",
      },
      {
        order: 5,
        id: "operations-index-bound",
        source: "/api/gamma/stage-5/release-operations-index",
        evidence:
          "stage-5-release-operations-index-orders-approval-promotion-cutover-shift-monitoring-and-review",
        actor: "operator",
        status: "pending-closure-record",
      },
      {
        order: 6,
        id: "closeout-packet-bound",
        source: "/api/gamma/stage-5/release-closeout-packet",
        evidence:
          "stage-5-release-closeout-requires-operations-review-bundle-archive-retention-and-rollback-evidence",
        actor: "operator",
        status: "pending-closure-record",
      },
    ]);
    expect(ledger.closureRule).toBe(
      "stage-5-release-closure-ledger-requires-attestation-decision-receipt-audit-operations-and-closeout"
    );
  }, 10000);

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseClosureLedger()).toEqual(
      buildGammaStage5ReleaseClosureLedger()
    );
  }, 30000);

  it("serves the ledger through the Stage 5 release closure ledger route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_closure_ledger");
    expect(body.apiSurfaceCount).toBe(37);
    expect(body.status).toBe("pending-operator-closure");
    expect(body.entries).toHaveLength(6);
  });
});
