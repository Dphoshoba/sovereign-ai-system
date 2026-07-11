import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/operator-signoff/route";
import { PRODUCTION_APP_URL } from "../../src/lib/site-config";
import { buildGammaStage5OperatorSignoff } from "../../src/lib/gamma-2/stage-5-operator-signoff";

describe("Gamma 2 Stage 5 operator signoff", () => {
  it("builds a pending signoff packet for human approval", () => {
    const signoff = buildGammaStage5OperatorSignoff();

    expect(signoff.id).toBe("gamma_2_stage_5_operator_signoff");
    expect(signoff.status).toBe("pending-operator-approval");
    expect(signoff.branch).toBe("gamma");
    expect(signoff.productionUrl).toBe(PRODUCTION_APP_URL);
    expect(signoff.apiSurfaceCount).toBe(33);
    expect(signoff.digestFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(signoff.operatorRequiredCount).toBe(4);
  });

  it("requires explicit operator review artifacts before promotion", () => {
    const signoff = buildGammaStage5OperatorSignoff();

    expect(signoff.requirements.map((requirement) => requirement.id)).toEqual([
      "confirm-production-env",
      "review-handoff",
      "review-promotion-journal",
      "approve-promotion",
    ]);
    expect(signoff.requirements.every((requirement) => requirement.required)).toBe(true);
    expect(signoff.signoffArtifacts).toEqual([
      "/api/gamma/stage-5/operator-handoff",
      "/api/gamma/stage-5/promotion-journal",
      "/api/gamma/stage-5/release-gate",
      "/api/gamma/stage-5/promotion-checklist",
      "/api/gamma/stage-5/deployment-summary",
    ]);
    expect(signoff.signoffRule).toBe("operator-signoff-required-before-production-promotion");
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5OperatorSignoff()).toEqual(buildGammaStage5OperatorSignoff());
  });

  it("serves the signoff packet through the Stage 5 operator signoff route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_operator_signoff");
    expect(body.apiSurfaceCount).toBe(33);
    expect(body.requirements).toHaveLength(4);
  });
});
