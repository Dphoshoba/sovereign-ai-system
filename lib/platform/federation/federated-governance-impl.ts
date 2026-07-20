import {
  FederatedGovernance,
  PolicyDomain,
  FederatedPolicyRule,
  PolicyEffect,
  PolicyOverride,
  CrossNodeApprovalChain,
  ApprovalChainStep,
  FederatedPolicyResult,
  FederatedGovernanceError,
} from "./federated-governance";
import { FederationRegistry } from "./federation-registry";

let domainCounter = 0;
let ruleCounter = 0;
let overrideCounter = 0;
let chainCounter = 0;

function nextDomainId(): string { return `dom-${++domainCounter}-${Date.now()}`; }
function nextRuleId(): string { return `rule-${++ruleCounter}-${Date.now()}`; }
function nextOverrideId(): string { return `ovr-${++overrideCounter}-${Date.now()}`; }
function nextChainId(): string { return `chain-${++chainCounter}-${Date.now()}`; }

export class FederatedGovernanceImpl implements FederatedGovernance {
  private domains = new Map<string, PolicyDomain>();
  private rules = new Map<string, FederatedPolicyRule>();
  private overrides = new Map<string, PolicyOverride>();
  private approvalChains = new Map<string, CrossNodeApprovalChain>();

  constructor(private readonly registry: FederationRegistry) {}

  // ── Domain Management ──

  createDomain(name: string, memberNodeIds: readonly string[]): PolicyDomain {
    for (const nid of memberNodeIds) {
      if (!this.registry.getNode(nid)) throw new FederatedGovernanceError(`Node not found: ${nid}`);
    }
    const domain: PolicyDomain = {
      id: nextDomainId(),
      name,
      memberNodeIds: [...memberNodeIds],
      createdAt: Date.now(),
    };
    this.domains.set(domain.id, domain);
    return domain;
  }

  addMember(domainId: string, nodeId: string): void {
    const domain = this.requireDomain(domainId);
    if (!this.registry.getNode(nodeId)) throw new FederatedGovernanceError(`Node not found: ${nodeId}`);
    if (domain.memberNodeIds.includes(nodeId)) return;
    this.domains.set(domainId, { ...domain, memberNodeIds: [...domain.memberNodeIds, nodeId] });
  }

  removeMember(domainId: string, nodeId: string): void {
    const domain = this.requireDomain(domainId);
    this.domains.set(domainId, { ...domain, memberNodeIds: domain.memberNodeIds.filter(n => n !== nodeId) });
  }

  getDomain(domainId: string): PolicyDomain | undefined {
    return this.domains.get(domainId);
  }

  listDomains(): readonly PolicyDomain[] {
    return [...this.domains.values()];
  }

  getDomainsForNode(nodeId: string): readonly PolicyDomain[] {
    return [...this.domains.values()].filter(d => d.memberNodeIds.includes(nodeId));
  }

  // ── Policies ──

  addPolicy(
    domainId: string,
    description: string,
    effect: PolicyEffect,
    scope: 'workflow_type' | 'capability' | 'data_scope',
    pattern: string,
    priority: number,
  ): FederatedPolicyRule {
    this.requireDomain(domainId);
    const rule: FederatedPolicyRule = {
      id: nextRuleId(),
      domainId,
      description,
      effect,
      scope,
      pattern,
      priority,
    };
    this.rules.set(rule.id, rule);
    return rule;
  }

  removePolicy(ruleId: string): void {
    if (!this.rules.has(ruleId)) throw new FederatedGovernanceError(`Policy rule not found: ${ruleId}`);
    this.rules.delete(ruleId);
  }

  getPolicies(domainId: string): readonly FederatedPolicyRule[] {
    return [...this.rules.values()].filter(r => r.domainId === domainId);
  }

  // ── Overrides ──

  setOverride(
    domainId: string,
    nodeId: string,
    ruleId: string,
    newEffect: PolicyEffect,
    reason: string,
    setBy: string,
  ): PolicyOverride {
    this.requireDomain(domainId);
    if (!this.registry.getNode(nodeId)) throw new FederatedGovernanceError(`Node not found: ${nodeId}`);
    if (!this.rules.has(ruleId)) throw new FederatedGovernanceError(`Rule not found: ${ruleId}`);
    const override: PolicyOverride = {
      id: nextOverrideId(),
      domainId,
      nodeId,
      ruleId,
      newEffect,
      reason,
      setBy,
      setAt: Date.now(),
    };
    this.overrides.set(override.id, override);
    return override;
  }

  removeOverride(overrideId: string): void {
    if (!this.overrides.has(overrideId)) throw new FederatedGovernanceError(`Override not found: ${overrideId}`);
    this.overrides.delete(overrideId);
  }

  getOverrides(domainId: string, nodeId: string): readonly PolicyOverride[] {
    return [...this.overrides.values()].filter(o => o.domainId === domainId && o.nodeId === nodeId);
  }

  // ── Evaluation ──

  evaluateAction(nodeId: string, workflowType: string, capability: string): FederatedPolicyResult {
    const domains = this.getDomainsForNode(nodeId);
    if (domains.length === 0) {
      return {
        decision: 'allowed',
        matchedRules: [],
        appliedOverrides: [],
        violations: [],
        requiresApprovalChain: false,
      };
    }

    const matchedRules: string[] = [];
    const appliedOverrides: string[] = [];
    const violations: string[] = [];
    let effectiveDecision: 'allowed' | 'denied' | 'require_approval' = 'allowed';

    for (const domain of domains) {
      const rules = this.getPolicies(domain.id)
        .filter(r => r.scope === 'workflow_type' && this.matchesGlob(r.pattern, workflowType))
        .sort((a, b) => b.priority - a.priority);

      for (const rule of rules) {
        matchedRules.push(rule.id);
        const override = this.findOverride(domain.id, nodeId, rule.id);
        const effect = override ? override.newEffect : rule.effect;

        if (override) appliedOverrides.push(override.id);

        switch (effect) {
          case 'deny':
            violations.push(`Denied by rule '${rule.description}' in domain '${domain.name}'`);
            effectiveDecision = 'denied';
            break;
          case 'require_approval':
            if (effectiveDecision !== 'deny') effectiveDecision = 'require_approval';
            break;
          case 'allow':
            if (effectiveDecision === 'denied') break; // deny already set, skip
            effectiveDecision = 'allowed';
            break;
        }
        break; // first (highest priority) rule wins
      }
    }

    const requiresApprovalChain = effectiveDecision === 'require_approval';

    return {
      decision: effectiveDecision === 'require_approval' ? 'requires_approval' : effectiveDecision,
      matchedRules,
      appliedOverrides,
      violations,
      requiresApprovalChain,
    };
  }

  // ── Approval Chains ──

  createApprovalChain(
    correlationId: string,
    workflowType: string,
    initiatingNode: string,
    requiredNodes: readonly string[],
  ): CrossNodeApprovalChain {
    const steps: ApprovalChainStep[] = requiredNodes.map((nodeId, idx) => ({
      index: idx,
      nodeId,
      status: 'pending',
      approvedBy: null,
      approvedAt: null,
      rationale: null,
    }));

    const chain: CrossNodeApprovalChain = {
      id: nextChainId(),
      correlationId,
      workflowType,
      initiatingNode,
      steps,
      status: 'pending',
      createdAt: Date.now(),
      completedAt: null,
    };

    this.approvalChains.set(chain.id, chain);
    return chain;
  }

  approveStep(chainId: string, nodeId: string, approvedBy: string, rationale: string): CrossNodeApprovalChain {
    const chain = this.getApprovalChainOrThrow(chainId);
    const steps = chain.steps.map(s =>
      s.nodeId === nodeId && s.status === 'pending'
        ? { ...s, status: 'approved' as const, approvedBy, approvedAt: Date.now(), rationale }
        : s,
    );

    const allApproved = steps.every(s => s.status === 'approved');
    const anyDenied = steps.some(s => s.status === 'denied');
    const newStatus: 'pending' | 'approved' | 'denied' = allApproved ? 'approved' : anyDenied ? 'denied' : 'pending';

    const updated: CrossNodeApprovalChain = {
      ...chain,
      steps,
      status: newStatus,
      completedAt: newStatus !== 'pending' ? Date.now() : null,
    };
    this.approvalChains.set(chain.id, updated);
    return updated;
  }

  denyStep(chainId: string, nodeId: string, deniedBy: string, rationale: string): CrossNodeApprovalChain {
    const chain = this.getApprovalChainOrThrow(chainId);
    const steps = chain.steps.map(s =>
      s.nodeId === nodeId && s.status === 'pending'
        ? { ...s, status: 'denied' as const, approvedBy: deniedBy, approvedAt: Date.now(), rationale }
        : s,
    );

    const updated: CrossNodeApprovalChain = {
      ...chain,
      steps,
      status: 'denied',
      completedAt: Date.now(),
    };
    this.approvalChains.set(chain.id, updated);
    return updated;
  }

  getApprovalChain(chainId: string): CrossNodeApprovalChain | undefined {
    return this.approvalChains.get(chainId);
  }

  getPendingApprovals(nodeId: string): readonly CrossNodeApprovalChain[] {
    return [...this.approvalChains.values()].filter(
      c => c.status === 'pending' && c.steps.some(s => s.nodeId === nodeId && s.status === 'pending'),
    );
  }

  // ── Internals ──

  private requireDomain(domainId: string): PolicyDomain {
    const d = this.domains.get(domainId);
    if (!d) throw new FederatedGovernanceError(`Domain not found: ${domainId}`);
    return d;
  }

  private getApprovalChainOrThrow(chainId: string): CrossNodeApprovalChain {
    const c = this.approvalChains.get(chainId);
    if (!c) throw new FederatedGovernanceError(`Approval chain not found: ${chainId}`);
    return c;
  }

  private findOverride(domainId: string, nodeId: string, ruleId: string): PolicyOverride | undefined {
    return [...this.overrides.values()].find(
      o => o.domainId === domainId && o.nodeId === nodeId && o.ruleId === ruleId,
    );
  }

  private matchesGlob(pattern: string, value: string): boolean {
    if (pattern === '*') return true;
    if (pattern.endsWith('*')) return value.startsWith(pattern.slice(0, -1));
    return pattern === value;
  }
}
