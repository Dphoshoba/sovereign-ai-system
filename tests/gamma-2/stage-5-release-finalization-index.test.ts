import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-finalization-index/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseFinalizationIndex } from "../../src/lib/gamma-2/stage-5-release-finalization-index";

describe("Gamma 2 Stage 5 release finalization index", () => {
  it("builds a pending final operator review index", () => {
    const index = buildGammaStage5ReleaseFinalizationIndex();

    expect(index.id).toBe("gamma_2_stage_5_release_finalization_index");
    expect(index.status).toBe("pending-final-operator-review");
    expect(index.branch).toBe("gamma");
    expect(index.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(index.apiSurfaceCount).toBe(39);
    expect(index.finalizationEntryCount).toBe(5);
    expect(index.closureEntryCount).toBe(6);
    expect(index.certificateEvidenceCount).toBe(5);
    expect(index.signoffRequirementCount).toBe(4);
    expect(index.auditEntryCount).toBe(4);
    expect(index.receiptArtifactCount).toBe(4);
    expect(index.openExceptionCount).toBe(0);
    expect(index.smoke).toBe("62 routes passed, 0 failed");
  }, 30000);

  it("orders the final release evidence records", () => {
    const index = buildGammaStage5ReleaseFinalizationIndex();

    expect(index.entries).toEqual([
      {
        order: 1,
        id: "completion-certificate-bound",
        source: "/api/gamma/stage-5/release-completion-certificate",
        evidence:
          "stage-5-release-completion-certificate-requires-readiness-closure-closeout-retention-and-attestation",
        owner: "operator",
        status: "pending-final-operator-review",
      },
      {
        order: 2,
        id: "closure-ledger-bound",
        source: "/api/gamma/stage-5/release-closure-ledger",
        evidence:
          "stage-5-release-closure-ledger-requires-attestation-decision-receipt-audit-operations-and-closeout",
        owner: "operator",
        status: "pending-final-operator-review",
      },
      {
        order: 3,
        id: "operator-signoff-bound",
        source: "/api/gamma/stage-5/operator-signoff",
        evidence: "operator-signoff-required-before-production-promotion",
        owner: "operator",
        status: "pending-final-operator-review",
      },
      {
        order: 4,
        id: "deployment-receipt-bound",
        source: "/api/gamma/stage-5/deployment-receipt",
        evidence: "post-promotion-record-must-reference-attestation-and-audit-ledger",
        owner: "operator",
        status: "pending-final-operator-review",
      },
      {
        order: 5,
        id: "audit-ledger-bound",
        source: "/api/gamma/stage-5/audit-ledger",
        evidence: "ordered-ledger-for-stage-5-release-evidence",
        owner: "release-client",
        status: "pending-final-operator-review",
      },
    ]);
    expect(index.finalizationRule).toBe(
      "stage-5-release-finalization-index-requires-certificate-closure-signoff-receipt-and-audit-evidence"
    );
  }, 30000);

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseFinalizationIndex()).toEqual(
      buildGammaStage5ReleaseFinalizationIndex()
    );
  }, 45000);

  it("serves the index through the Stage 5 release finalization index route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_finalization_index");
    expect(body.apiSurfaceCount).toBe(39);
    expect(body.status).toBe("pending-final-operator-review");
    expect(body.entries).toHaveLength(5);
  }, 30000);
});
