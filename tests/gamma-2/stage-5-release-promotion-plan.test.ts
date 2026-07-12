import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-promotion-plan/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleasePromotionPlan } from "../../src/lib/gamma-2/stage-5-release-promotion-plan";

describe("Gamma 2 Stage 5 release promotion plan", () => {
  it("builds a pending operator promotion plan from approval evidence", () => {
    const plan = buildGammaStage5ReleasePromotionPlan();

    expect(plan.id).toBe("gamma_2_stage_5_release_promotion_plan");
    expect(plan.status).toBe("pending-operator-approval");
    expect(plan.branch).toBe("gamma");
    expect(plan.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(plan.apiSurfaceCount).toBe(45);
    expect(plan.approvalArtifactCount).toBe(5);
    expect(plan.promotionStepCount).toBe(5);
    expect(plan.rollbackStepCount).toBe(4);
  });

  it("orders the operator promotion actions", () => {
    const plan = buildGammaStage5ReleasePromotionPlan();

    expect(plan.steps).toEqual([
      {
        order: 1,
        id: "review-approval-packet",
        title: "Review release approval packet",
        owner: "operator",
        evidence: "stage-5-release-approval-packet-requires-human-signoff-before-promotion",
        status: "pending-operator-action",
      },
      {
        order: 2,
        id: "confirm-production-env",
        title: "Confirm production environment origin",
        owner: "operator",
        evidence: PRODUCTION_APP_URL,
        status: "pending-operator-action",
      },
      {
        order: 3,
        id: "complete-promotion-checklist",
        title: "Complete ordered promotion checklist",
        owner: "operator",
        evidence: "ordered-operator-steps-before-production-promotion",
        status: "pending-operator-action",
      },
      {
        order: 4,
        id: "approve-decision-record",
        title: "Approve pending release decision",
        owner: "operator",
        evidence: "stage-5-production-promotion-remains-pending-until-operator-approval",
        status: "pending-operator-action",
      },
      {
        order: 5,
        id: "retain-rollback-plan",
        title: "Retain rollback plan before production promotion",
        owner: "operator",
        evidence: "operator-approved-rollback-to-last-attested-stage-5-tag",
        status: "pending-operator-action",
      },
    ]);
    expect(plan.promotionRule).toBe(
      "stage-5-promotion-plan-requires-approval-packet-before-production-action"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleasePromotionPlan()).toEqual(
      buildGammaStage5ReleasePromotionPlan()
    );
  });

  it("serves the plan through the Stage 5 release promotion plan route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_promotion_plan");
    expect(body.apiSurfaceCount).toBe(45);
    expect(body.status).toBe("pending-operator-approval");
    expect(body.steps).toHaveLength(5);
  });
});
