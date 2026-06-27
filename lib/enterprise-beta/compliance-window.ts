export type ComplianceWindow = {
  id: string
  framework: "internal-governance" | "security-review" | "enterprise-customer" | "legal-hold"
  minimumRetentionDays: number
  reviewCadenceDays: number
  exportRequired: boolean
  active: false
}

export function buildComplianceWindows(): ComplianceWindow[] {
  return [
    {
      id: "window-internal-governance",
      framework: "internal-governance",
      minimumRetentionDays: 1095,
      reviewCadenceDays: 90,
      exportRequired: true,
      active: false,
    },
    {
      id: "window-security-review",
      framework: "security-review",
      minimumRetentionDays: 2555,
      reviewCadenceDays: 30,
      exportRequired: true,
      active: false,
    },
    {
      id: "window-enterprise-customer",
      framework: "enterprise-customer",
      minimumRetentionDays: 2555,
      reviewCadenceDays: 90,
      exportRequired: true,
      active: false,
    },
    {
      id: "window-legal-hold",
      framework: "legal-hold",
      minimumRetentionDays: 3650,
      reviewCadenceDays: 30,
      exportRequired: true,
      active: false,
    },
  ]
}

export function evaluateComplianceWindowCoverage(
  windows: ComplianceWindow[] = buildComplianceWindows()
) {
  const exportReady = windows.filter((window) => window.exportRequired).length
  const longRetention = windows.filter((window) => window.minimumRetentionDays >= 1095).length

  return {
    score: Math.round((exportReady / windows.length) * 42 + (longRetention / windows.length) * 44),
    status: "COMPLIANCE_WINDOWS_DEFINED_NOT_ACTIVE" as const,
    windowCount: windows.length,
    active: false,
  }
}
