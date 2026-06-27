export type PolicyChangeRequest = {
  id: string
  policyId: string
  requestedChange: string
  reason: string
  requestedByRoleId: string
  status: "preview-request"
  reviewRequired: true
  persistence: false
  execution: false
}

export function buildPolicyChangeRequests(): PolicyChangeRequest[] {
  return [
    {
      id: "change-tenant-guard-evidence",
      policyId: "policy-tenant-scope-required",
      requestedChange: "Add report-only guard evidence requirements before enforcement.",
      reason: "Prepare tenant boundaries for future audited enforcement.",
      requestedByRoleId: "enterprise-administrator",
      status: "preview-request",
      reviewRequired: true,
      persistence: false,
      execution: false,
    },
    {
      id: "change-shared-knowledge-exception-process",
      policyId: "policy-workspace-isolation",
      requestedChange: "Define shared knowledge exception review before cross-workspace writes.",
      reason: "Prevent accidental cross-workspace leakage.",
      requestedByRoleId: "enterprise-reviewer",
      status: "preview-request",
      reviewRequired: true,
      persistence: false,
      execution: false,
    },
  ]
}

export function evaluateChangeRequestCoverage(
  requests: PolicyChangeRequest[] = buildPolicyChangeRequests()
) {
  const allReviewRequired = requests.every((request) => request.reviewRequired)
  const allPreview = requests.every((request) => request.status === "preview-request")
  const allNonPersistent = requests.every((request) => request.persistence === false)
  const allNonExecuting = requests.every((request) => request.execution === false)
  const checks = [allReviewRequired, allPreview, allNonPersistent, allNonExecuting]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "CHANGE_REQUESTS_PREVIEW_READY" as const,
    requestCount: requests.length,
    persistence: false,
    execution: false,
  }
}

