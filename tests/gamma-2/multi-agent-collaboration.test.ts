import { describe, expect, it } from "vitest";
import {
  buildPhaseXIXReadiness,
  planAgentCollaboration,
} from "../../src/lib/gamma-2/multi-agent-collaboration";

const BASE_TIME = new Date("2026-07-12T00:00:00.000Z");

describe("Gamma 2 Phase XIX Multi-Agent Collaboration", () => {
  it("plans governed handoffs across specialized agents", () => {
    const plan = planAgentCollaboration({
      missionId: "mission-course-launch",
      currentTime: BASE_TIME,
      requestedRoles: ["writer", "research", "reviewer", "publisher"],
    });

    expect(plan.owner).toBe("gamma");
    expect(plan.status).toBe("collaboration-preview-ready");
    expect(plan.agents).toEqual(["research", "writer", "reviewer", "publisher"]);
    expect(plan.handoffs).toHaveLength(3);
    expect(plan.handoffs.every((handoff) => handoff.approvalRequired)).toBe(true);
    expect(plan.publishingBlocked).toBe(true);
  });

  it("blocks single-agent collaboration requests", () => {
    const plan = planAgentCollaboration({
      missionId: "mission-single-agent",
      currentTime: BASE_TIME,
      requestedRoles: ["research"],
    });

    expect(plan.status).toBe("blocked");
    expect(plan.blockers).toEqual([
      "At least two specialized agents are required for collaboration.",
    ]);
  });

  it("is deterministic for identical agent requests", () => {
    const input = {
      missionId: "mission-deterministic-agents",
      currentTime: BASE_TIME,
      requestedRoles: ["analytics", "research", "writer"] as const,
    };

    expect(planAgentCollaboration(input)).toEqual(planAgentCollaboration(input));
  });

  it("reports Phase XIX readiness", () => {
    const readiness = buildPhaseXIXReadiness();

    expect(readiness.phase).toBe("XIX");
    expect(readiness.agentRule).toBe("no-agent-publishes");
    expect(readiness.supportedAgentRoles).toContain("medical-review");
    expect(readiness.supportedAgentRoles).toContain("publisher");
  });
});
