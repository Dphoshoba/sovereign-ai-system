export type OperatorQuota = {
  id: string
  role: "viewer" | "reviewer" | "operator" | "publisher" | "administrator"
  hourlyPreviewActions: number
  hourlyPackageActions: number
  highRiskActionLimit: number
  requiresApprovalForOverride: boolean
}

export function buildOperatorQuotas(): OperatorQuota[] {
  return [
    {
      id: "quota-viewer",
      role: "viewer",
      hourlyPreviewActions: 120,
      hourlyPackageActions: 0,
      highRiskActionLimit: 0,
      requiresApprovalForOverride: true,
    },
    {
      id: "quota-reviewer",
      role: "reviewer",
      hourlyPreviewActions: 180,
      hourlyPackageActions: 30,
      highRiskActionLimit: 5,
      requiresApprovalForOverride: true,
    },
    {
      id: "quota-operator",
      role: "operator",
      hourlyPreviewActions: 240,
      hourlyPackageActions: 50,
      highRiskActionLimit: 8,
      requiresApprovalForOverride: true,
    },
    {
      id: "quota-administrator",
      role: "administrator",
      hourlyPreviewActions: 360,
      hourlyPackageActions: 80,
      highRiskActionLimit: 12,
      requiresApprovalForOverride: true,
    },
  ]
}

export function evaluateOperatorQuotaCoverage(
  quotas: OperatorQuota[] = buildOperatorQuotas()
) {
  const overrideProtected = quotas.filter((quota) => quota.requiresApprovalForOverride).length

  return {
    score: Math.round((overrideProtected / quotas.length) * 82),
    status: "OPERATOR_QUOTAS_DEFINED_NOT_ENFORCED" as const,
    quotaCount: quotas.length,
  }
}
