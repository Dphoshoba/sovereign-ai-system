export type RetentionPolicy = {
  id: string
  dataClass: "security" | "governance" | "usage" | "operator" | "evidence"
  retentionDays: number
  legalHoldSupported: boolean
  deletionRequiresApproval: boolean
  active: false
}

export function buildRetentionPolicies(): RetentionPolicy[] {
  return [
    {
      id: "retention-security",
      dataClass: "security",
      retentionDays: 2555,
      legalHoldSupported: true,
      deletionRequiresApproval: true,
      active: false,
    },
    {
      id: "retention-governance",
      dataClass: "governance",
      retentionDays: 2555,
      legalHoldSupported: true,
      deletionRequiresApproval: true,
      active: false,
    },
    {
      id: "retention-usage",
      dataClass: "usage",
      retentionDays: 730,
      legalHoldSupported: false,
      deletionRequiresApproval: true,
      active: false,
    },
    {
      id: "retention-evidence",
      dataClass: "evidence",
      retentionDays: 2555,
      legalHoldSupported: true,
      deletionRequiresApproval: true,
      active: false,
    },
  ]
}

export function evaluateRetentionCoverage(
  policies: RetentionPolicy[] = buildRetentionPolicies()
) {
  const approvalProtected = policies.filter(
    (policy) => policy.deletionRequiresApproval
  ).length
  const legalHold = policies.filter((policy) => policy.legalHoldSupported).length

  return {
    score: Math.round(
      (approvalProtected / policies.length) * 58 + (legalHold / policies.length) * 32
    ),
    status: "RETENTION_WINDOWS_DEFINED_NOT_ACTIVE" as const,
    policyCount: policies.length,
    active: false,
  }
}
