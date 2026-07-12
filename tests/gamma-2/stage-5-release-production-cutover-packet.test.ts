import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-production-cutover-packet/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseProductionCutoverPacket } from "../../src/lib/gamma-2/stage-5-release-production-cutover-packet";

describe("Gamma 2 Stage 5 release production cutover packet", () => {
  it("builds a pending operator production cutover packet", () => {
    const packet = buildGammaStage5ReleaseProductionCutoverPacket();

    expect(packet.id).toBe("gamma_2_stage_5_release_production_cutover_packet");
    expect(packet.status).toBe("pending-operator-production-cutover");
    expect(packet.branch).toBe("gamma");
    expect(packet.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(packet.apiSurfaceCount).toBe(45);
    expect(packet.cutoverItemCount).toBe(6);
    expect(packet.authorizationEntryCount).toBe(5);
    expect(packet.cutoverCheckCount).toBe(5);
    expect(packet.trafficShiftStepCount).toBe(5);
    expect(packet.rollbackStepCount).toBe(4);
    expect(packet.monitoringCheckCount).toBe(5);
    expect(packet.smoke).toBe("68 routes passed, 0 failed");
    expect(packet.approvalBoundary).toBe("human-approval-before-production");
  }, 180000);

  it("records pending operator cutover evidence", () => {
    const packet = buildGammaStage5ReleaseProductionCutoverPacket();

    expect(packet.items).toEqual([
      {
        order: 1,
        id: "authorization-ledger-bound",
        label: "Bind production authorization ledger",
        source: "/api/gamma/stage-5/release-production-authorization-ledger",
        evidence:
          "stage-5-production-authorization-ledger-requires-receipt-release-gate-env-confirmation-and-human-approval",
        status: "pending-operator-cutover",
      },
      {
        order: 2,
        id: "cutover-checklist-bound",
        label: "Bind cutover checklist",
        source: "/api/gamma/stage-5/release-cutover-checklist",
        evidence:
          "stage-5-cutover-checklist-requires-operator-confirmation-before-traffic-shift",
        status: "pending-operator-cutover",
      },
      {
        order: 3,
        id: "traffic-shift-plan-bound",
        label: "Bind traffic shift plan",
        source: "/api/gamma/stage-5/release-traffic-shift-plan",
        evidence:
          "stage-5-traffic-shift-requires-cutover-checklist-health-and-rollback-evidence",
        status: "pending-operator-cutover",
      },
      {
        order: 4,
        id: "rollback-plan-bound",
        label: "Bind rollback plan",
        source: "/api/gamma/stage-5/rollback-plan",
        evidence: "operator-approved-rollback-to-last-attested-stage-5-tag",
        status: "pending-operator-cutover",
      },
      {
        order: 5,
        id: "monitoring-plan-bound",
        label: "Bind monitoring plan",
        source: "/api/gamma/stage-5/release-monitoring-plan",
        evidence:
          "stage-5-post-shift-monitoring-requires-health-audit-and-receipt-evidence",
        status: "pending-operator-cutover",
      },
      {
        order: 6,
        id: "human-approval-bound",
        label: "Bind human approval boundary",
        source: "/api/gamma/stage-5/release-gate",
        evidence: "human-approval-before-production",
        status: "pending-operator-cutover",
      },
    ]);
    expect(packet.cutoverPacketRule).toBe(
      "stage-5-production-cutover-packet-requires-authorization-cutover-traffic-rollback-monitoring-and-human-approval"
    );
  }, 180000);

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseProductionCutoverPacket()).toEqual(
      buildGammaStage5ReleaseProductionCutoverPacket()
    );
  }, 240000);

  it("serves the packet through the Stage 5 release production cutover packet route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_production_cutover_packet");
    expect(body.apiSurfaceCount).toBe(45);
    expect(body.status).toBe("pending-operator-production-cutover");
    expect(body.items).toHaveLength(6);
  }, 180000);
});
