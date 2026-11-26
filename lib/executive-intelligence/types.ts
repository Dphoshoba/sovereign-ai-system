export type OfficeHealth = 'healthy' | 'attention' | 'critical' | 'unknown';

export interface OfficeStatus {
  office: string;
  health: OfficeHealth;
  agentCount: number;
  activeTasks: number;
  blockers: string[];
  recentChanges: string[];
}

export interface PendingDecision {
  id: string;
  office: string;
  actionType: string;
  requestedAt: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  requiredApprover: string;
  rationale: string;
  status: 'pending' | 'approved' | 'denied' | 'escalated';
}

export interface EscalatedRisk {
  id: string;
  office: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  raisedAt: number;
}

export interface CrossOfficeDependency {
  id: string;
  sourceOffice: string;
  targetOffice: string;
  description: string;
  status: 'active' | 'blocked' | 'resolved';
}

export interface ExecutiveSnapshot {
  snapshotId: string;
  timestamp: number;
  offices: Record<string, OfficeStatus>;
  pendingDecisions: PendingDecision[];
  escalatedRisks: EscalatedRisk[];
  crossOfficeDependencies: CrossOfficeDependency[];
}

// ── Milestone 3: Pattern Intelligence ──

export type PatternType = 'recurring_blocker' | 'governance_bottleneck' | 'research_without_downstream' | 'incident_cluster';
export type PatternSeverity = 'info' | 'warning' | 'critical';

export interface OrganizationalPattern {
  id: string;
  type: PatternType;
  description: string;
  severity: PatternSeverity;
  affectedOffices: string[];
  occurrences: number;
  firstObserved: number;
  lastObserved: number;
  evidence: string[];
}

// ── Milestone 3: Recommendation Engine ──

export type RecommendationCategory = 'resolve_blocker' | 'review_decision' | 'clear_dependency' | 'address_risk' | 'investigate_trend';

export interface StructuredRecommendation {
  id: string;
  rank: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: RecommendationCategory;
  action: string;
  reason: string;
  expectedBenefit: string;
  suggestedOwner: string;
  supportingEvidence: string[];
  confidence: number;
  score: number;
}

// ── Milestone 3: Delta Engine ──

export interface ExecutiveDelta {
  previousSnapshotId: string;
  previousTimestamp: number;
  currentSnapshotId: string;
  currentTimestamp: number;
  newRisks: EscalatedRisk[];
  resolvedRisks: string[];
  newBlockers: { office: string; blocker: string }[];
  resolvedBlockers: { office: string; blocker: string }[];
  newPendingDecisions: PendingDecision[];
  resolvedPendingDecisions: string[];
  officeHealthChanges: {
    office: string;
    previous: OfficeHealth;
    current: OfficeHealth;
  }[];
  newDependencies: CrossOfficeDependency[];
  resolvedDependencies: string[];
  summary: string;
}

// ── Milestone 3: Risk Intelligence ──

export type Likelihood = 'low' | 'medium' | 'high' | 'very_high';
export type OrgImpact = 'contained' | 'office' | 'cross_office' | 'enterprise';
export type RiskTrend = 'improving' | 'stable' | 'worsening';

export interface RiskIntelligence {
  id: string;
  source: EscalatedRisk;
  likelihood: Likelihood;
  organizationalImpact: OrgImpact;
  trend: RiskTrend;
  recommendedOwner: string;
  recommendedAction: string;
  confidence: number;
  rationale: string[];
}

export interface KpiTrend {
  metric: string;
  direction: 'improving' | 'declining' | 'stable';
  currentValue: number;
  previousValue: number;
}

export interface EISRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  reason: string;
  office: string;
}

export interface EISMetadata {
  generatedAt: number;
  snapshotVersion: string;
  confidence: number;
  sources: string[];
}

// ── Milestone 3: Priority Engine ──

export interface ScoreComponents {
  impact: number;
  urgency: number;
  dependencyWeight: number;
  governanceWeight: number;
}

export interface ScoringConfig {
  impactWeight: number;
  urgencyWeight: number;
  dependencyWeight: number;
  governanceWeight: number;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  impactWeight: 0.35,
  urgencyWeight: 0.25,
  dependencyWeight: 0.20,
  governanceWeight: 0.20,
};

export type PriorityCategory = 'risk' | 'blocker' | 'decision' | 'dependency' | 'trend';

export interface RankedPriority {
  id: string;
  rank: number;
  title: string;
  category: PriorityCategory;
  compositeScore: number;
  components: ScoreComponents;
  confidence: number;
  rationale: string[];
  affectedOffices: string[];
  timestamp: number;
}

export interface ExecutiveBriefing {
  summary: string;
  organizationHealth: { overall: OfficeHealth; offices: Record<string, OfficeHealth> };
  priorities: string[];
  rankedPriorities: RankedPriority[];
  riskIntelligence: RiskIntelligence[];
  activeRisks: EscalatedRisk[];
  blockedItems: { office: string; blockers: string[] }[];
  pendingDecisions: PendingDecision[];
  crossOfficeDependencies: CrossOfficeDependency[];
  kpiTrends: { improving: KpiTrend[]; declining: KpiTrend[] };
  recommendations: EISRecommendation[];
  structuredRecommendations: StructuredRecommendation[];
  patterns: OrganizationalPattern[];
  officeStatus: Record<string, OfficeStatus>;
  metadata: EISMetadata;
}
