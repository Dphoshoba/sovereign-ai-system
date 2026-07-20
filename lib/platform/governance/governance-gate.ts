import { OperationalDecision, DecisionAction, ApprovalLevel } from "../execution/autonomous-decision";
import { OperationalState } from "../execution/operational-state";

// ── Governance Verdict ──

export type GovernanceVerdict = 'auto_approved' | 'pending_approval' | 'denied';

// ── Approval Request ──

export interface GovernanceApprovalRequest {
  readonly id: string;
  readonly decisionId: string;
  readonly action: DecisionAction;
  readonly requiredLevel: ApprovalLevel;
  readonly riskScore: number;
  readonly verdict: GovernanceVerdict;
  readonly resolvedBy: string;
  readonly resolvedAt: number | null;
  readonly rationale: string;
}

// ── Governance Config ──

export interface GovernanceConfig {
  readonly autoApproveThreshold: ApprovalLevel;
  readonly requireApprovalForActions: readonly DecisionAction[];
  readonly escalationTimeoutMs: number;
}

// ── Governance Gate ──

export interface GovernanceGate {
  evaluate(decision: OperationalDecision): GovernanceApprovalRequest;
  approve(requestId: string, by: string, rationale: string): GovernanceApprovalRequest;
  deny(requestId: string, by: string, rationale: string): GovernanceApprovalRequest;
  getPending(): readonly GovernanceApprovalRequest[];
  getHistory(): readonly GovernanceApprovalRequest[];
}

// ── Override ──

export type OverrideScope = 'action' | 'provider' | 'global';

export type OverrideEffect = 'allow' | 'block' | 'force_state';

export interface OperationalOverride {
  readonly id: string;
  readonly scope: OverrideScope;
  readonly target: string;
  readonly effect: OverrideEffect;
  readonly forceState?: OperationalState;
  readonly reason: string;
  readonly setBy: string;
  readonly setAt: number;
  readonly expiresAt: number | null;
}

// ── Override Manager ──

export interface OverrideManager {
  apply(override: OperationalOverride): void;
  revoke(id: string): void;
  getEffective(target: string, scope: OverrideScope): OperationalOverride | undefined;
  getAll(): readonly OperationalOverride[];
}

// ── Errors ──

export class GovernanceGateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GovernanceGateError';
  }
}

export class OverrideManagerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OverrideManagerError';
  }
}
