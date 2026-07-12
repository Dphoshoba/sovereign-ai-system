import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-post-promotion-review/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleasePostPromotionReview } from "../../src/lib/gamma-2/stage-5-release-post-promotion-review";

describe("Gamma 2 Stage 5 release post-promotion review", () => {
  it("builds a pending operator post-promotion review", () => {
    const review = buildGammaStage5ReleasePostPromotionReview();

    expect(review.id).toBe("gamma_2_stage_5_release_post_promotion_review");
    expect(review.status).toBe("pending-operator-review");
    expect(review.branch).toBe("gamma");
    expect(review.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(review.apiSurfaceCount).toBe(36);
    expect(review.reviewItemCount).toBe(5);
    expect(review.monitoringCheckCount).toBe(5);
    expect(review.openExceptionCount).toBe(0);
    expect(review.healthStatus).toBe("healthy");
    expect(review.smoke).toBe("59 routes passed, 0 failed");
  });

  it("keeps post-promotion review items pending operator review", () => {
    const review = buildGammaStage5ReleasePostPromotionReview();

    expect(review.items).toEqual([
      {
        order: 1,
        id: "review-monitoring-plan",
        title: "Review post-shift monitoring plan",
        owner: "operator",
        evidence: "stage-5-post-shift-monitoring-requires-health-audit-and-receipt-evidence",
        status: "pending-operator-review",
      },
      {
        order: 2,
        id: "confirm-signoff-boundary",
        title: "Confirm operator signoff boundary",
        owner: "operator",
        evidence: "operator-signoff-required-before-production-promotion",
        status: "pending-operator-review",
      },
      {
        order: 3,
        id: "review-audit-continuity",
        title: "Review audit ledger continuity",
        owner: "operator",
        evidence: "ordered-ledger-for-stage-5-release-evidence",
        status: "pending-operator-review",
      },
      {
        order: 4,
        id: "confirm-deployment-receipt",
        title: "Confirm deployment receipt evidence",
        owner: "operator",
        evidence: "post-promotion-record-must-reference-attestation-and-audit-ledger",
        status: "pending-operator-review",
      },
      {
        order: 5,
        id: "close-promotion-decision",
        title: "Close production promotion decision review",
        owner: "operator",
        evidence: "stage-5-production-promotion-remains-pending-until-operator-approval",
        status: "pending-operator-review",
      },
    ]);
    expect(review.reviewRule).toBe(
      "stage-5-post-promotion-review-requires-monitoring-signoff-audit-and-receipt-evidence"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleasePostPromotionReview()).toEqual(
      buildGammaStage5ReleasePostPromotionReview()
    );
  });

  it("serves the review through the Stage 5 release post-promotion review route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_post_promotion_review");
    expect(body.apiSurfaceCount).toBe(36);
    expect(body.status).toBe("pending-operator-review");
    expect(body.items).toHaveLength(5);
  });
});
