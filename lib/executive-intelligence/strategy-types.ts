export type Dimension =
  | 'strategicAlignment' | 'resourceUtilization' | 'dependencyRisk'
  | 'governanceImpact' | 'implementationComplexity'
  | 'organizationalConfidence' | 'expectedBenefit';

export type RiskCategory =
  | 'capacity' | 'dependency' | 'governance' | 'metric' | 'knowledge' | 'execution';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type AssumptionStatus = 'active' | 'invalidated' | 'superseded';

export type ScenarioStatus = 'draft' | 'proposed' | 'evaluated' | 'superseded' | 'archived';

export type RoadmapStatus = 'draft' | 'proposed' | 'approved' | 'superseded' | 'archived';

export interface StrategicAssumption {
  id: string;
  title: string;
  description: string;
  version: number;
  evidenceIds: string[];
  confidence: number;
  statement: string;
  invalidationCriteria: string;
  affectedProductIds: string[];
  affectedInitiativeIds: string[];
  status: AssumptionStatus;
  createdAt: number;
  lastValidated: number;
  supersedes?: string;
  supersededBy?: string;
}

export interface EvaluationProfile {
  id: string;
  title: string;
  description: string;
  weights: Record<Dimension, number>;
}

const w = (sa: number, ru: number, dr: number, gi: number, ic: number, oc: number, eb: number): Record<Dimension, number> => ({
  strategicAlignment: sa, resourceUtilization: ru, dependencyRisk: dr,
  governanceImpact: gi, implementationComplexity: ic, organizationalConfidence: oc, expectedBenefit: eb,
});

export const GROWTH_PROFILE: EvaluationProfile = {
  id: 'growth', title: 'Growth Profile', description: 'Maximize new product velocity',
  weights: w(0.25, 0.15, 0.10, 0.10, 0.05, 0.05, 0.30),
};

export const STABILITY_PROFILE: EvaluationProfile = {
  id: 'stability', title: 'Stability Profile', description: 'Reduce technical debt, harden',
  weights: w(0.15, 0.20, 0.25, 0.20, 0.05, 0.05, 0.10),
};

export const EFFICIENCY_PROFILE: EvaluationProfile = {
  id: 'efficiency', title: 'Efficiency Profile', description: 'Optimize cross-product workflows',
  weights: w(0.10, 0.30, 0.10, 0.10, 0.15, 0.10, 0.15),
};

export const BALANCED_PROFILE: EvaluationProfile = {
  id: 'balanced', title: 'Balanced Profile', description: 'Moderate across all dimensions',
  weights: w(0.14, 0.14, 0.14, 0.14, 0.14, 0.15, 0.15),
};

export const ALL_PROFILES = [GROWTH_PROFILE, STABILITY_PROFILE, EFFICIENCY_PROFILE, BALANCED_PROFILE];

export interface StrategicScenario {
  id: string;
  title: string;
  description: string;
  version: number;
  thesis: string;
  assumptionIds: string[];
  evidenceIds: string[];
  initiativeIds: string[];
  productIds: string[];
  status: ScenarioStatus;
  evaluationProfileId: string;
  createdAt: number;
  createdBy: string;
  supersedes?: string;
  supersededBy?: string;
}

export interface DimensionScore {
  dimension: Dimension;
  score: number;
  evidenceIds: string[];
  rationale: string;
}

export interface ScenarioEvaluation {
  id: string;
  scenarioId: string;
  scenarioVersion: number;
  evaluationProfileId: string;
  dimensionScores: DimensionScore[];
  weightedScore: number;
  assumptionVersions: Array<{ assumptionId: string; version: number }>;
  evaluationTimestamp: number;
}

export interface TradeOffComparison {
  id: string;
  evaluatedScenarioIds: string[];
  scenarios: Array<{ scenarioId: string; overallScore: number; strengths: string[]; weaknesses: string[] }>;
  dimensionDeltas: Array<{ dimension: Dimension; scenarioAScore: number; scenarioBScore: number }>;
  keyTradeOffs: string[];
  confidenceSummary: string;
  comparisonTimestamp: number;
}

export interface ScenarioRisk {
  id: string;
  scenarioId: string;
  category: RiskCategory;
  evidence: string[];
  severity: Severity;
  affectedInitiatives: string[];
  mitigationOptions: string[];
  source: string;
}

export interface RoadmapPhase {
  order: number;
  title: string;
  description: string;
  initiativeIds: string[];
  dependencyIds: string[];
  estimatedCapacity: string;
  startAfter: string;
}

export interface EnterpriseRoadmap {
  id: string;
  scenarioId: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  version: number;
  phases: RoadmapPhase[];
  createdAt: number;
  evidenceIds: string[];
}

export interface ConfidenceAnalysis {
  overallConfidence: number;
  assumptionConfidence: number;
  evidenceCoverage: number;
  trackRecordComments: string;
}

export interface ExecutiveDecision {
  id: string;
  scenarioId: string;
  decision: string;
  rationale: string;
  implications: string[];
  recommendedBy: string;
  recommendedAt: number;
}

export interface ExecutivePlanningBrief {
  enterpriseSummary: string;
  strategicScenarios: StrategicScenario[];
  assumptions: StrategicAssumption[];
  evaluationProfiles: EvaluationProfile[];
  tradeOffComparisons: TradeOffComparison[];
  recommendedRoadmaps: EnterpriseRoadmap[];
  risks: ScenarioRisk[];
  confidenceAnalysis: ConfidenceAnalysis;
  requiredExecutiveDecisions: ExecutiveDecision[];
  supportingEvidence: string[];
}
