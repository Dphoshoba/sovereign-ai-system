import type { PolicyEvaluator, PolicyId, PolicyInput, PolicyResult } from "./policy-types";

function comparePolicies(left: PolicyEvaluator, right: PolicyEvaluator): number {
  if (left.order < right.order) return -1;
  if (left.order > right.order) return 1;
  if (left.id < right.id) return -1;
  if (left.id > right.id) return 1;
  return 0;
}

export class PolicyRegistry {
  private readonly registry = new Map<PolicyId, PolicyEvaluator>();

  register(policy: PolicyEvaluator): void {
    if (this.registry.has(policy.id)) {
      throw new Error(`Duplicate policy registration rejected: ${policy.id}`);
    }
    this.registry.set(policy.id, policy);
  }

  unregister(policyId: PolicyId): boolean {
    return this.registry.delete(policyId);
  }

  get(policyId: PolicyId): PolicyEvaluator | undefined {
    return this.registry.get(policyId);
  }

  list(): PolicyEvaluator[] {
    return [...this.registry.values()].sort(comparePolicies);
  }

  evaluateAll(input: PolicyInput): PolicyResult[] {
    return this.list().map((policy) => policy.evaluate(input));
  }
}
