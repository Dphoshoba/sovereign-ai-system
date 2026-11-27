export type EscalationPolicy = {
  id: string
  trigger: string
  threshold: number
  escalationTarget: "operator-review" | "security-review" | "release-board"
  blocksRuntime: boolean
  active: false
}

export function buildEscalationPolicies(): EscalationPolicy[] {
  return [
    {
      id: "escalate-quota-exceeded",
      trigger: "Quota exceeded repeatedly",
      threshold: 3,
      escalationTarget: "operator-review",
      blocksRuntime: true,
      active: false,
    },
    {
      id: "escalate-cross-tenant",
      trigger: "Cross-tenant access attempts",
      threshold: 1,
      escalationTarget: "security-review",
      blocksRuntime: true,
      active: false,
    },
    {
      id: "escalate-publishing-abuse",
      trigger: "Publishing abuse boundary",
      threshold: 1,
      escalationTarget: "release-board",
      blocksRuntime: true,
      active: false,
    },
  ]
}

export function evaluateEscalationReadiness(
  policies: EscalationPolicy[] = buildEscalationPolicies()
) {
  const blocking = policies.filter((policy) => policy.blocksRuntime).length

  return {
    score: Math.round((blocking / policies.length) * 86),
    status: "ESCALATION_THRESHOLDS_DEFINED_NOT_ACTIVE" as const,
    policyCount: policies.length,
    active: false,
  }
}
