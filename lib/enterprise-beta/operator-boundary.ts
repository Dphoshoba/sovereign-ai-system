export type OperatorBoundaryRequirement = {
  id: string
  boundary: "identity" | "role" | "permission" | "approval" | "tenant"
  requiredBefore: string[]
  currentMode: "REPORT_ONLY"
}

export function buildOperatorBoundaryRequirements(): OperatorBoundaryRequirement[] {
  return [
    {
      id: "operator-boundary-identity",
      boundary: "identity",
      requiredBefore: ["viewing enterprise dashboards", "creating intent packages"],
      currentMode: "REPORT_ONLY",
    },
    {
      id: "operator-boundary-role",
      boundary: "role",
      requiredBefore: ["reviewing packages", "preparing publication"],
      currentMode: "REPORT_ONLY",
    },
    {
      id: "operator-boundary-permission",
      boundary: "permission",
      requiredBefore: ["previewing graph writes", "preparing campaign generation"],
      currentMode: "REPORT_ONLY",
    },
    {
      id: "operator-boundary-approval",
      boundary: "approval",
      requiredBefore: ["approving high-risk decisions", "unlocking future execution"],
      currentMode: "REPORT_ONLY",
    },
    {
      id: "operator-boundary-tenant",
      boundary: "tenant",
      requiredBefore: ["any tenant-scoped read or future write"],
      currentMode: "REPORT_ONLY",
    },
  ]
}

export function evaluateOperatorBoundaryReadiness(
  requirements: OperatorBoundaryRequirement[] = buildOperatorBoundaryRequirements()
) {
  return {
    score: Math.round((requirements.length / 5) * 84),
    status: "OPERATOR_BOUNDARIES_DEFINED_NOT_ENFORCED" as const,
    boundaryCount: requirements.length,
    enforcementActive: false,
  }
}
