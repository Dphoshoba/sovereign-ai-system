import {
  PlanningEngine,
  PlanningRequest,
  PlanningResult,
  ProviderAssignment,
  ProviderCapability,
  RankedPlan,
} from "./planning-engine";

export class PlanningEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanningEngineError';
  }
}

// ── Scoring Strategies ──

type Strategy = 'balanced' | 'cost_optimal' | 'latency_optimal' | 'confidence_optimal';

const ALL_STRATEGIES: Strategy[] = [
  'balanced',
  'cost_optimal',
  'latency_optimal',
  'confidence_optimal',
];

const STRATEGY_LABEL: Record<Strategy, string> = {
  balanced: 'Balanced trade-off (cost + latency + confidence)',
  cost_optimal: 'Minimize estimated cost',
  latency_optimal: 'Minimize estimated latency',
  confidence_optimal: 'Maximize provider confidence',
};

// ── Implementation ──

export class PlanningEngineImpl implements PlanningEngine {
  plan(request: PlanningRequest): PlanningResult {
    const { definition, context, capabilities, policy } = request;

    if (definition.steps.length === 0) {
      throw new PlanningEngineError('Cannot plan empty workflow');
    }

    const snapshot = [...capabilities];

    const plans: RankedPlan[] = [];

    for (const strategy of ALL_STRATEGIES) {
      const assignments = this.assignProviders(
        definition.steps,
        capabilities,
        strategy,
        context.preferredProviders,
      );
      if (!assignments) continue;

      const totalCost = sum(assignments, (a) => a.cost);
      const totalLatency = sum(assignments, (a) => a.latencyMs);
      const violations = this.evaluateViolations(assignments, context, policy);
      const score = this.calculateScore(assignments, totalCost, totalLatency, violations, strategy);
      const explanation = STRATEGY_LABEL[strategy] +
        `. Score: ${score}/100. Cost: ${totalCost}. Latency: ${totalLatency}ms.` +
        (violations.length > 0 ? ` Violations: ${violations.join('; ')}.` : '');

      plans.push({ rank: 0, score, explanation, assignments, totalCost, totalLatencyMs: totalLatency, violations, strategy });
    }

    if (plans.length === 0) {
      throw new PlanningEngineError('No feasible execution plan found');
    }

    const sorted = plans.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.totalCost - b.totalCost;
    });

    const ranked = sorted.map((p, i) => ({ ...p, rank: i + 1 }));

    return {
      workflowId: definition.workflowId,
      executionId: context.executionId,
      selectedPlan: ranked[0],
      alternatives: ranked.slice(1),
      providerMetadataSnapshot: snapshot,
    };
  }

  // ── Provider Assignment ──

  private assignProviders(
    steps: PlanningRequest['definition']['steps'],
    capabilities: readonly ProviderCapability[],
    strategy: Strategy,
    preferredProviders: readonly string[],
  ): ProviderAssignment[] | null {
    const assignments: ProviderAssignment[] = [];

    for (const step of steps) {
      const matches = capabilities
        .filter((c) => c.operation === step.operation)
        .map((c) => ({ providerId: c.providerId, capability: c }));

      if (matches.length === 0) {
        // Use the step's original providerId with default cost/latency
        assignments.push({
          stepId: step.stepId,
          providerId: step.providerId,
          operation: step.operation,
          cost: 0,
          latencyMs: 0,
          confidence: 1,
        });
        continue;
      }

      const selected = this.selectBest(matches, strategy, preferredProviders);
      assignments.push({
        stepId: step.stepId,
        providerId: selected.providerId,
        operation: step.operation,
        cost: selected.capability.estimatedCost,
        latencyMs: selected.capability.estimatedLatencyMs,
        confidence: selected.capability.confidence,
      });
    }

    return assignments;
  }

  private selectBest(
    matches: Array<{ providerId: string; capability: ProviderCapability }>,
    strategy: Strategy,
    preferredProviders: readonly string[],
  ): { providerId: string; capability: ProviderCapability } {
    switch (strategy) {
      case 'cost_optimal':
        return minBy(matches, (m) => m.capability.estimatedCost);

      case 'latency_optimal':
        return minBy(matches, (m) => m.capability.estimatedLatencyMs);

      case 'confidence_optimal':
        return maxBy(matches, (m) => m.capability.confidence);

      case 'balanced': {
        const preferred = matches.filter((m) => preferredProviders.includes(m.providerId));
        const pool = preferred.length > 0 ? preferred : matches;
        return minBy(pool, (m) =>
          m.capability.estimatedCost * 0.6 +
          m.capability.estimatedLatencyMs * 0.3 +
          (1 - m.capability.confidence) * 100 * 0.1,
        );
      }
    }
  }

  // ── Scoring ──

  private calculateScore(
    _assignments: readonly ProviderAssignment[],
    totalCost: number,
    totalLatency: number,
    violations: string[],
    strategy: Strategy,
  ): number {
    let score = 100;
    score -= violations.length * 20;
    if (totalCost > 0 && totalCost > 50) score -= Math.min(20, ((totalCost - 50) / 50) * 20);
    if (totalLatency > 0 && totalLatency > 2000) score -= Math.min(15, ((totalLatency - 2000) / 2000) * 15);
    if (strategy === 'balanced') score += 5;
    return Math.max(0, Math.round(score));
  }

  private evaluateViolations(
    assignments: readonly ProviderAssignment[],
    context: PlanningRequest['context'],
    policy: PlanningRequest['policy'],
  ): string[] {
    const v: string[] = [];
    const totalCost = sum(assignments, (a) => a.cost);
    const totalLatency = sum(assignments, (a) => a.latencyMs);

    if (context.costCeiling !== null && totalCost > context.costCeiling) {
      v.push(`Total cost ${totalCost} exceeds ceiling ${context.costCeiling}`);
    }
    if (context.latencyObjectiveMs !== null && totalLatency > context.latencyObjectiveMs) {
      v.push(`Total latency ${totalLatency}ms exceeds objective ${context.latencyObjectiveMs}ms`);
    }
    if (policy) {
      for (const a of assignments) {
        if (policy.permittedProviders.length > 0 && !policy.permittedProviders.includes(a.providerId)) {
          v.push(`Provider '${a.providerId}' not in permitted list`);
        }
      }
    }
    return v;
  }
}

// ── Helpers ──

function sum(arr: readonly ProviderAssignment[], fn: (a: ProviderAssignment) => number): number {
  return arr.reduce((s, a) => s + fn(a), 0);
}

function minBy<T>(arr: T[], fn: (t: T) => number): T {
  return arr.reduce((best, curr) => (fn(curr) < fn(best) ? curr : best));
}

function maxBy<T>(arr: T[], fn: (t: T) => number): T {
  return arr.reduce((best, curr) => (fn(curr) > fn(best) ? curr : best));
}
