import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-monitoring-plan/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseMonitoringPlan } from "../../src/lib/gamma-2/stage-5-release-monitoring-plan";

describe("Gamma 2 Stage 5 release monitoring plan", () => {
  it("builds a pending post-shift monitoring plan", () => {
    const plan = buildGammaStage5ReleaseMonitoringPlan();

    expect(plan.id).toBe("gamma_2_stage_5_release_monitoring_plan");
    expect(plan.status).toBe("pending-post-shift-monitoring");
    expect(plan.branch).toBe("gamma");
    expect(plan.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(plan.apiSurfaceCount).toBe(41);
    expect(plan.monitoringCheckCount).toBe(5);
    expect(plan.trafficShiftStepCount).toBe(5);
    expect(plan.healthStatus).toBe("healthy");
    expect(plan.smoke).toBe("64 routes passed, 0 failed");
  });

  it("keeps monitoring checks pending post-shift observation", () => {
    const plan = buildGammaStage5ReleaseMonitoringPlan();

    expect(plan.checks).toEqual([
      {
        order: 1,
        id: "observe-compact-health",
        title: "Observe compact Stage 5 health",
        owner: "monitor",
        evidence: "compact-health-for-stage-5-monitoring",
        status: "pending-post-shift-observation",
      },
      {
        order: 2,
        id: "confirm-post-shift-smoke",
        title: "Confirm post-shift smoke evidence",
        owner: "operator",
        evidence: "64 routes passed, 0 failed",
        status: "pending-post-shift-observation",
      },
      {
        order: 3,
        id: "review-audit-ledger",
        title: "Review audit ledger continuity",
        owner: "operator",
        evidence: "ordered-ledger-for-stage-5-release-evidence",
        status: "pending-post-shift-observation",
      },
      {
        order: 4,
        id: "record-deployment-receipt",
        title: "Record deployment receipt after traffic shift",
        owner: "operator",
        evidence: "post-promotion-record-must-reference-attestation-and-audit-ledger",
        status: "pending-post-shift-observation",
      },
      {
        order: 5,
        id: "append-promotion-journal",
        title: "Append promotion journal observation",
        owner: "operator",
        evidence: "promotion-journal-must-bind-receipt-attestation-audit-and-rollback",
        status: "pending-post-shift-observation",
      },
    ]);
    expect(plan.monitoringRule).toBe(
      "stage-5-post-shift-monitoring-requires-health-audit-and-receipt-evidence"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseMonitoringPlan()).toEqual(
      buildGammaStage5ReleaseMonitoringPlan()
    );
  });

  it("serves the plan through the Stage 5 release monitoring plan route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_monitoring_plan");
    expect(body.apiSurfaceCount).toBe(41);
    expect(body.status).toBe("pending-post-shift-monitoring");
    expect(body.checks).toHaveLength(5);
  });
});
