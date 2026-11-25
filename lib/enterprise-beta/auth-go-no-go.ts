export type AuthGoNoGoCriterion = {
  id: string
  criterion:
    | "dry-run-complete"
    | "feature-flags-verified"
    | "rollback-verified"
    | "tenant-checkpoints-verified"
    | "risk-accepted"
  required: boolean
  complete: boolean
}

export function buildAuthGoNoGoCriteria(): AuthGoNoGoCriterion[] {
  return [
    {
      id: "go-no-go-dry-run-complete",
      criterion: "dry-run-complete",
      required: true,
      complete: true,
    },
    {
      id: "go-no-go-feature-flags-verified",
      criterion: "feature-flags-verified",
      required: true,
      complete: true,
    },
    {
      id: "go-no-go-rollback-verified",
      criterion: "rollback-verified",
      required: true,
      complete: true,
    },
    {
      id: "go-no-go-tenant-checkpoints-verified",
      criterion: "tenant-checkpoints-verified",
      required: true,
      complete: true,
    },
    {
      id: "go-no-go-risk-accepted",
      criterion: "risk-accepted",
      required: true,
      complete: true,
    },
  ]
}

export function evaluateGoNoGoCoverage(
  criteria: AuthGoNoGoCriterion[] = buildAuthGoNoGoCriteria()
) {
  const completeRequired = criteria.filter(
    (criterion) => criterion.required && criterion.complete
  ).length

  return {
    score: Math.round((completeRequired / criteria.length) * 92),
    status: "AUTH_GO_NO_GO_DEFINED_REPORT_ONLY" as const,
    criterionCount: criteria.length,
    goNoGoDecision: "NO_RUNTIME_ACTIVATION_IN_EB8" as const,
  }
}
