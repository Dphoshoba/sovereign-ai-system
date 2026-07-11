import { describe, expect, it } from "vitest";
import {
  PHASE_XXI_MEMORY_LAYERS,
  buildKnowledgeNetworkAnswer,
  buildPhaseXXIReadiness,
  type KnowledgeMemorySource,
} from "../../src/lib/gamma-2/knowledge-network";

const BASE_TIME = new Date("2026-07-12T00:00:00.000Z");

function source(
  id: string,
  layer: KnowledgeMemorySource["layer"],
  confidence: number
): KnowledgeMemorySource {
  return {
    id,
    layer,
    title: `${layer} source`,
    confidence,
  };
}

describe("Gamma 2 Phase XXI Knowledge Network", () => {
  it("builds explainable answers across memory layers", () => {
    const answer = buildKnowledgeNetworkAnswer({
      queryId: "query-launch-risk",
      currentTime: BASE_TIME,
      sources: [
        source("decision", "decision-memory", 82),
        source("graph", "knowledge-graph", 88),
        source("mission", "mission-memory", 80),
      ],
    });

    expect(answer.status).toBe("explainable");
    expect(answer.memoryLayers).toEqual([
      "knowledge-graph",
      "mission-memory",
      "decision-memory",
    ]);
    expect(answer.explanationChain).toHaveLength(3);
  });

  it("keeps weak memory coverage insufficient", () => {
    const answer = buildKnowledgeNetworkAnswer({
      queryId: "query-weak",
      currentTime: BASE_TIME,
      sources: [source("conversation", "conversation-memory", 40)],
    });

    expect(answer.status).toBe("insufficient-memory");
    expect(answer.confidenceScore).toBe(40);
  });

  it("is deterministic for identical memory input", () => {
    const input = {
      queryId: "query-deterministic",
      currentTime: BASE_TIME,
      sources: [
        source("workflow", "workflow-memory", 75),
        source("semantic", "semantic-memory", 70),
        source("project", "project-memory", 72),
      ],
    };

    expect(buildKnowledgeNetworkAnswer(input)).toEqual(buildKnowledgeNetworkAnswer(input));
  });

  it("reports Phase XXI readiness", () => {
    const readiness = buildPhaseXXIReadiness();

    expect(readiness.phase).toBe("XXI");
    expect(readiness.memoryLayers).toEqual(PHASE_XXI_MEMORY_LAYERS);
    expect(readiness.knowledgeRule).toBe("every-decision-explainable");
  });
});
