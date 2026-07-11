export type KnowledgeMemoryLayer =
  | "knowledge-graph"
  | "semantic-memory"
  | "conversation-memory"
  | "project-memory"
  | "workflow-memory"
  | "mission-memory"
  | "organization-memory"
  | "decision-memory";

export interface KnowledgeMemorySource {
  id: string;
  layer: KnowledgeMemoryLayer;
  title: string;
  confidence: number;
}

export interface KnowledgeNetworkInput {
  queryId: string;
  currentTime: Date;
  sources: KnowledgeMemorySource[];
}

export interface KnowledgeNetworkExplanation {
  sourceId: string;
  layer: KnowledgeMemoryLayer;
  contribution: string;
  confidence: number;
}

export interface KnowledgeNetworkAnswer {
  id: string;
  queryId: string;
  status: "explainable" | "insufficient-memory";
  memoryLayers: KnowledgeMemoryLayer[];
  explanationChain: KnowledgeNetworkExplanation[];
  confidenceScore: number;
  generatedAt: Date;
}

export const PHASE_XXI_MEMORY_LAYERS: KnowledgeMemoryLayer[] = [
  "knowledge-graph",
  "semantic-memory",
  "conversation-memory",
  "project-memory",
  "workflow-memory",
  "mission-memory",
  "organization-memory",
  "decision-memory",
];

function clampConfidence(confidence: number): number {
  if (confidence < 0) return 0;
  if (confidence > 100) return 100;
  return Math.round(confidence);
}

function normalizeSources(sources: KnowledgeMemorySource[]): KnowledgeMemorySource[] {
  return [...sources].sort((a, b) => {
    const layerDelta =
      PHASE_XXI_MEMORY_LAYERS.indexOf(a.layer) - PHASE_XXI_MEMORY_LAYERS.indexOf(b.layer);
    if (layerDelta !== 0) return layerDelta;
    return a.id.localeCompare(b.id);
  });
}

export function buildKnowledgeNetworkAnswer(
  input: KnowledgeNetworkInput
): KnowledgeNetworkAnswer {
  const sources = normalizeSources(input.sources);
  const explanationChain = sources.map((source) => ({
    sourceId: source.id,
    layer: source.layer,
    contribution: `${source.title} contributes ${source.layer} context.`,
    confidence: clampConfidence(source.confidence),
  }));
  const confidenceScore =
    explanationChain.length === 0
      ? 0
      : clampConfidence(
          explanationChain.reduce((sum, item) => sum + item.confidence, 0) /
            explanationChain.length
        );
  const memoryLayers = PHASE_XXI_MEMORY_LAYERS.filter((layer) =>
    explanationChain.some((item) => item.layer === layer)
  );

  return {
    id: `knowledge_answer_${input.queryId}`,
    queryId: input.queryId,
    status:
      memoryLayers.length >= 3 && confidenceScore >= 60
        ? "explainable"
        : "insufficient-memory",
    memoryLayers,
    explanationChain,
    confidenceScore,
    generatedAt: new Date(input.currentTime),
  };
}

export function buildPhaseXXIReadiness(): {
  phase: "XXI";
  name: "Knowledge Network";
  memoryLayers: KnowledgeMemoryLayer[];
  knowledgeRule: "every-decision-explainable";
} {
  return {
    phase: "XXI",
    name: "Knowledge Network",
    memoryLayers: [...PHASE_XXI_MEMORY_LAYERS],
    knowledgeRule: "every-decision-explainable",
  };
}
