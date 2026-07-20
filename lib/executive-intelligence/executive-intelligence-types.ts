export type DecisionStatus = 'proposed' | 'discussed' | 'approved' | 'implemented' | 'reviewed' | 'closed';

export type DecisionCategory = 'strategic' | 'operational' | 'governance' | 'investment' | 'architectural';

export type ForecastType = 'projection' | 'forecast' | 'scenario';

export interface ExecutiveDecision {
  id: string;
  title: string;
  description: string;
  category: DecisionCategory;
  status: DecisionStatus;
  proposedBy: string;
  proposedAt: number;
  evidenceIds: string[];
  rationale: string;
  expectedOutcome: string;
  actualOutcome?: string;
  approvedBy?: string;
  approvedAt?: number;
  discussedAt?: number;
  implementedAt?: number;
  reviewedAt?: number;
  closedAt?: number;
  version: number;
  supersedes?: string;
  supersededBy?: string;
}

export interface EnterpriseHealth {
  overallScore: number;
  portfolioHealth: number;
  resourceHealth: number;
  governanceHealth: number;
  learningHealth: number;
  strategicHealth: number;
  assessedAt: number;
  evidenceIds: string[];
}

export interface StrategicIndicator {
  id: string;
  title: string;
  value: number;
  trend: 'improving' | 'stable' | 'declining';
  target: number;
  category: string;
  evidenceIds: string[];
  lastUpdated: number;
}

export interface KpiSnapshot {
  id: string;
  title: string;
  value: number;
  target: number;
  variance: number;
  confidence: number;
  category: string;
  timestamp: number;
}

export interface ForecastProjection {
  id: string;
  type: ForecastType;
  title: string;
  description: string;
  value: number;
  confidence: number;
  horizon: string;
  assumptions: string[];
  evidenceIds: string[];
  generatedAt: number;
}

export interface DecisionQuality {
  totalDecisions: number;
  approvedDecisions: number;
  implementedDecisions: number;
  reviewedDecisions: number;
  averageTimeToDecision: number;
  decisionsByCategory: Record<string, number>;
  overdueDecisions: number;
}

export interface GovernanceBottleneck {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedDecisions: number;
  averageDelay: number;
  recommendation: string;
  evidenceIds: string[];
}

export interface ExecutiveIntelligenceBriefing {
  enterpriseHealth: EnterpriseHealth;
  kpiSnapshots: KpiSnapshot[];
  strategicIndicators: StrategicIndicator[];
  portfolioStatus: string;
  recentDecisions: ExecutiveDecision[];
  decisionQuality: DecisionQuality;
  governanceBottlenecks: GovernanceBottleneck[];
  forecasts: ForecastProjection[];
  requiredExecutiveDecisions: Array<{ id: string; decision: string; rationale: string; priority: number }>;
  evidenceReferences: string[];
  generatedAt: number;
}
