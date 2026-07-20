export type OfficeName = 'Executive Office' | 'Research Office' | 'Product Office' | 'Operations Office' | 'Knowledge Office';

export interface OperationalRecord extends Record<string, unknown> {
  id: string;
  initiativeId: string;
  correlationId: string;
  createdAt: number;
  createdByOffice: OfficeName;
  version: number;
}

export type ObjectivePriority = 'low' | 'medium' | 'high' | 'critical';

export interface ExecutiveObjective extends OperationalRecord {
  objective: string;
  successMetrics: string[];
  priority: ObjectivePriority;
  approvedBy: string;
  approvedAt: number;
}

export interface ResearchOutcome extends OperationalRecord {
  evidenceSummary: string;
  supportingRationale: string[];
  assumptions: string[];
  identifiedRisks: string[];
  researchId: string;
  confidence: number;
}

export type InitiativeStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface ProductInitiative extends OperationalRecord {
  initiativeName: string;
  roadmapItem: string;
  dependencies: string[];
  acceptanceCriteria: string[];
  status: InitiativeStatus;
  targetDate: number;
}

export type ExecutionState = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'failed';

export interface OperationalExecution extends OperationalRecord {
  tasksExecuted: string[];
  incidents: string[];
  blockers: string[];
  completionState: ExecutionState;
  startedAt: number;
  completedAt: number | null;
  artifacts: string[];
}

export interface KnowledgeRecord extends OperationalRecord {
  decisions: string[];
  outcomes: string[];
  retrospectives: string[];
  reusableGuidance: string[];
  relatedRecords: string[];
  nextAction: string | null;
}
