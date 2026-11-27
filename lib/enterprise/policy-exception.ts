export type PolicyException = {
  id: string
  policyId: string
  exceptionType: "temporary" | "limited-scope" | "emergency-review"
  requestedScope: string
  riskLevel: "medium" | "high" | "critical"
  approvalMode: "review-board-required"
  status: "preview-only"
  persistence: false
  execution: false
}

export function buildPolicyExceptions(): PolicyException[] {
  return [
    {
      id: "shared-knowledge-read-exception",
      policyId: "policy-workspace-isolation",
      exceptionType: "limited-scope",
      requestedScope: "shared knowledge read-only bridge",
      riskLevel: "medium",
      approvalMode: "review-board-required",
      status: "preview-only",
      persistence: false,
      execution: false,
    },
    {
      id: "urgent-policy-review-exception",
      policyId: "policy-publishing-blocked",
      exceptionType: "emergency-review",
      requestedScope: "publication readiness review only",
      riskLevel: "high",
      approvalMode: "review-board-required",
      status: "preview-only",
      persistence: false,
      execution: false,
    },
  ]
}

export function evaluateExceptionCoverage(
  exceptions: PolicyException[] = buildPolicyExceptions()
) {
  const allPreview = exceptions.every((exception) => exception.status === "preview-only")
  const allReviewBoardRequired = exceptions.every(
    (exception) => exception.approvalMode === "review-board-required"
  )
  const allNonPersistent = exceptions.every((exception) => exception.persistence === false)
  const allNonExecuting = exceptions.every((exception) => exception.execution === false)
  const checks = [allPreview, allReviewBoardRequired, allNonPersistent, allNonExecuting]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "EXCEPTIONS_PREVIEW_READY_REVIEW_REQUIRED" as const,
    exceptionCount: exceptions.length,
    persistence: false,
    execution: false,
  }
}

