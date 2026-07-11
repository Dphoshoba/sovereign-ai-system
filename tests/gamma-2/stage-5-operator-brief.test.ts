import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/gamma/stage-5/operator-brief/route";
import { buildGammaStage5OperatorBrief } from "../../src/lib/gamma-2/stage-5-operator-brief";

describe("Gamma 2 Stage 5 operator brief", () => {
  it("builds a concise operator handoff brief", () => {
    const brief = buildGammaStage5OperatorBrief();

    expect(brief.id).toBe("gamma_2_stage_5_operator_brief");
    expect(brief.status).toBe("ready-for-operator-review");
    expect(brief.headline).toBe(
      "Gamma 2 Stage 5 is verified and ready for controlled promotion."
    );
    expect(brief.summary).toContain("11 roadmap phases complete");
    expect(brief.summary).toContain("30 routes passed, 0 failed");
  });

  it("keeps only remaining operator actions in the action list", () => {
    const brief = buildGammaStage5OperatorBrief();

    expect(brief.nextOperatorActions).toEqual([
      "Confirm Vercel public app URLs match production origin",
      "Approve production promotion",
    ]);
    expect(brief.apiSurface).toContain("/api/gamma/stage-5/operator-brief");
  });

  it("is deterministic for repeated calls", () => {
    expect(buildGammaStage5OperatorBrief()).toEqual(buildGammaStage5OperatorBrief());
  });

  it("serves the brief through the Stage 5 operator brief route", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("gamma_2_stage_5_operator_brief");
    expect(body.status).toBe("ready-for-operator-review");
    expect(body.nextOperatorActions).toHaveLength(2);
  });
});
