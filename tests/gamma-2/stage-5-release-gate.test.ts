import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/release-gate/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5ReleaseGate } from "../../src/lib/gamma-2/stage-5-release-gate";

describe("Gamma 2 Stage 5 release gate", () => {
  it("builds an operator promotion gate for the canonical production URL", () => {
    const gate = buildGammaStage5ReleaseGate();

    expect(gate.id).toBe("gamma_2_stage_5_release_gate");
    expect(gate.status).toBe("ready-for-operator-promotion");
    expect(gate.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(gate.requiredPublicEnv).toEqual({
      NEXT_PUBLIC_APP_URL: PRODUCTION_APP_URL,
      NEXT_PUBLIC_BASE_URL: PRODUCTION_APP_URL,
    });
  });

  it("keeps operator-required checks distinct from completed verification checks", () => {
    const gate = buildGammaStage5ReleaseGate();

    expect(gate.checks.filter((check) => check.status === "pass")).toHaveLength(3);
    expect(gate.checks.filter((check) => check.status === "operator-required")).toEqual([
      {
        id: "production-env",
        label: "Vercel public base URLs must match the canonical production origin",
        status: "operator-required",
        evidence: PRODUCTION_APP_URL,
      },
      {
        id: "operator-promotion",
        label: "Human operator remains responsible for production promotion",
        status: "operator-required",
        evidence: "human-approval-before-production",
      },
    ]);
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReleaseGate()).toEqual(buildGammaStage5ReleaseGate());
  });

  it("serves the gate through the Stage 5 release gate route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_release_gate");
    expect(body.status).toBe("ready-for-operator-promotion");
    expect(body.productionUrl).toBe(PRODUCTION_APP_URL);
  });
});
