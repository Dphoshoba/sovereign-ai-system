export type ApprovalDelegationRule = {
  id: string
  fromRoleId: string
  toRoleId: string
  scope: "review-only" | "domain-review"
  maxRisk: "low" | "medium"
  canApproveExecution: false
  persistence: false
}

export function buildApprovalDelegationRules(): ApprovalDelegationRule[] {
  return [
    {
      id: "admin-to-reviewer-review-delegation",
      fromRoleId: "enterprise-administrator",
      toRoleId: "enterprise-reviewer",
      scope: "review-only",
      maxRisk: "medium",
      canApproveExecution: false,
      persistence: false,
    },
    {
      id: "admin-to-research-lead-domain-delegation",
      fromRoleId: "enterprise-administrator",
      toRoleId: "research-lead",
      scope: "domain-review",
      maxRisk: "medium",
      canApproveExecution: false,
      persistence: false,
    },
    {
      id: "admin-to-content-strategist-domain-delegation",
      fromRoleId: "enterprise-administrator",
      toRoleId: "content-strategist",
      scope: "domain-review",
      maxRisk: "medium",
      canApproveExecution: false,
      persistence: false,
    },
  ]
}

export function evaluateDelegationCoverage(
  rules: ApprovalDelegationRule[] = buildApprovalDelegationRules()
) {
  const allNonExecuting = rules.every((rule) => rule.canApproveExecution === false)
  const allNonPersistent = rules.every((rule) => rule.persistence === false)
  const hasReviewDelegation = rules.some((rule) => rule.scope === "review-only")
  const hasDomainDelegation = rules.some((rule) => rule.scope === "domain-review")
  const checks = [allNonExecuting, allNonPersistent, hasReviewDelegation, hasDomainDelegation]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "DELEGATION_PREVIEW_READY_EXECUTION_BLOCKED" as const,
    delegationCount: rules.length,
    execution: false,
    persistence: false,
  }
}

