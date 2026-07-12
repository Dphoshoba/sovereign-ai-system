import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-traffic-shift-plan/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseTrafficShiftPlan } from "../../src/lib/gamma-2/stage-5-release-traffic-shift-plan";

describe("Gamma 2 Stage 5 release traffic shift plan", () => {
  it("builds a pending operator traffic shift plan", () => {
    const plan = buildGammaStage5ReleaseTrafficShiftPlan();

    expect(plan.id).toBe("gamma_2_stage_5_release_traffic_shift_plan");
    expect(plan.status).toBe("pending-operator-traffic-shift");
    expect(plan.branch).toBe("gamma");
    expect(plan.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(plan.apiSurfaceCount).toBe(35);
    expect(plan.trafficShiftStepCount).toBe(5);
    expect(plan.cutoverCheckCount).toBe(5);
    expect(plan.rollbackStepCount).toBe(4);
    expect(plan.healthStatus).toBe("healthy");
    expect(plan.smoke).toBe("58 routes passed, 0 failed");
  });

  it("keeps traffic shift steps pending operator action", () => {
    const plan = buildGammaStage5ReleaseTrafficShiftPlan();

    expect(plan.steps).toEqual([
      {
        order: 1,
        id: "confirm-cutover-checklist",
        title: "Confirm release cutover checklist",
        owner: "operator",
        evidence:
          "stage-5-cutover-checklist-requires-operator-confirmation-before-traffic-shift",
        status: "pending-operator-action",
      },
      {
        order: 2,
        id: "verify-stage-5-health",
        title: "Verify Stage 5 health endpoint",
        owner: "operator",
        evidence: "compact-health-for-stage-5-monitoring",
        status: "pending-operator-action",
      },
      {
        order: 3,
        id: "retain-rollback-control",
        title: "Retain rollback control before shifting traffic",
        owner: "operator",
        evidence: "operator-approved-rollback-to-last-attested-stage-5-tag",
        status: "pending-operator-action",
      },
      {
        order: 4,
        id: "shift-traffic-after-approval",
        title: "Shift traffic only after operator approval",
        owner: "operator",
        evidence: "post-promotion-record-must-reference-attestation-and-audit-ledger",
        status: "pending-operator-action",
      },
      {
        order: 5,
        id: "run-post-shift-smoke",
        title: "Run post-shift smoke verification",
        owner: "operator",
        evidence: "58 routes passed, 0 failed",
        status: "pending-operator-action",
      },
    ]);
    expect(plan.trafficShiftRule).toBe(
      "stage-5-traffic-shift-requires-cutover-checklist-health-and-rollback-evidence"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseTrafficShiftPlan()).toEqual(
      buildGammaStage5ReleaseTrafficShiftPlan()
    );
  });

  it("serves the plan through the Stage 5 release traffic shift plan route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_traffic_shift_plan");
    expect(body.apiSurfaceCount).toBe(35);
    expect(body.status).toBe("pending-operator-traffic-shift");
    expect(body.steps).toHaveLength(5);
  });
});
