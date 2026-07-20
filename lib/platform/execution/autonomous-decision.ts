import { DependencyImpact, LayerHealth, OperationalState } from "./operational-state";

// ── Decision Action ──

export type DecisionAction =
  | 'no_action'
  | 'monitor'
  | 'notify'
  | 'pause_workflows'
  | 'initiate_recovery'
  | 'request_human_approval';

// ── Approval Level ──

export type ApprovalLevel = 'none' | 'low' | 'medium' | 'high';

// ── Triggering State ──

export interface TriggeringState {
  readonly operationalState: OperationalState;
  readonly overallScore: number;
  readonly activeImpacts: readonly DependencyImpact[];
  readonly layerHealth: readonly LayerHealth[];
}

// ── Risk Factor ──

export interface RiskFactor {
  readonly name: string;
  readonly score: number;
  readonly severity: string;
  readonly description: string;
}

// ── Risk Assessment ──

export interface RiskAssessment {
  readonly overallRisk: number;
  readonly factors: readonly RiskFactor[];
}

// ── Action Candidate ──

export interface ActionCandidate {
  readonly action: DecisionAction;
  readonly confidence: number;
  readonly rationale: string;
  readonly riskScore: number;
  readonly requiredApprovalLevel: ApprovalLevel;
  readonly rejected: boolean;
  readonly rejectionReason: string | null;
}

// ── Decision Audit Record ──

export interface DecisionAuditRecord {
  readonly decisionId: string;
  readonly timestamp: number;
  readonly inputs: {
    readonly operationalState: string;
    readonly activeImpacts: number;
    readonly layerHealthCount: number;
  };
  readonly evaluatedRules: readonly string[];
  readonly selectedAction: string;
  readonly rejectedAlternatives: readonly string[];
  readonly confidence: number;
  readonly policyReferences: readonly string[];
}

// ── Operational Decision ──

export interface OperationalDecision {
  readonly id: string;
  readonly timestamp: number;
  readonly triggeringState: TriggeringState;
  readonly selectedAction: ActionCandidate;
  readonly alternatives: readonly ActionCandidate[];
  readonly riskAssessment: RiskAssessment;
  readonly policyReferences: readonly string[];
  readonly auditRecord: DecisionAuditRecord;
}

// ── Autonomous Decision Engine ──

export interface AutonomousDecisionEngine {
  evaluate(state: TriggeringState): OperationalDecision;
}

export class AutonomousDecisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AutonomousDecisionError';
  }
}
