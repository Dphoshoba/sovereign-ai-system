// ── Policy Effect ──

export type PolicyEffect = 'allow' | 'deny' | 'require_approval' | 'constrained';

// ── Comparison Operator ──

export type ComparisonOperator = 'eq' | 'neq' | 'in' | 'nin' | 'lt' | 'gt' | 'lte' | 'gte';

// ── Condition ──

export interface Condition {
  readonly field: string;
  readonly operator: ComparisonOperator;
  readonly value: unknown;
}

// ── Policy Rule ──

export interface PolicyRule {
  readonly id: string;
  readonly name: string;
  readonly effect: PolicyEffect;
  readonly conditions: readonly Condition[];
  readonly priority: number;
}

// ── Policy Definition ──

export interface PolicyDefinition {
  readonly policyId: string;
  readonly version: string;
  readonly name: string;
  readonly description: string;
  readonly rules: readonly PolicyRule[];
  readonly createdAt: number;
  readonly enabled: boolean;
}

// ── Evaluation Context ──

export interface EvaluationContext {
  readonly workflowId: string;
  readonly executionId: string;
  readonly workflowClass: string;
  readonly providerId: string | null;
  readonly jurisdiction: string | null;
  readonly estimatedCost: number | null;
  readonly estimatedLatencyMs: number | null;
  readonly planningScore: number | null;
  readonly priority: number | null;
  readonly serviceClass: string | null;
}

// ── Approval Type ──

export type ApprovalType = 'automatic' | 'approval_required' | 'delegated' | 'exception';

// ── Policy Evaluation (single policy) ──

export interface PolicyEvaluation {
  readonly policyId: string;
  readonly policyVersion: string;
  readonly timestamp: number;
  readonly decision: PolicyEffect;
  readonly rationale: string;
  readonly matchedRules: readonly string[];
  readonly applicableRules: readonly string[];
}

// ── Policy Outcome (overall) ──

export interface PolicyOutcome {
  readonly requestId: string;
  readonly timestamp: number;
  readonly evaluations: readonly PolicyEvaluation[];
  readonly overallDecision: PolicyEffect;
  readonly summary: string;
}

// ── Approval Requirement ──

export interface ApprovalRequirement {
  readonly type: ApprovalType;
  readonly required: boolean;
  readonly canDelegate: boolean;
  readonly delegatableTo: readonly string[];
  readonly policyId: string;
  readonly reason: string;
}

// ── Compliance Record ──

export interface ComplianceRecord {
  readonly recordId: string;
  readonly timestamp: number;
  readonly workflowId: string;
  readonly executionId: string;
  readonly policyId: string;
  readonly policyVersion: string;
  readonly decision: PolicyEffect;
  readonly rationale: string;
  readonly matchedRules: readonly string[];
}

// ── Policy Engine ──

export interface PolicyEngine {
  register(policy: PolicyDefinition): void;
  evaluate(context: EvaluationContext): PolicyOutcome;
  evaluateWithApproval(context: EvaluationContext): { outcome: PolicyOutcome; approval: ApprovalRequirement | null };
  getComplianceRecords(workflowId: string): readonly ComplianceRecord[];
}

// ── Policy Engine Error ──

export class PolicyEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PolicyEngineError';
  }
}
