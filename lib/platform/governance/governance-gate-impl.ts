import { OperationalDecision, DecisionAction, ApprovalLevel } from "../execution/autonomous-decision";
import {
  GovernanceGate,
  GovernanceApprovalRequest,
  GovernanceConfig,
  GovernanceVerdict,
  GovernanceGateError,
  OperationalOverride,
  OverrideManager,
  OverrideScope,
  OverrideEffect,
  OverrideManagerError,
} from "./governance-gate";
import { OperationalState } from "../execution/operational-state";

// ── Default Config ──

export const DEFAULT_GOVERNANCE_CONFIG: GovernanceConfig = {
  autoApproveThreshold: 'medium',
  requireApprovalForActions: [],
  escalationTimeoutMs: 300000,
};

// ── Level Hierarchy ──

const LEVEL_RANK: Record<ApprovalLevel, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

function levelExceedsThreshold(level: ApprovalLevel, threshold: ApprovalLevel): boolean {
  return LEVEL_RANK[level] > LEVEL_RANK[threshold];
}

// ── Governance Gate Impl ──

export class GovernanceGateImpl implements GovernanceGate {
  private requests: GovernanceApprovalRequest[] = [];

  constructor(private readonly config: GovernanceConfig = DEFAULT_GOVERNANCE_CONFIG) {}

  evaluate(decision: OperationalDecision): GovernanceApprovalRequest {
    const selected = decision.selectedAction;
    const level = selected.requiredApprovalLevel;
    const action = selected.action;

    let verdict: GovernanceVerdict;
    let rationale: string;

    if (action === 'request_human_approval') {
      verdict = 'pending_approval';
      rationale = 'Action explicitly requires human approval';
    } else if (this.isActionRequiringApproval(action)) {
      verdict = 'pending_approval';
      rationale = `Action '${action}' is configured to require approval`;
    } else if (levelExceedsThreshold(level, this.config.autoApproveThreshold)) {
      verdict = 'pending_approval';
      rationale = `Approval level '${level}' exceeds auto-approve threshold '${this.config.autoApproveThreshold}'`;
    } else {
      verdict = 'auto_approved';
      rationale = `Auto-approved: level '${level}' at or below threshold '${this.config.autoApproveThreshold}'`;
    }

    const request: GovernanceApprovalRequest = {
      id: `gvr-${decision.id}-${Date.now()}`,
      decisionId: decision.id,
      action,
      requiredLevel: level,
      riskScore: selected.riskScore,
      verdict,
      resolvedBy: verdict === 'auto_approved' ? 'system' : '',
      resolvedAt: verdict === 'auto_approved' ? Date.now() : null,
      rationale,
    };

    this.requests.push(request);
    return request;
  }

  approve(requestId: string, by: string, rationale: string): GovernanceApprovalRequest {
    const request = this.findPending(requestId);
    if (!request) throw new GovernanceGateError(`No pending approval request: ${requestId}`);

    const updated: GovernanceApprovalRequest = {
      ...request,
      verdict: 'auto_approved',
      resolvedBy: by,
      resolvedAt: Date.now(),
      rationale,
    };
    this.replaceRequest(requestId, updated);
    return updated;
  }

  deny(requestId: string, by: string, rationale: string): GovernanceApprovalRequest {
    const request = this.findPending(requestId);
    if (!request) throw new GovernanceGateError(`No pending approval request: ${requestId}`);

    const updated: GovernanceApprovalRequest = {
      ...request,
      verdict: 'denied',
      resolvedBy: by,
      resolvedAt: Date.now(),
      rationale,
    };
    this.replaceRequest(requestId, updated);
    return updated;
  }

  getPending(): readonly GovernanceApprovalRequest[] {
    return this.requests.filter(r => r.verdict === 'pending_approval');
  }

  getHistory(): readonly GovernanceApprovalRequest[] {
    return [...this.requests];
  }

  private isActionRequiringApproval(action: DecisionAction): boolean {
    return this.config.requireApprovalForActions.includes(action);
  }

  private findPending(requestId: string): GovernanceApprovalRequest | undefined {
    return this.requests.find(r => r.id === requestId && r.verdict === 'pending_approval');
  }

  private replaceRequest(id: string, updated: GovernanceApprovalRequest): void {
    const idx = this.requests.findIndex(r => r.id === id);
    if (idx >= 0) this.requests[idx] = updated;
  }
}

// ── Override Manager Impl ──

export class OverrideManagerImpl implements OverrideManager {
  private overrides = new Map<string, OperationalOverride>();

  apply(override: OperationalOverride): void {
    this.overrides.set(override.id, override);
  }

  revoke(id: string): void {
    if (!this.overrides.has(id)) throw new OverrideManagerError(`Override not found: ${id}`);
    this.overrides.delete(id);
  }

  getEffective(target: string, scope: OverrideScope): OperationalOverride | undefined {
    const all = this.now();
    const exact = all.find(o => o.scope === scope && o.target === target && !this.isExpired(o));
    if (exact) return exact;
    const global = all.find(o => o.scope === 'global' && o.target === '*' && !this.isExpired(o));
    if (global && (scope === 'action' || scope === 'provider')) return global;
    return undefined;
  }

  getAll(): readonly OperationalOverride[] {
    return [...this.overrides.values()];
  }

  private now(): OperationalOverride[] {
    return [...this.overrides.values()];
  }

  private isExpired(o: OperationalOverride): boolean {
    return o.expiresAt !== null && Date.now() > o.expiresAt;
  }
}
