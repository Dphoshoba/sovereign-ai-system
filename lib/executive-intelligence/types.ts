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
}

export interface EscalatedRisk {
  id: string;
  office: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  raisedAt: number;
}

export interface ExecutiveSnapshot {
  snapshotId: string;
  timestamp: number;
  offices: Record<string, OfficeStatus>;
  pendingDecisions: PendingDecision[];
  escalatedRisks: EscalatedRisk[];
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

export interface ExecutiveBriefing {
  summary: string;
  organizationHealth: { overall: OfficeHealth; offices: Record<string, OfficeHealth> };
  priorities: string[];
  activeRisks: EscalatedRisk[];
  blockedItems: { office: string; blockers: string[] }[];
  pendingDecisions: PendingDecision[];
  kpiTrends: { improving: KpiTrend[]; declining: KpiTrend[] };
  recommendations: EISRecommendation[];
  officeStatus: Record<string, OfficeStatus>;
  metadata: EISMetadata;
}
