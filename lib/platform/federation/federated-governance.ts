import { FederationRegistry } from "./federation-registry";

// ── Policy Domain ──

export interface PolicyDomain {
  readonly id: string;
  readonly name: string;
  readonly memberNodeIds: readonly string[];
  readonly createdAt: number;
}

// ── Policy Effect ──

export type PolicyEffect = 'allow' | 'deny' | 'require_approval';

// ── Policy Rule ──

export interface FederatedPolicyRule {
  readonly id: string;
  readonly domainId: string;
  readonly description: string;
  readonly effect: PolicyEffect;
  readonly scope: 'workflow_type' | 'capability' | 'data_scope';
  readonly pattern: string;
  readonly priority: number;
}

// ── Policy Override ──

export interface PolicyOverride {
  readonly id: string;
  readonly domainId: string;
  readonly nodeId: string;
  readonly ruleId: string;
  readonly newEffect: PolicyEffect;
  readonly reason: string;
  readonly setBy: string;
  readonly setAt: number;
}

// ── Approval Chain ──

export interface ApprovalChainStep {
  readonly index: number;
  readonly nodeId: string;
  readonly status: 'pending' | 'approved' | 'denied';
  readonly approvedBy: string | null;
  readonly approvedAt: number | null;
  readonly rationale: string | null;
}

export interface CrossNodeApprovalChain {
  readonly id: string;
  readonly correlationId: string;
  readonly workflowType: string;
  readonly initiatingNode: string;
  readonly steps: readonly ApprovalChainStep[];
  readonly status: 'pending' | 'approved' | 'denied';
  readonly createdAt: number;
  readonly completedAt: number | null;
}

// ── Policy Result ──

export interface FederatedPolicyResult {
  readonly decision: 'allowed' | 'denied' | 'requires_approval';
  readonly matchedRules: readonly string[];
  readonly appliedOverrides: readonly string[];
  readonly violations: readonly string[];
  readonly requiresApprovalChain: boolean;
}

// ── Federated Governance ──

export interface FederatedGovernance {
  createDomain(name: string, memberNodeIds: readonly string[]): PolicyDomain;
  addMember(domainId: string, nodeId: string): void;
  removeMember(domainId: string, nodeId: string): void;
  getDomain(domainId: string): PolicyDomain | undefined;
  listDomains(): readonly PolicyDomain[];
  getDomainsForNode(nodeId: string): readonly PolicyDomain[];

  addPolicy(domainId: string, description: string, effect: PolicyEffect, scope: 'workflow_type' | 'capability' | 'data_scope', pattern: string, priority: number): FederatedPolicyRule;
  removePolicy(ruleId: string): void;
  getPolicies(domainId: string): readonly FederatedPolicyRule[];

  setOverride(domainId: string, nodeId: string, ruleId: string, newEffect: PolicyEffect, reason: string, setBy: string): PolicyOverride;
  removeOverride(overrideId: string): void;
  getOverrides(domainId: string, nodeId: string): readonly PolicyOverride[];

  evaluateAction(nodeId: string, workflowType: string, capability: string): FederatedPolicyResult;

  createApprovalChain(correlationId: string, workflowType: string, initiatingNode: string, requiredNodes: readonly string[]): CrossNodeApprovalChain;
  approveStep(chainId: string, nodeId: string, approvedBy: string, rationale: string): CrossNodeApprovalChain;
  denyStep(chainId: string, nodeId: string, deniedBy: string, rationale: string): CrossNodeApprovalChain;
  getApprovalChain(chainId: string): CrossNodeApprovalChain | undefined;
  getPendingApprovals(nodeId: string): readonly CrossNodeApprovalChain[];
}

// ── Error ──

export class FederatedGovernanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FederatedGovernanceError';
  }
}
