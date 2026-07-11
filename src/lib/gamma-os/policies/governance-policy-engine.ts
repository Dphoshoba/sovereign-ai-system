import type { GovernanceDecision, PolicyDecision } from "../contracts";
import {
  approvalPolicy,
  auditPolicy,
  humanReviewPolicy,
} from "./approval-policy";
import { connectorPolicy } from "./connector-policy";
import {
  autonomousPublishingProhibitedPolicy,
  liveExecutionDefaultDenyPolicy,
  previewOnlyPolicy,
} from "./execution-policy";
import { organizationPolicy } from "./organization-policy";
import { PolicyRegistry } from "./policy-registry";
import { securityPolicy } from "./security-policy";
import type {
  GovernanceEngineResult,
  NormalizedPolicyDecision,
  PolicyEvaluationContext,
  PolicyResult,
} from "./policy-types";

function toPolicyDecision(result: PolicyResult): PolicyDecision {
  return {
    policyId: result.policyId,
    policyName: result.policyId,
    effect: result.blocking ? "deny" : result.severity === "warning" ? "review" : "allow",
    reasons: [result.reason],
    obligations: [result.remediation],
  };
}

function buildGovernanceDecision(
  requestId: string,
  policyResults: PolicyResult[]
): GovernanceDecision {
  const policyDecisions = policyResults.map(toPolicyDecision);
  const blocked = policyResults.some((result) => result.blocking);
  return {
    decisionId: `gov-${requestId}`,
    outcome: blocked ? "denied" : "approved",
    policyDecisions,
    summary: blocked
      ? "Request denied by governance policy evaluation."
      : "Request approved by governance policy evaluation.",
  };
}

function normalizePolicyResults(policyResults: PolicyResult[]): NormalizedPolicyDecision {
  const blocked = policyResults.some((result) => result.blocking);

  const violations = policyResults
    .filter((result) => result.blocking)
    .map((result) => `${result.policyId}: ${result.reason}`);

  const warnings = policyResults
    .filter((result) => !result.blocking && result.severity === "warning")
    .map((result) => `${result.policyId}: ${result.reason}`);

  const remediations = policyResults.map((result) => result.remediation);

  const approvalRequired = policyResults.some(
    (result) => result.flags?.approvalRequired
  );
  const humanReviewRequired = policyResults.some(
    (result) => result.flags?.humanReviewRequired
  );
  const auditRequired = policyResults.some((result) => result.flags?.auditRequired);

  const previewOnly = true;

  return {
    allowed: !blocked,
    blocked,
    approvalRequired,
    humanReviewRequired,
    auditRequired,
    previewOnly,
    violations,
    warnings,
    remediations,
    evaluatedPolicyIds: policyResults.map((result) => result.policyId),
  };
}

export class GovernancePolicyEngine {
  private readonly registry: PolicyRegistry;

  constructor(registry?: PolicyRegistry) {
    this.registry = registry ?? new PolicyRegistry();
  }

  static createDefault(): GovernancePolicyEngine {
    const registry = new PolicyRegistry();

    registry.register(approvalPolicy);
    registry.register(humanReviewPolicy);
    registry.register(auditPolicy);
    registry.register(previewOnlyPolicy);
    registry.register(liveExecutionDefaultDenyPolicy);
    registry.register(autonomousPublishingProhibitedPolicy);
    registry.register(connectorPolicy);
    registry.register(organizationPolicy);
    registry.register(securityPolicy);

    return new GovernancePolicyEngine(registry);
  }

  evaluate(context: PolicyEvaluationContext): GovernanceEngineResult {
    const policyResults = this.registry.evaluateAll({ context });
    const normalized = normalizePolicyResults(policyResults);
    const governanceDecision = buildGovernanceDecision(context.requestId, policyResults);

    return {
      normalized,
      policyResults,
      governanceDecision,
    };
  }
}
