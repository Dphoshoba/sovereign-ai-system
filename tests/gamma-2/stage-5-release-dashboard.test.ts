import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-dashboard/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseDashboard } from "../../src/lib/gamma-2/stage-5-release-dashboard";

describe("Gamma 2 Stage 5 release dashboard", () => {
  it("builds a consolidated release dashboard read model", () => {
    const dashboard = buildGammaStage5ReleaseDashboard();

    expect(dashboard.id).toBe("gamma_2_stage_5_release_dashboard");
    expect(dashboard.status).toBe("ready-for-dashboard-review");
    expect(dashboard.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(dashboard.health.phaseCount).toBe(11);
    expect(dashboard.health.apiSurfaceCount).toBe(35);
    expect(dashboard.releaseChecks).toEqual({ passed: 3, operatorRequired: 2, total: 5 });
    expect(dashboard.promotionSteps).toEqual({ complete: 3, operatorRequired: 2, total: 5 });
    expect(dashboard.operatorActions).toHaveLength(2);
  });

  it("lists the dashboard API in the Stage 5 API surface", () => {
    const dashboard = buildGammaStage5ReleaseDashboard();

    expect(dashboard.apiSurface).toContain("/api/gamma/stage-5/release-dashboard");
    expect(dashboard.apiSurface).toHaveLength(35);
    expect(dashboard.dashboardRule).toBe(
      "single-dashboard-contract-for-stage-5-release-operations"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseDashboard()).toEqual(
      buildGammaStage5ReleaseDashboard()
    );
  });

  it("serves the dashboard through the Stage 5 release dashboard route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_dashboard");
    expect(body.status).toBe("ready-for-dashboard-review");
    expect(body.dashboardCards).toHaveLength(4);
  });
});
