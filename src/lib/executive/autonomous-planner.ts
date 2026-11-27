import { ReasoningChain, buildReasoning } from './evidence-confidence';

export type PlanHorizon = 'weekly' | 'monthly' | 'quarterly' | 'annual';
export type PlanStatus = 'draft' | 'proposed' | 'approved' | 'active' | 'completed' | 'archived';

export interface PlanItem {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  estimatedCapacity: string;
  dependencies: string[];
  deadline: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AutonomousPlan {
  id: string;
  horizon: PlanHorizon;
  title: string;
  status: PlanStatus;
  items: PlanItem[];
  goals: string[];
  risks: string[];
  resourceAllocation: string;
  reasoning: ReasoningChain;
  generatedAt: number;
}

export function generatePlan(params: {
  horizon: PlanHorizon;
  goalCount: number;
  riskCount: number;
  recommendationCount: number;
  timestampMs: number;
}): AutonomousPlan {
  const now = Date.now();
  const itemCounts: Record<PlanHorizon, number> = { weekly: 5, monthly: 12, quarterly: 20, annual: 40 };
  const count = itemCounts[params.horizon];

  const items: PlanItem[] = [];
  for (let i = 0; i < Math.min(count, params.recommendationCount + 2); i++) {
    items.push({
      id: `plan-item-${params.horizon}-${i + 1}`,
      title: `${params.horizon.charAt(0).toUpperCase() + params.horizon.slice(1)} priority ${i + 1}`,
      priority: i < 2 ? 'critical' : i < 5 ? 'high' : i < 8 ? 'medium' : 'low',
      category: i % 3 === 0 ? 'revenue' : i % 3 === 1 ? 'delivery' : 'governance',
      estimatedCapacity: i < 3 ? 'high' : 'medium',
      dependencies: [],
      deadline: `${params.horizon.charAt(0).toUpperCase() + params.horizon.slice(1)} target`,
      riskLevel: i > count * 0.7 ? 'high' : i > count * 0.4 ? 'medium' : 'low',
    });
  }

  const reasoning = buildReasoning({
    summary: `${params.horizon} plan with ${items.length} items, ${params.goalCount} goals, ${params.riskCount} risks tracked`,
    evidenceIds: [`plan-${params.horizon}-${now}`],
    confidenceScore: Math.min(1, params.recommendationCount * 0.05 + 0.4),
    sourceCount: params.recommendationCount,
    dataFreshnessHours: 0,
    missingEvidence: params.goalCount < 1 ? ['No active goals defined'] : [],
    hasConflictingEvidence: params.riskCount > params.goalCount * 2,
    decisionFactors: [
      `Goals tracked: ${params.goalCount}`,
      `Risks identified: ${params.riskCount}`,
      `Recommendations available: ${params.recommendationCount}`,
    ],
  });

  return {
    id: `plan-${params.horizon}-${now}`,
    horizon: params.horizon,
    title: `${params.horizon.charAt(0).toUpperCase() + params.horizon.slice(1)} Plan`,
    status: 'draft',
    items,
    goals: Array.from({ length: params.goalCount }, (_, i) => `Goal ${i + 1}`),
    risks: Array.from({ length: params.riskCount }, (_, i) => `Risk ${i + 1}`),
    resourceAllocation: `${params.recommendationCount > 5 ? 'Balanced' : 'Limited'} allocation across ${items.length} planned items`,
    reasoning,
    generatedAt: now,
  };
}

export interface PlanningSuite {
  plans: AutonomousPlan[];
  generatedAt: number;
  summary: string;
  totalItems: number;
}

export function generatePlanningSuite(params: {
  goalCount: number;
  riskCount: number;
  recommendationCount: number;
  timestampMs: number;
}): PlanningSuite {
  const horizons: PlanHorizon[] = ['weekly', 'monthly', 'quarterly', 'annual'];
  const plans = horizons.map(h => generatePlan({ ...params, horizon: h }));
  return {
    plans,
    generatedAt: Date.now(),
    summary: `${plans.length} plans generated across ${horizons.length} horizons`,
    totalItems: plans.reduce((s, p) => s + p.items.length, 0),
  };
}
