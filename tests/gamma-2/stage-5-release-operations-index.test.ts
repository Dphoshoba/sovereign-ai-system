import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-operations-index/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseOperationsIndex } from "../../src/lib/gamma-2/stage-5-release-operations-index";

describe("Gamma 2 Stage 5 release operations index", () => {
  it("builds an ordered release operations index", () => {
    const index = buildGammaStage5ReleaseOperationsIndex();

    expect(index.id).toBe("gamma_2_stage_5_release_operations_index");
    expect(index.status).toBe("ready-for-operator-sequencing");
    expect(index.branch).toBe("gamma");
    expect(index.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(index.apiSurfaceCount).toBe(42);
    expect(index.operationsStepCount).toBe(6);
    expect(index.promotionStepCount).toBe(5);
    expect(index.cutoverCheckCount).toBe(5);
    expect(index.trafficShiftStepCount).toBe(5);
    expect(index.monitoringCheckCount).toBe(5);
    expect(index.postPromotionReviewItemCount).toBe(5);
    expect(index.smoke).toBe("65 routes passed, 0 failed");
  }, 30000);

  it("orders the operator release sequence from approval to review", () => {
    const index = buildGammaStage5ReleaseOperationsIndex();

    expect(index.steps).toEqual([
      {
        order: 1,
        id: "approval-packet",
        label: "Review release approval packet",
        source: "/api/gamma/stage-5/release-approval-packet",
        evidence: "stage-5-release-approval-packet-requires-human-signoff-before-promotion",
        owner: "operator",
        status: "pending-operator-sequence",
      },
      {
        order: 2,
        id: "promotion-plan",
        label: "Execute release promotion plan",
        source: "/api/gamma/stage-5/release-promotion-plan",
        evidence: "stage-5-promotion-plan-requires-approval-packet-before-production-action",
        owner: "operator",
        status: "pending-operator-sequence",
      },
      {
        order: 3,
        id: "cutover-checklist",
        label: "Complete release cutover checklist",
        source: "/api/gamma/stage-5/release-cutover-checklist",
        evidence:
          "stage-5-cutover-checklist-requires-operator-confirmation-before-traffic-shift",
        owner: "operator",
        status: "pending-operator-sequence",
      },
      {
        order: 4,
        id: "traffic-shift-plan",
        label: "Shift traffic under operator control",
        source: "/api/gamma/stage-5/release-traffic-shift-plan",
        evidence:
          "stage-5-traffic-shift-requires-cutover-checklist-health-and-rollback-evidence",
        owner: "operator",
        status: "pending-operator-sequence",
      },
      {
        order: 5,
        id: "monitoring-plan",
        label: "Observe post-shift monitoring plan",
        source: "/api/gamma/stage-5/release-monitoring-plan",
        evidence: "stage-5-post-shift-monitoring-requires-health-audit-and-receipt-evidence",
        owner: "monitor",
        status: "pending-operator-sequence",
      },
      {
        order: 6,
        id: "post-promotion-review",
        label: "Review post-promotion evidence",
        source: "/api/gamma/stage-5/release-post-promotion-review",
        evidence:
          "stage-5-post-promotion-review-requires-monitoring-signoff-audit-and-receipt-evidence",
        owner: "operator",
        status: "pending-operator-sequence",
      },
    ]);
    expect(index.operationsRule).toBe(
      "stage-5-release-operations-index-orders-approval-promotion-cutover-shift-monitoring-and-review"
    );
  }, 30000);

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseOperationsIndex()).toEqual(
      buildGammaStage5ReleaseOperationsIndex()
    );
  }, 90000);

  it("serves the index through the Stage 5 release operations index route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_operations_index");
    expect(body.apiSurfaceCount).toBe(42);
    expect(body.status).toBe("ready-for-operator-sequencing");
    expect(body.steps).toHaveLength(6);
  }, 30000);
});
