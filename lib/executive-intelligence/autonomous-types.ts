export type PolicyAction = 'allowable' | 'prohibited';
export type ApprovalThreshold = 'executive' | 'delegated' | 'automatic';
export type PolicyStatus = 'active' | 'superseded';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'delegated';
export type ExecutionStatus = 'draft' | 'proposed' | 'approved' | 'executing' | 'completed' | 'failed' | 'rolled_back';
export type ConnectorType = 'email' | 'calendar' | 'github' | 'cicd' | 'crm' | 'ticketing' | 'notification';
export type PackageStatus = 'pending' | 'approved' | 'executing' | 'completed' | 'failed' | 'rolled_back';
export type AuditEventType = 'policy_evaluated' | 'approval_requested' | 'approval_granted' | 'approval_denied' | 'execution_started' | 'execution_completed' | 'execution_failed' | 'rollback_initiated' | 'rollback_completed' | 'simulation_ran';

export interface PolicyRule {
  id: string;
  action: PolicyAction;
  description: string;
  requiresApproval: boolean;
  approvalThreshold: ApprovalThreshold;
  delegationScope?: string;
  evidenceRequirements: string[];
  status: PolicyStatus;
  version: number;
}

export interface ApprovalRequest {
  id: string;
  actionId: string;
  requestedBy: string;
  requestedAt: number;
  policyId: string;
  evidenceIds: string[];
  rationale: string;
  status: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: number;
  rejectedBy?: string;
  rejectedAt?: number;
  rejectionReason?: string;
  delegationChain: string[];
}

export interface ExecutionStep {
  order: number;
  title: string;
  description: string;
  connectorType: ConnectorType;
  payload: Record<string, string>;
  status: ExecutionStatus;
  rollbackStep?: ExecutionStep;
}

export interface ExecutionPlan {
  id: string;
  title: string;
  description: string;
  steps: ExecutionStep[];
  policyId: string;
  approvalRequestId: string;
  status: ExecutionStatus;
  evidenceIds: string[];
  rollbackStrategy?: string;
  expectedOutcome?: string;
}

export interface ExecutionPackage {
  id: string;
  planId: string;
  steps: ReadonlyArray<ExecutionStep>;
  originatingEvidence: string[];
  governingPolicy: string;
  approvalChain: string[];
  expectedOutcome: string;
  rollbackStrategy: string;
  auditId: string;
  status: PackageStatus;
  createdAt: number;
  executedAt?: number;
  completedAt?: number;
}

export interface AuditRecord {
  id: string;
  packageId: string;
  eventType: AuditEventType;
  timestamp: number;
  actor: string;
  details: string;
  evidenceIds: string[];
}

export interface SimulationResult {
  id: string;
  planId: string;
  scenarioDescription: string;
  outcomeDescription: string;
  affectedSystems: string[];
  risksIdentified: string[];
  policyViolations: string[];
  confidence: number;
  timestamp: number;
}

export interface AutonomousEnterpriseBriefing {
  policySummary: {
    totalPolicies: number;
    activePolicies: number;
    supersededPolicies: number;
  };
  pendingApprovals: ApprovalRequest[];
  pendingExecutions: ExecutionPlan[];
  recentAuditTrail: AuditRecord[];
  simulationResults: SimulationResult[];
  policyCompliance: number;
  generatedAt: number;
}
