import { describe, expect, it } from "vitest";
import {
  PHASE_XXII_LEARNING_LOOP,
  buildLearningEnginePlan,
  buildPhaseXXIIReadiness,
  type LearningSignal,
} from "../../src/lib/gamma-2/learning-engine";

const BASE_TIME = new Date("2026-07-12T00:00:00.000Z");

function signal(overrides: Partial<LearningSignal> = {}): LearningSignal {
  return {
    id: "mission-success",
    category: "mission",
    outcomeScore: 78,
    humanFeedback: "positive",
    policyReviewed: true,
    recommendation: "Prioritize launch blockers with proven approval paths.",
    ...overrides,
  };
}

describe("Gamma 2 Phase XXII Learning Engine", () => {
  it("builds governed recommendation updates from outcome signals", () => {
    const plan = buildLearningEnginePlan({
      cycleId: "cycle-001",
      currentTime: BASE_TIME,
      signals: [
        signal({ id: "workflow-latency", category: "workflow", outcomeScore: 65 }),
        signal({ id: "mission-success", category: "mission", outcomeScore: 84 }),
      ],
    });

    expect(plan.status).toBe("learning-ready");
    expect(plan.codeMutationAllowed).toBe(false);
    expect(plan.stages).toEqual(PHASE_XXII_LEARNING_LOOP);
    expect(plan.updates.map((update) => update.sourceSignalId)).toEqual([
      "mission-success",
      "workflow-latency",
    ]);
  });

  it("blocks unreviewed learning before recommendation promotion", () => {
    const plan = buildLearningEnginePlan({
      cycleId: "cycle-policy",
      currentTime: BASE_TIME,
      signals: [signal({ id: "agent-lesson", category: "agent", policyReviewed: false })],
    });

    expect(plan.status).toBe("blocked");
    expect(plan.updates[0]?.governanceStatus).toBe("needs-policy-review");
    expect(plan.blockers).toEqual(["agent-lesson requires policy review"]);
  });

  it("weights human feedback without allowing self-modifying code", () => {
    const positive = buildLearningEnginePlan({
      cycleId: "cycle-positive",
      currentTime: BASE_TIME,
      signals: [signal({ humanFeedback: "positive" })],
    });
    const negative = buildLearningEnginePlan({
      cycleId: "cycle-negative",
      currentTime: BASE_TIME,
      signals: [signal({ humanFeedback: "negative" })],
    });

    expect(positive.optimizationScore).toBeGreaterThan(negative.optimizationScore);
    expect(positive.codeMutationAllowed).toBe(false);
    expect(negative.codeMutationAllowed).toBe(false);
  });

  it("is deterministic for identical learning input", () => {
    const input = {
      cycleId: "cycle-deterministic",
      currentTime: BASE_TIME,
      signals: [
        signal({ id: "connector-feedback", category: "connector", humanFeedback: "neutral" }),
        signal({ id: "executive-feedback", category: "executive", humanFeedback: "positive" }),
      ],
    };

    expect(buildLearningEnginePlan(input)).toEqual(buildLearningEnginePlan(input));
  });

  it("reports Phase XXII readiness", () => {
    const readiness = buildPhaseXXIIReadiness();

    expect(readiness.phase).toBe("XXII");
    expect(readiness.loop).toEqual(PHASE_XXII_LEARNING_LOOP);
    expect(readiness.learningRule).toBe("recommendations-improve-code-does-not-mutate");
  });
});
