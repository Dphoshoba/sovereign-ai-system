export type LearningSignalCategory =
  | "mission"
  | "workflow"
  | "connector"
  | "agent"
  | "executive";

export type HumanFeedback = "positive" | "neutral" | "negative";

export type LearningLoopStage =
  | "outcome"
  | "evaluation"
  | "human-feedback"
  | "policy-review"
  | "optimization"
  | "recommendation-update";

export interface LearningSignal {
  id: string;
  category: LearningSignalCategory;
  outcomeScore: number;
  humanFeedback: HumanFeedback;
  policyReviewed: boolean;
  recommendation: string;
}

export interface LearningEngineInput {
  cycleId: string;
  currentTime: Date;
  signals: LearningSignal[];
}

export interface LearningRecommendationUpdate {
  id: string;
  sourceSignalId: string;
  category: LearningSignalCategory;
  recommendation: string;
  confidence: number;
  governanceStatus: "reviewed" | "needs-policy-review";
}

export interface LearningEnginePlan {
  id: string;
  cycleId: string;
  status: "learning-ready" | "blocked";
  stages: LearningLoopStage[];
  updates: LearningRecommendationUpdate[];
  optimizationScore: number;
  blockers: string[];
  codeMutationAllowed: false;
  generatedAt: Date;
}

export const PHASE_XXII_LEARNING_LOOP: LearningLoopStage[] = [
  "outcome",
  "evaluation",
  "human-feedback",
  "policy-review",
  "optimization",
  "recommendation-update",
];

const FEEDBACK_WEIGHT: Record<HumanFeedback, number> = {
  positive: 12,
  neutral: 0,
  negative: -18,
};

function clampScore(score: number): number {
  if (score < 0) return 0;
  if (score > 100) return 100;
  return Math.round(score);
}

function normalizeSignals(signals: LearningSignal[]): LearningSignal[] {
  return [...signals].sort((a, b) => {
    const categoryDelta = a.category.localeCompare(b.category);
    if (categoryDelta !== 0) return categoryDelta;
    return a.id.localeCompare(b.id);
  });
}

function scoreSignal(signal: LearningSignal): number {
  const reviewWeight = signal.policyReviewed ? 8 : -25;
  return clampScore(signal.outcomeScore + FEEDBACK_WEIGHT[signal.humanFeedback] + reviewWeight);
}

export function buildLearningEnginePlan(input: LearningEngineInput): LearningEnginePlan {
  const signals = normalizeSignals(input.signals);
  const updates: LearningRecommendationUpdate[] = signals.map((signal) => ({
    id: `learning_update_${signal.id}`,
    sourceSignalId: signal.id,
    category: signal.category,
    recommendation: signal.recommendation,
    confidence: scoreSignal(signal),
    governanceStatus: signal.policyReviewed ? "reviewed" : "needs-policy-review",
  }));
  const blockers = updates
    .filter((update) => update.governanceStatus === "needs-policy-review")
    .map((update) => `${update.sourceSignalId} requires policy review`);
  const optimizationScore =
    updates.length === 0
      ? 0
      : clampScore(updates.reduce((sum, update) => sum + update.confidence, 0) / updates.length);

  return {
    id: `learning_engine_${input.cycleId}`,
    cycleId: input.cycleId,
    status: blockers.length === 0 && updates.length > 0 ? "learning-ready" : "blocked",
    stages: [...PHASE_XXII_LEARNING_LOOP],
    updates,
    optimizationScore,
    blockers,
    codeMutationAllowed: false,
    generatedAt: new Date(input.currentTime),
  };
}

export function buildPhaseXXIIReadiness(): {
  phase: "XXII";
  name: "Learning Engine";
  loop: LearningLoopStage[];
  learningRule: "recommendations-improve-code-does-not-mutate";
} {
  return {
    phase: "XXII",
    name: "Learning Engine",
    loop: [...PHASE_XXII_LEARNING_LOOP],
    learningRule: "recommendations-improve-code-does-not-mutate",
  };
}
