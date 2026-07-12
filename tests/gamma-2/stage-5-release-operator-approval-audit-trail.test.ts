import { describe, expect, it } from "vitest";
import { GAMMA_STAGE_5_SMOKE_SUMMARY, GAMMA_STAGE_5_SURFACE_COUNTS } from "../../src/lib/gamma-2/stage-5-surface-registry";
import { GET } from "../../app/api/gamma/stage-5/release-operator-approval-audit-trail/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseOperatorApprovalAuditTrail } from "../../src/lib/gamma-2/stage-5-release-operator-approval-audit-trail";

describe("Gamma 2 Stage 5 release operator approval audit trail", () => {
  it("builds a durable approval audit trail", () => {
    const trail = buildGammaStage5ReleaseOperatorApprovalAuditTrail();

    expect(trail.id).toBe("gamma_2_stage_5_release_operator_approval_audit_trail");
    expect(trail.status).toBe("audit-ready-pending-human-approval");
    expect(trail.branch).toBe("gamma");
    expect(trail.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(trail.apiSurfaceCount).toBe(GAMMA_STAGE_5_SURFACE_COUNTS.totalEndpoints);
    expect(trail.auditEntryCount).toBe(5);
    expect(trail.queueItemCount).toBe(5);
    expect(trail.approvalRequirementCount).toBe(4);
    expect(trail.operatorRequiredItemCount).toBe(4);
    expect(trail.signoffRequirementCount).toBe(4);
    expect(trail.smoke).toBe(GAMMA_STAGE_5_SMOKE_SUMMARY);
  }, 120000);

  it("records the approval evidence chain", () => {
    const trail = buildGammaStage5ReleaseOperatorApprovalAuditTrail();

    expect(trail.entries).toEqual([
      {
        order: 1,
        id: "operator-approval-packet-recorded",
        event: "Operator approval packet prepared",
        source: "/api/gamma/stage-5/release-operator-approval-packet",
        evidence:
          "stage-5-release-operator-approval-packet-requires-action-queue-signoff-and-human-production-approval",
        actor: "operator",
        status: "audit-ready",
      },
      {
        order: 2,
        id: "operator-action-queue-recorded",
        event: "Operator action queue prepared",
        source: "/api/gamma/stage-5/release-operator-action-queue",
        evidence:
          "stage-5-release-operator-action-queue-requires-human-review-before-production-approval",
        actor: "operator",
        status: "audit-ready",
      },
      {
        order: 3,
        id: "operator-signoff-recorded",
        event: "Operator signoff requirements recorded",
        source: "/api/gamma/stage-5/operator-signoff",
        evidence: "operator-signoff-required-before-production-promotion",
        actor: "operator",
        status: "audit-ready",
      },
      {
        order: 4,
        id: "approval-boundary-recorded",
        event: "Human approval boundary retained",
        source: "/api/gamma/stage-5/release-gate",
        evidence: "human-approval-before-production",
        actor: "release-client",
        status: "audit-ready",
      },
      {
        order: 5,
        id: "verification-recorded",
        event: "Stage 5 smoke verification recorded",
        source: "/api/gamma/stage-5/health",
        evidence: GAMMA_STAGE_5_SMOKE_SUMMARY,
        actor: "release-client",
        status: "audit-ready",
      },
    ]);
    expect(trail.auditRule).toBe(
      "stage-5-release-operator-approval-audit-trail-records-packet-queue-signoff-boundary-and-verification"
    );
  }, 120000);

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseOperatorApprovalAuditTrail()).toEqual(
      buildGammaStage5ReleaseOperatorApprovalAuditTrail()
    );
  }, 180000);

  it("serves the trail through the Stage 5 release operator approval audit trail route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_operator_approval_audit_trail");
    expect(body.apiSurfaceCount).toBe(GAMMA_STAGE_5_SURFACE_COUNTS.totalEndpoints);
    expect(body.status).toBe("audit-ready-pending-human-approval");
    expect(body.entries).toHaveLength(5);
  }, 120000);
});
