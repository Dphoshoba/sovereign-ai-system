import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/deployment-summary/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5DeploymentSummary } from "../../src/lib/gamma-2/stage-5-deployment-summary";

describe("Gamma 2 Stage 5 deployment summary", () => {
  it("combines readiness, evidence, release, and promotion state", () => {
    const summary = buildGammaStage5DeploymentSummary();

    expect(summary.id).toBe("gamma_2_stage_5_deployment_summary");
    expect(summary.status).toBe("ready-for-controlled-promotion");
    expect(summary.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(summary.phaseCount).toBe(11);
    expect(summary.operatorRequiredCount).toBe(4);
  });

  it("lists the full Stage 5 API surface", () => {
    const summary = buildGammaStage5DeploymentSummary();

    expect(summary.apiSurface).toEqual([
      "/api/gamma/stage-5/readiness",
      "/api/gamma/stage-5/evidence",
      "/api/gamma/stage-5/release-gate",
      "/api/gamma/stage-5/promotion-checklist",
      "/api/gamma/stage-5/deployment-summary",
      "/api/gamma/stage-5/operator-brief",
      "/api/gamma/stage-5/health",
      "/api/gamma/stage-5/release-dashboard",
      "/api/gamma/stage-5/api-manifest",
      "/api/gamma/stage-5/openapi",
      "/api/gamma/stage-5/sdk",
      "/api/gamma/stage-5/contract-digest",
      "/api/gamma/stage-5/release-attestation",
      "/api/gamma/stage-5/rollback-plan",
      "/api/gamma/stage-5/operator-handoff",
      "/api/gamma/stage-5/audit-ledger",
      "/api/gamma/stage-5/deployment-receipt",
      "/api/gamma/stage-5/promotion-journal",
      "/api/gamma/stage-5/operator-signoff",
      "/api/gamma/stage-5/evidence-index",
      "/api/gamma/stage-5/release-bundle",
      "/api/gamma/stage-5/release-archive-manifest",
      "/api/gamma/stage-5/release-retention-policy",
      "/api/gamma/stage-5/release-compliance-matrix",
      "/api/gamma/stage-5/release-exception-register",
      "/api/gamma/stage-5/release-governance-map",
      "/api/gamma/stage-5/release-decision-record",
    ]);
    expect(summary.deploymentRule).toBe(
      "single-summary-for-readiness-evidence-release-and-promotion"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5DeploymentSummary()).toEqual(
      buildGammaStage5DeploymentSummary()
    );
  });

  it("serves the summary through the Stage 5 deployment summary route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_deployment_summary");
    expect(body.status).toBe("ready-for-controlled-promotion");
    expect(body.apiSurface).toHaveLength(27);
  });
});
