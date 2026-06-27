import {
  buildEnterprisePolicies,
  type EnterprisePolicy,
} from "./enterprise-policy-model"

export type PolicyIsolationRule = {
  id: string
  policyId: string
  domain: EnterprisePolicy["domain"]
  enforcementMode: "contract-only"
  isolatedFromDomains: EnterprisePolicy["domain"][]
  crossDomainWriteAllowed: false
  reviewRequired: true
}

export function buildPolicyIsolationRules(
  policies: EnterprisePolicy[] = buildEnterprisePolicies()
): PolicyIsolationRule[] {
  const domains = policies.map((policy) => policy.domain)

  return policies.map((policy) => ({
    id: `${policy.id}-isolation`,
    policyId: policy.id,
    domain: policy.domain,
    enforcementMode: "contract-only",
    isolatedFromDomains: domains.filter((domain) => domain !== policy.domain),
    crossDomainWriteAllowed: false,
    reviewRequired: true,
  }))
}

export function evaluatePolicySegregation(
  rules: PolicyIsolationRule[] = buildPolicyIsolationRules()
) {
  const allContractOnly = rules.every(
    (rule) => rule.enforcementMode === "contract-only"
  )
  const noCrossDomainWrites = rules.every(
    (rule) => rule.crossDomainWriteAllowed === false
  )
  const allRequireReview = rules.every((rule) => rule.reviewRequired)
  const checks = [allContractOnly, noCrossDomainWrites, allRequireReview]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "POLICY_SEGREGATION_CONTRACT_READY" as const,
    ruleCount: rules.length,
    noCrossDomainWrites,
    allRequireReview,
  }
}

