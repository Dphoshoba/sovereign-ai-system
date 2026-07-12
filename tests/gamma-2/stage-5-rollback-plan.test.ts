import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/rollback-plan/route";
import { buildGammaStage5RollbackPlan } from "../../src/lib/gamma-2/stage-5-rollback-plan";

describe("Gamma 2 Stage 5 rollback plan", () => {
  it("builds an operator-controlled rollback plan from the attested release state", () => {
    const plan = buildGammaStage5RollbackPlan();

    expect(plan.id).toBe("gamma_2_stage_5_rollback_plan");
    expect(plan.status).toBe("ready-for-controlled-rollback");
    expect(plan.branch).toBe("gamma");
    expect(plan.protectedTag).toBe("gamma-2-roadmap-complete");
    expect(plan.digestFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(plan.apiSurfaceCount).toBe(44);
    expect(plan.steps).toHaveLength(4);
  });

  it("keeps rollback behind operator approval and attested evidence", () => {
    const plan = buildGammaStage5RollbackPlan();

    expect(plan.steps.map((step) => step.owner)).toEqual([
      "operator",
      "release-client",
      "operator",
      "operator",
    ]);
    expect(plan.rollbackRule).toBe("operator-approved-rollback-to-last-attested-stage-5-tag");
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5RollbackPlan()).toEqual(buildGammaStage5RollbackPlan());
  });

  it("serves the plan through the Stage 5 rollback plan route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_rollback_plan");
    expect(body.apiSurfaceCount).toBe(44);
    expect(body.rollbackRule).toBe("operator-approved-rollback-to-last-attested-stage-5-tag");
  });
});
