import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-operator-action-queue/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseOperatorActionQueue } from "../../src/lib/gamma-2/stage-5-release-operator-action-queue";

describe("Gamma 2 Stage 5 release operator action queue", () => {
  it("builds a pending operator action queue from registry records", () => {
    const queue = buildGammaStage5ReleaseOperatorActionQueue();

    expect(queue.id).toBe("gamma_2_stage_5_release_operator_action_queue");
    expect(queue.status).toBe("pending-operator-actions");
    expect(queue.branch).toBe("gamma");
    expect(queue.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(queue.apiSurfaceCount).toBe(44);
    expect(queue.queueItemCount).toBe(5);
    expect(queue.readyItemCount).toBe(1);
    expect(queue.operatorRequiredItemCount).toBe(4);
    expect(queue.registryRecordCount).toBe(5);
    expect(queue.smoke).toBe("67 routes passed, 0 failed");
  }, 30000);

  it("separates ready records from approval-required records", () => {
    const queue = buildGammaStage5ReleaseOperatorActionQueue();

    expect(queue.items).toEqual([
      {
        order: 1,
        id: "release-dashboard-action",
        label: "Release dashboard",
        source: "/api/gamma/stage-5/release-dashboard",
        action: "review-record",
        status: "ready",
        owner: "operator",
        evidence: "single-dashboard-contract-for-stage-5-release-operations",
      },
      {
        order: 2,
        id: "release-finalization-index-action",
        label: "Release finalization index",
        source: "/api/gamma/stage-5/release-finalization-index",
        action: "confirm-and-approve-record",
        status: "operator-required",
        owner: "operator",
        evidence:
          "stage-5-release-finalization-index-requires-certificate-closure-signoff-receipt-and-audit-evidence",
      },
      {
        order: 3,
        id: "release-completion-certificate-action",
        label: "Release completion certificate",
        source: "/api/gamma/stage-5/release-completion-certificate",
        action: "confirm-and-approve-record",
        status: "operator-required",
        owner: "operator",
        evidence:
          "stage-5-release-completion-certificate-requires-readiness-closure-closeout-retention-and-attestation",
      },
      {
        order: 4,
        id: "operator-signoff-action",
        label: "Operator signoff",
        source: "/api/gamma/stage-5/operator-signoff",
        action: "confirm-and-approve-record",
        status: "operator-required",
        owner: "operator",
        evidence: "operator-signoff-required-before-production-promotion",
      },
      {
        order: 5,
        id: "release-closeout-packet-action",
        label: "Release closeout packet",
        source: "/api/gamma/stage-5/release-closeout-packet",
        action: "confirm-and-approve-record",
        status: "operator-required",
        owner: "operator",
        evidence:
          "stage-5-release-closeout-requires-operations-review-bundle-archive-retention-and-rollback-evidence",
      },
    ]);
    expect(queue.queueRule).toBe(
      "stage-5-release-operator-action-queue-requires-human-review-before-production-approval"
    );
  }, 30000);

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseOperatorActionQueue()).toEqual(
      buildGammaStage5ReleaseOperatorActionQueue()
    );
  }, 90000);

  it("serves the queue through the Stage 5 release operator action queue route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_operator_action_queue");
    expect(body.apiSurfaceCount).toBe(44);
    expect(body.status).toBe("pending-operator-actions");
    expect(body.items).toHaveLength(5);
  }, 30000);
});
