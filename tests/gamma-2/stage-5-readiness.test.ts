import { describe, expect, it } from "vitest";
import { PHASE_XV_CONNECTOR_PRIORITY } from "../../src/lib/gamma-2/production-connectors";
import {
  buildGammaStage5ReadinessSnapshot,
  GAMMA_STAGE_5_COMPLETION_TIME,
} from "../../src/lib/gamma-2/stage-5-readiness";
import { GET } from "../../app/api/gamma/stage-5/readiness/route";

describe("Gamma 2 Stage 5 readiness snapshot", () => {
  it("summarizes all completed roadmap phases", () => {
    const snapshot = buildGammaStage5ReadinessSnapshot();

    expect(snapshot.status).toBe("complete");
    expect(snapshot.branch).toBe("gamma");
    expect(snapshot.completionTag).toBe("gamma-2-roadmap-complete");
    expect(snapshot.reportTag).toBe("gamma-2-stage-5-completion-report");
    expect(snapshot.phases.map((phase) => phase.phase)).toEqual([
      "XV",
      "XVI",
      "XVII",
      "XVIII",
      "XIX",
      "XX",
      "XXI",
      "XXII",
      "XXIII",
      "XXIV",
      "XXV",
    ]);
  });

  it("exposes deterministic verification and governance boundaries", () => {
    const snapshot = buildGammaStage5ReadinessSnapshot();

    expect(snapshot.generatedAt).toEqual(GAMMA_STAGE_5_COMPLETION_TIME);
    expect(snapshot.verification.smoke).toBe("61 routes passed, 0 failed");
    expect(snapshot.governanceBoundaries).toContain("no-self-modifying-code");
    expect(snapshot.governanceBoundaries).toContain("shared-governance-for-every-product");
  });

  it("includes readiness data from the completed Gamma 2 contracts", () => {
    const snapshot = buildGammaStage5ReadinessSnapshot();

    expect(snapshot.readiness.phaseXV.connectorCount).toBe(PHASE_XV_CONNECTOR_PRIORITY.length);
    expect(snapshot.readiness.phaseXXII.learningRule).toBe(
      "recommendations-improve-code-does-not-mutate"
    );
    expect(snapshot.readiness.phaseXXV.networkRule).toBe(
      "one-governed-network-benefits-every-product"
    );
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5ReadinessSnapshot()).toEqual(buildGammaStage5ReadinessSnapshot());
  });

  it("serves the snapshot through the Stage 5 readiness route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_readiness");
    expect(body.status).toBe("complete");
    expect(body.phases).toHaveLength(11);
  });
});
