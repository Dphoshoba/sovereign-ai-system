import { describe, expect, it } from "vitest";
import {
  buildMissionAutomationPlan,
  buildPhaseXVIIReadiness,
} from "../../src/lib/gamma-2/mission-automation";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

describe("Gamma 2 Phase XVII Mission Automation", () => {
  it("decomposes a launch mission into governed work packages", () => {
    const plan = buildMissionAutomationPlan({
      missionId: "launch-menwise360-course",
      title: "Launch MenWise360 Course",
      objective: "Launch the course through a governed mission plan.",
      currentTime: BASE_TIME,
    });

    expect(plan.owner).toBe("gamma");
    expect(plan.state).toBe("preview-plan-ready");
    expect(plan.executionBoundary).toBe("preview-only");
    expect(plan.workPackages.map((item) => item.workstream)).toEqual([
      "research",
      "content",
      "graphics",
      "video",
      "landing-page",
      "newsletter",
      "social",
      "analytics",
      "support",
      "archive",
    ]);
  });

  it("requires approval, queue, and audit boundaries for every package", () => {
    const plan = buildMissionAutomationPlan({
      missionId: "launch-menwise360-course",
      title: "Launch MenWise360 Course",
      objective: "Launch the course through a governed mission plan.",
      currentTime: BASE_TIME,
    });

    expect(plan.workPackages.every((item) => item.approvalRequired)).toBe(true);
    expect(plan.workPackages.every((item) => item.previewOnly)).toBe(true);
    expect(plan.workPackages.every((item) => item.auditRoute.startsWith("audit://"))).toBe(true);
    expect(plan.governanceCheckpoints).toContain("queue-before-execution");
  });

  it("is deterministic for identical mission input", () => {
    const input = {
      missionId: "launch-menwise360-course",
      title: "Launch MenWise360 Course",
      objective: "Launch the course through a governed mission plan.",
      currentTime: BASE_TIME,
    };

    expect(buildMissionAutomationPlan(input)).toEqual(buildMissionAutomationPlan(input));
  });

  it("reports Phase XVII readiness", () => {
    const readiness = buildPhaseXVIIReadiness();

    expect(readiness.phase).toBe("XVII");
    expect(readiness.name).toBe("Mission Automation");
    expect(readiness.requiredWorkstreamCount).toBe(10);
    expect(readiness.missionRule).toBe("one-request-governed-work-packages");
  });
});
