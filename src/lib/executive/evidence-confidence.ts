export interface EvidenceConfidence {
  score: number;
  evidenceIds: string[];
  sourceCount: number;
  dataFreshnessHours: number;
  missingEvidence: string[];
  hasConflictingEvidence: boolean;
  lastVerifiedAt: number;
  computedAt: number;
}

export interface ConfidenceAnalysis {
  overallConfidence: number;
  assumptionConfidence: number;
  evidenceCoverage: number;
  trackRecordComments: string;
  componentCount: number;
  componentsAssessed: number;
}

export function computeEvidenceConfidence(params: {
  evidenceIds: string[];
  sourceCount: number;
  timestampMs: number;
  missingEvidence?: string[];
  hasConflictingEvidence?: boolean;
  verifiedAtMs?: number;
}): EvidenceConfidence {
  const now = Date.now();
  const hoursOld = (now - params.timestampMs) / (1000 * 60 * 60);

  let score = 0.5;

  if (params.sourceCount >= 5) score += 0.20;
  else if (params.sourceCount >= 3) score += 0.12;
  else if (params.sourceCount >= 1) score += 0.05;

  if (hoursOld < 1) score += 0.10;
  else if (hoursOld < 24) score += 0.05;
  else if (hoursOld > 168) score -= 0.10;
  else if (hoursOld > 720) score -= 0.20;

  const missing = params.missingEvidence || [];
  if (missing.length > 0) score -= missing.length * 0.05;

  if (params.hasConflictingEvidence) score -= 0.15;

  return {
    score: Math.max(0, Math.min(1, Math.round(score * 100) / 100)),
    evidenceIds: params.evidenceIds,
    sourceCount: params.sourceCount,
    dataFreshnessHours: Math.round(hoursOld),
    missingEvidence: missing,
    hasConflictingEvidence: params.hasConflictingEvidence || false,
    lastVerifiedAt: params.verifiedAtMs || params.timestampMs,
    computedAt: now,
  };
}

export interface ReasoningChain {
  summary: string;
  supportingEvidence: string[];
  confidenceFactors: Array<{ factor: string; contribution: number }>;
  missingEvidence: string[];
  conflictingEvidence: string[];
  hasConflictingEvidence: boolean;
  decisionPath: string[];
}

export interface ExplainableRecommendation {
  reasoning: ReasoningChain;
}

export function buildReasoning(params: {
  summary: string;
  evidenceIds: string[];
  confidenceScore: number;
  sourceCount: number;
  dataFreshnessHours: number;
  missingEvidence: string[];
  hasConflictingEvidence: boolean;
  decisionFactors?: string[];
}): ReasoningChain {
  const confidenceFactors: Array<{ factor: string; contribution: number }> = [];

  if (params.sourceCount >= 3) confidenceFactors.push({ factor: 'Multiple data sources', contribution: 0.12 });
  else if (params.sourceCount >= 1) confidenceFactors.push({ factor: 'Single data source', contribution: 0.05 });

  if (params.dataFreshnessHours < 1) confidenceFactors.push({ factor: 'Real-time data', contribution: 0.10 });
  else if (params.dataFreshnessHours < 24) confidenceFactors.push({ factor: 'Recent data (<24h)', contribution: 0.05 });
  else if (params.dataFreshnessHours > 168) confidenceFactors.push({ factor: 'Stale data (>1 week)', contribution: -0.10 });
  else if (params.dataFreshnessHours > 720) confidenceFactors.push({ factor: 'Very stale data (>30 days)', contribution: -0.20 });

  if (params.hasConflictingEvidence) confidenceFactors.push({ factor: 'Conflicting signals detected', contribution: -0.15 });

  const missingCount = params.missingEvidence.length;
  if (missingCount > 0) confidenceFactors.push({ factor: `${missingCount} missing evidence items`, contribution: -0.05 * missingCount });

  return {
    summary: params.summary,
    supportingEvidence: params.evidenceIds,
    confidenceFactors,
    missingEvidence: params.missingEvidence,
    conflictingEvidence: params.hasConflictingEvidence ? ['Contradictory signals present'] : [],
    hasConflictingEvidence: params.hasConflictingEvidence,
    decisionPath: params.decisionFactors || [],
  };
}

export function computeCompositeConfidence(scores: number[], sourceCounts: number[]): number {
  if (scores.length === 0) return 0;
  const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length;
  const avgSources = sourceCounts.length > 0 ? sourceCounts.reduce((s, v) => s + v, 0) / sourceCounts.length : 0;
  const sourceBonus = Math.min(0.1, avgSources * 0.02);
  return Math.round(Math.min(1, avgScore + sourceBonus) * 100) / 100;
}
