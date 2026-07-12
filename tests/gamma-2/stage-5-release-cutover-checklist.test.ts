import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-cutover-checklist/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseCutoverChecklist } from "../../src/lib/gamma-2/stage-5-release-cutover-checklist";

describe("Gamma 2 Stage 5 release cutover checklist", () => {
  it("builds a pending operator cutover checklist", () => {
    const checklist = buildGammaStage5ReleaseCutoverChecklist();

    expect(checklist.id).toBe("gamma_2_stage_5_release_cutover_checklist");
    expect(checklist.status).toBe("pending-operator-cutover");
    expect(checklist.branch).toBe("gamma");
    expect(checklist.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(checklist.apiSurfaceCount).toBe(35);
    expect(checklist.cutoverCheckCount).toBe(5);
    expect(checklist.promotionStepCount).toBe(5);
    expect(checklist.rollbackStepCount).toBe(4);
  });

  it("keeps cutover checks pending operator confirmation", () => {
    const checklist = buildGammaStage5ReleaseCutoverChecklist();

    expect(checklist.checks).toEqual([
      {
        order: 1,
        id: "approval-packet-reviewed",
        owner: "operator",
        evidence: "stage-5-release-approval-packet-requires-human-signoff-before-promotion",
        status: "pending-operator-confirmation",
      },
      {
        order: 2,
        id: "promotion-plan-reviewed",
        owner: "operator",
        evidence: "stage-5-promotion-plan-requires-approval-packet-before-production-action",
        status: "pending-operator-confirmation",
      },
      {
        order: 3,
        id: "decision-record-approved",
        owner: "operator",
        evidence: "stage-5-production-promotion-remains-pending-until-operator-approval",
        status: "pending-operator-confirmation",
      },
      {
        order: 4,
        id: "rollback-plan-retained",
        owner: "operator",
        evidence: "operator-approved-rollback-to-last-attested-stage-5-tag",
        status: "pending-operator-confirmation",
      },
      {
        order: 5,
        id: "deployment-receipt-reviewed",
        owner: "operator",
        evidence: "post-promotion-record-must-reference-attestation-and-audit-ledger",
        status: "pending-operator-confirmation",
      },
    ]);
    expect(checklist.cutoverRule).toBe(
      "stage-5-cutover-checklist-requires-operator-confirmation-before-traffic-shift"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseCutoverChecklist()).toEqual(
      buildGammaStage5ReleaseCutoverChecklist()
    );
  });

  it("serves the checklist through the Stage 5 release cutover checklist route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_cutover_checklist");
    expect(body.apiSurfaceCount).toBe(35);
    expect(body.status).toBe("pending-operator-cutover");
    expect(body.checks).toHaveLength(5);
  });
});
