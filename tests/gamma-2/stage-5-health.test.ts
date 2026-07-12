import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/health/route";
import { buildGammaStage5Health } from "../../src/lib/gamma-2/stage-5-health";

describe("Gamma 2 Stage 5 health", () => {
  it("builds a compact health status for monitoring", () => {
    const health = buildGammaStage5Health();

    expect(health.id).toBe("gamma_2_stage_5_health");
    expect(health.status).toBe("healthy");
    expect(health.phaseCount).toBe(11);
    expect(health.apiSurfaceCount).toBe(38);
    expect(health.smoke).toBe("61 routes passed, 0 failed");
    expect(health.operatorActionsRemaining).toBe(2);
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5Health()).toEqual(buildGammaStage5Health());
  });

  it("serves the health payload through the Stage 5 health route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_health");
    expect(body.status).toBe("healthy");
    expect(body.healthRule).toBe("compact-health-for-stage-5-monitoring");
  });
});
