import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/evidence/route";
import { buildGammaStage5EvidenceBundle } from "../../src/lib/gamma-2/stage-5-evidence";

describe("Gamma 2 Stage 5 evidence bundle", () => {
  it("builds an audit-ready evidence manifest for every completed phase", () => {
    const bundle = buildGammaStage5EvidenceBundle();

    expect(bundle.id).toBe("gamma_2_stage_5_evidence");
    expect(bundle.status).toBe("audit-ready");
    expect(bundle.phaseEvidence).toHaveLength(11);
    expect(bundle.phaseEvidence[0]).toMatchObject({
      phase: "XV",
      docs: "docs/platform/GAMMA_2_PHASE_XV_PRODUCTION_CONNECTORS.md",
      commit: "gamma-stage-5-phase-xv-complete",
    });
    expect(bundle.phaseEvidence[10]).toMatchObject({
      phase: "XXV",
      docs: "docs/platform/GAMMA_2_PHASE_XXV_GAMMA_INTELLIGENCE_NETWORK.md",
      commit: "31e46b0",
    });
  });

  it("records source docs, tags, and verification commands", () => {
    const bundle = buildGammaStage5EvidenceBundle();

    expect(bundle.sourceDocument).toBe("docs/platform/Gamma_2_Autonomous_Operating_System.docx");
    expect(bundle.masterRoadmap).toBe("docs/platform/GAMMA_2_MASTER_ROADMAP.md");
    expect(bundle.completionReport).toBe("docs/platform/GAMMA_2_STAGE_5_COMPLETION_REPORT.md");
    expect(bundle.tags).toContain("gamma-2-roadmap-complete");
    expect(bundle.verificationCommands).toEqual([
      "npm test",
      "npm run test:determinism",
      "npm run build",
      "npm run smoke:v1",
    ]);
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5EvidenceBundle()).toEqual(buildGammaStage5EvidenceBundle());
  });

  it("serves the bundle through the Stage 5 evidence route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_evidence");
    expect(body.status).toBe("audit-ready");
    expect(body.phaseEvidence).toHaveLength(11);
  });
});
