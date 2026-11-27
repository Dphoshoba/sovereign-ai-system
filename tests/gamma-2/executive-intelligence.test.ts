import { describe, expect, it } from "vitest";
import {
  buildExecutiveIntelligenceBrief,
  buildPhaseXXIIIReadiness,
  type ExecutiveSignal,
} from "../../src/lib/gamma-2/executive-intelligence";

const BASE_TIME = new Date("2026-07-12T00:00:00.000Z");

function signal(overrides: Partial<ExecutiveSignal> = {}): ExecutiveSignal {
  return {
    id: "launch-roadblock",
    kind: "mission",
    title: "Resolve launch approval roadblock",
    owner: "executive",
    status: "blocked",
    dueAt: new Date("2026-07-11T00:00:00.000Z"),
    expectedRoi: 88,
    riskScore: 82,
    effortScore: 30,
    ...overrides,
  };
}

describe("Gamma 2 Phase XXIII Executive Intelligence", () => {
  it("answers blocked, overdue, ROI, risk, and today questions", () => {
    const brief = buildExecutiveIntelligenceBrief({
      briefId: "daily-ops",
      currentTime: BASE_TIME,
      signals: [
        signal(),
        signal({
          id: "low-risk-admin",
          kind: "task",
          title: "Archive completed notes",
          status: "open",
          dueAt: new Date("2026-07-14T00:00:00.000Z"),
          expectedRoi: 20,
          riskScore: 10,
          effortScore: 15,
        }),
      ],
    });

    expect(brief.answers.blocked.map((item) => item.id)).toEqual(["launch-roadblock"]);
    expect(brief.answers.overdue.map((item) => item.id)).toEqual(["launch-roadblock"]);
    expect(brief.answers.highestRoi[0]?.id).toBe("launch-roadblock");
    expect(brief.answers.risks.map((item) => item.id)).toEqual(["launch-roadblock"]);
    expect(brief.answers.today.map((item) => item.id)).toEqual(["launch-roadblock"]);
  });

  it("excludes completed signals from executive pressure", () => {
    const brief = buildExecutiveIntelligenceBrief({
      briefId: "completed-filter",
      currentTime: BASE_TIME,
      signals: [signal({ id: "done", status: "complete", riskScore: 100, expectedRoi: 100 })],
    });

    expect(brief.answers.blocked).toEqual([]);
    expect(brief.answers.overdue).toEqual([]);
    expect(brief.answers.highestRoi).toEqual([]);
    expect(brief.answers.risks).toEqual([]);
    expect(brief.answers.today).toEqual([]);
  });

  it("sorts priorities deterministically by score then id", () => {
    const brief = buildExecutiveIntelligenceBrief({
      briefId: "sorting",
      currentTime: BASE_TIME,
      signals: [
        signal({ id: "b-risk", riskScore: 70, expectedRoi: 65 }),
        signal({ id: "a-risk", riskScore: 70, expectedRoi: 65 }),
      ],
    });

    expect(brief.answers.risks.map((item) => item.id)).toEqual(["a-risk", "b-risk"]);
  });

  it("is deterministic for identical executive input", () => {
    const input = {
      briefId: "deterministic",
      currentTime: BASE_TIME,
      signals: [
        signal({ id: "risk", kind: "risk", riskScore: 90 }),
        signal({ id: "opportunity", kind: "opportunity", expectedRoi: 95 }),
      ],
    };

    expect(buildExecutiveIntelligenceBrief(input)).toEqual(
      buildExecutiveIntelligenceBrief(input)
    );
  });

  it("reports Phase XXIII readiness", () => {
    const readiness = buildPhaseXXIIIReadiness();

    expect(readiness.phase).toBe("XXIII");
    expect(readiness.answers).toEqual(["blocked", "overdue", "highestRoi", "risks", "today"]);
    expect(readiness.executiveRule).toBe("answer-first-deterministic-brief");
  });
});
