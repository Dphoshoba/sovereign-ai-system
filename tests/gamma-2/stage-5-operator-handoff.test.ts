import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/operator-handoff/route";
import { buildGammaStage5OperatorHandoff } from "../../src/lib/gamma-2/stage-5-operator-handoff";

describe("Gamma 2 Stage 5 operator handoff", () => {
  it("builds one operator handoff packet from brief, attestation, and rollback state", () => {
    const handoff = buildGammaStage5OperatorHandoff();

    expect(handoff.id).toBe("gamma_2_stage_5_operator_handoff");
    expect(handoff.status).toBe("ready-for-operator-handoff");
    expect(handoff.headline).toBe(
      "Gamma 2 Stage 5 is verified and ready for controlled promotion."
    );
    expect(handoff.digestFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(handoff.nextOperatorActions).toHaveLength(2);
    expect(handoff.rollbackSteps).toHaveLength(4);
  });

  it("lists the required handoff artifacts", () => {
    const handoff = buildGammaStage5OperatorHandoff();

    expect(handoff.requiredArtifactPaths).toEqual([
      "/api/gamma/stage-5/operator-brief",
      "/api/gamma/stage-5/release-attestation",
      "/api/gamma/stage-5/rollback-plan",
      "/api/gamma/stage-5/contract-digest",
    ]);
    expect(handoff.handoffRule).toBe(
      "operator-reviews-brief-attestation-and-rollback-before-promotion"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5OperatorHandoff()).toEqual(buildGammaStage5OperatorHandoff());
  });

  it("serves the handoff through the Stage 5 operator handoff route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_operator_handoff");
    expect(body.requiredArtifactPaths).toHaveLength(4);
    expect(body.handoffRule).toBe(
      "operator-reviews-brief-attestation-and-rollback-before-promotion"
    );
  });
});
