import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-decision-record/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseDecisionRecord } from "../../src/lib/gamma-2/stage-5-release-decision-record";

describe("Gamma 2 Stage 5 release decision record", () => {
  it("builds a pending operator decision record from promotion evidence", () => {
    const record = buildGammaStage5ReleaseDecisionRecord();

    expect(record.id).toBe("gamma_2_stage_5_release_decision_record");
    expect(record.status).toBe("pending-operator-approval");
    expect(record.branch).toBe("gamma");
    expect(record.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(record.apiSurfaceCount).toBe(42);
    expect(record.passCheckCount).toBe(3);
    expect(record.operatorRequiredCount).toBe(4);
    expect(record.openExceptionCount).toBe(0);
  });

  it("captures the required promotion decision evidence", () => {
    const record = buildGammaStage5ReleaseDecisionRecord();

    expect(record.decisionEvidence).toEqual([
      {
        id: "attested-contract-digest",
        source: "/api/gamma/stage-5/release-attestation",
        evidence: "digest-verification-and-release-gate-required-for-promotion",
        required: true,
      },
      {
        id: "operator-promotion-gate",
        source: "/api/gamma/stage-5/release-gate",
        evidence: "operator-promotes-after-env-domain-and-evidence-review",
        required: true,
      },
      {
        id: "ordered-promotion-checklist",
        source: "/api/gamma/stage-5/promotion-checklist",
        evidence: "ordered-operator-steps-before-production-promotion",
        required: true,
      },
      {
        id: "mapped-governance-review",
        source: "/api/gamma/stage-5/release-governance-map",
        evidence:
          "stage-5-release-governance-map-links-approval-compliance-exceptions-retention-and-rollback",
        required: true,
      },
      {
        id: "closed-exception-register",
        source: "/api/gamma/stage-5/release-exception-register",
        evidence: "stage-5-release-exceptions-require-operator-approval-before-promotion",
        required: true,
      },
    ]);
    expect(record.decisionRule).toBe(
      "stage-5-production-promotion-remains-pending-until-operator-approval"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseDecisionRecord()).toEqual(
      buildGammaStage5ReleaseDecisionRecord()
    );
  });

  it("serves the record through the Stage 5 release decision record route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_decision_record");
    expect(body.apiSurfaceCount).toBe(42);
    expect(body.status).toBe("pending-operator-approval");
    expect(body.decisionEvidence).toHaveLength(5);
  });
});
