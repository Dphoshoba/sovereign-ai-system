import { EvidenceConfidence } from './evidence-confidence';

export interface DecisionOutcome {
  decisionId: string;
  decisionTitle: string;
  category: string;
  status: 'successful' | 'mixed' | 'failed' | 'pending';
  adoptedAt: number;
  reviewedAt: number;
  outcomeSummary: string;
  lessonsLearned: string[];
  confidenceAdjustment: number;
  recurringPatterns: string[];
  relatedDecisions: string[];
  evidenceIds: string[];
}

export interface DecisionMemorySnapshot {
  totalDecisions: number;
  successfulOutcomes: number;
  failedOutcomes: number;
  confidenceAdjustments: number;
  recurringSuccesses: string[];
  recurringFailures: string[];
  lessonsCount: number;
  assessedAt: number;
}

export function recordDecisionOutcome(params: {
  decisionTitle: string;
  category: string;
  status: DecisionOutcome['status'];
  outcomeSummary: string;
  lessonsLearned: string[];
  evidenceIds: string[];
}): DecisionOutcome {
  const now = Date.now();
  const confidenceAdjustment = params.status === 'successful' ? 0.05 : params.status === 'failed' ? -0.10 : 0;
  return {
    decisionId: `dec-outcome-${now}`,
    decisionTitle: params.decisionTitle,
    category: params.category,
    status: params.status,
    adoptedAt: now,
    reviewedAt: now,
    outcomeSummary: params.outcomeSummary,
    lessonsLearned: params.lessonsLearned,
    confidenceAdjustment,
    recurringPatterns: [],
    relatedDecisions: [],
    evidenceIds: params.evidenceIds,
  };
}

export function adjustConfidenceFromMemory(
  currentConfidence: number,
  outcomes: DecisionOutcome[]
): { adjustedConfidence: number; adjustmentReason: string } {
  if (outcomes.length === 0) return { adjustedConfidence: currentConfidence, adjustmentReason: 'No historical data' };

  const adjustments = outcomes.map(o => o.confidenceAdjustment);
  const totalAdjustment = adjustments.reduce((s, a) => s + a, 0) / adjustments.length;
  const successes = outcomes.filter(o => o.status === 'successful').length;
  const failures = outcomes.filter(o => o.status === 'failed').length;

  let reason = `${outcomes.length} historical decisions: ${successes} successful, ${failures} failed`;
  if (failures > successes) reason += ' — caution warranted';

  return {
    adjustedConfidence: Math.max(0, Math.min(1, Math.round((currentConfidence + totalAdjustment) * 100) / 100)),
    adjustmentReason: reason,
  };
}

export function analyzeDecisionMemory(outcomes: DecisionOutcome[]): DecisionMemorySnapshot {
  const successes = outcomes.filter(o => o.status === 'successful');
  const failures = outcomes.filter(o => o.status === 'failed');
  const successPatterns = successes.map(o => o.decisionTitle);
  const failurePatterns = failures.map(o => o.decisionTitle);
  const allLessons = outcomes.flatMap(o => o.lessonsLearned);
  
  return {
    totalDecisions: outcomes.length,
    successfulOutcomes: successes.length,
    failedOutcomes: failures.length,
    confidenceAdjustments: outcomes.reduce((s, o) => s + o.confidenceAdjustment, 0),
    recurringSuccesses: [...new Set(successPatterns)],
    recurringFailures: [...new Set(failurePatterns)],
    lessonsCount: allLessons.length,
    assessedAt: Date.now(),
  };
}
