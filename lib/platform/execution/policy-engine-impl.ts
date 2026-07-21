import {
  ApprovalRequirement,
  ApprovalType,
  ComparisonOperator,
  ComplianceRecord,
  Condition,
  EvaluationContext,
  PolicyDefinition,
  PolicyEffect,
  PolicyEngine,
  PolicyEngineError,
  PolicyEvaluation,
  PolicyOutcome,
  PolicyRule,
} from "./policy-engine";

const EFFECT_PRIORITY: Record<PolicyEffect, number> = {
  deny: 4,
  require_approval: 3,
  constrained: 2,
  allow: 1,
};

let nextRecordId = 1;

export class PolicyEngineImpl implements PolicyEngine {
  private policies = new Map<string, PolicyDefinition>();
  private complianceRecords: ComplianceRecord[] = [];

  // ── 6D.1 — Declarative Policy Model ──

  register(policy: PolicyDefinition): void {
    if (policy.rules.length === 0) {
      throw new PolicyEngineError(`Policy '${policy.policyId}' has no rules`);
    }
    const hasDuplicateIds = new Set(policy.rules.map((r) => r.id)).size !== policy.rules.length;
    if (hasDuplicateIds) {
      throw new PolicyEngineError(`Policy '${policy.policyId}' has duplicate rule IDs`);
    }
    this.policies.set(policy.policyId, policy);
  }

  // ── 6D.2 — Runtime Policy Evaluation ──

  evaluate(context: EvaluationContext): PolicyOutcome {
    const timestamp = Date.now();
    const requestId = `eval-${context.executionId}-${timestamp}`;

    const evaluations: PolicyEvaluation[] = [];
    const enabledPolicies = Array.from(this.policies.values()).filter((p) => p.enabled);

    if (enabledPolicies.length === 0) {
      return {
        requestId,
        timestamp,
        evaluations: [],
        overallDecision: 'allow',
        summary: 'No enabled policies — default allow',
      };
    }

    for (const policy of enabledPolicies) {
      const evaluation = this.evaluateSinglePolicy(policy, context, timestamp);
      evaluations.push(evaluation);
    }

    const overallDecision = this.resolveOverallDecision(evaluations.map((e) => e.decision));
    const summary = this.buildSummary(overallDecision, evaluations);

    // 6D.3 — Compliance records
    for (const evaluation of evaluations) {
      this.complianceRecords.push({
        recordId: `cr-${nextRecordId++}`,
        timestamp: evaluation.timestamp,
        workflowId: context.workflowId,
        executionId: context.executionId,
        policyId: evaluation.policyId,
        policyVersion: evaluation.policyVersion,
        decision: evaluation.decision,
        rationale: evaluation.rationale,
        matchedRules: [...evaluation.matchedRules],
      });
    }

    return { requestId, timestamp, evaluations, overallDecision, summary };
  }

  // ── 6D.4 — Approval Framework ──

  evaluateWithApproval(context: EvaluationContext): { outcome: PolicyOutcome; approval: ApprovalRequirement | null } {
    const outcome = this.evaluate(context);

    const requiresApproval = outcome.evaluations.find((e) => e.decision === 'require_approval');
    if (!requiresApproval) {
      return { outcome, approval: null };
    }

    const policy = this.policies.get(requiresApproval.policyId);
    const approval: ApprovalRequirement = {
      type: 'approval_required',
      required: true,
      canDelegate: true,
      delegatableTo: ['governance_admin', 'workflow_owner'],
      policyId: requiresApproval.policyId,
      reason: requiresApproval.rationale,
    };

    return { outcome, approval };
  }

  // ── Compliance ──

  getComplianceRecords(workflowId: string): readonly ComplianceRecord[] {
    return this.complianceRecords.filter((r) => r.workflowId === workflowId);
  }

  // ── Internal ──

  private evaluateSinglePolicy(
    policy: PolicyDefinition,
    context: EvaluationContext,
    timestamp: number,
  ): PolicyEvaluation {
    const matchedRules: string[] = [];
    const applicableRules: string[] = policy.rules.map((r) => r.id);

    // Find all matching rules, pick highest priority
    let highestPriorityMatch: PolicyRule | null = null;

    for (const rule of policy.rules) {
      const allConditionsMet = rule.conditions.every((c) => this.evaluateCondition(c, context));
      if (allConditionsMet) {
        matchedRules.push(rule.id);
        if (!highestPriorityMatch || rule.priority > highestPriorityMatch.priority) {
          highestPriorityMatch = rule;
        }
      }
    }

    if (!highestPriorityMatch) {
      return {
        policyId: policy.policyId,
        policyVersion: policy.version,
        timestamp,
        decision: 'allow',
        rationale: `No matching rules in policy '${policy.name}' — default allow`,
        matchedRules: [],
        applicableRules,
      };
    }

    const rationale = this.buildRuleRationale(highestPriorityMatch, matchedRules);
    return {
      policyId: policy.policyId,
      policyVersion: policy.version,
      timestamp,
      decision: highestPriorityMatch.effect,
      rationale,
      matchedRules,
      applicableRules,
    };
  }

  private evaluateCondition(condition: Condition, context: EvaluationContext): boolean {
    const contextValue = (context as unknown as Record<string, unknown>)[condition.field];
    return this.compare(contextValue, condition.operator, condition.value);
  }

  private compare(actual: unknown, operator: ComparisonOperator, expected: unknown): boolean {
    switch (operator) {
      case 'eq':
        return actual === expected;
      case 'neq':
        return actual !== expected;
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'nin':
        return Array.isArray(expected) && !expected.includes(actual);
      case 'lt':
        return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
      case 'gt':
        return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
      case 'lte':
        return typeof actual === 'number' && typeof expected === 'number' && actual <= expected;
      case 'gte':
        return typeof actual === 'number' && typeof expected === 'number' && actual >= expected;
    }
  }

  private resolveOverallDecision(decisions: PolicyEffect[]): PolicyEffect {
    let highest: PolicyEffect = 'allow';
    for (const d of decisions) {
      if (EFFECT_PRIORITY[d] > EFFECT_PRIORITY[highest]) {
        highest = d;
      }
    }
    return highest;
  }

  private buildSummary(decision: PolicyEffect, evaluations: PolicyEvaluation[]): string {
    const matched = evaluations.filter((e) => e.matchedRules.length > 0);
    if (matched.length === 0) {
      return `No policies matched — decision: ${decision}`;
    }
    return `${matched.length} policy(s) matched — decision: ${decision}`;
  }

  private buildRuleRationale(rule: PolicyRule, matchedRuleIds: string[]): string {
    return `Rule '${rule.name}' (${rule.id}) matched with effect: ${rule.effect}`;
  }
}
