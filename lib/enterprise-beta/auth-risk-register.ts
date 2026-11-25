export type AuthRiskRegisterItem = {
  id: string
  title: string
  severity: "low" | "medium" | "high"
  mitigation: string
  acceptedInEb8: boolean
}

export function buildAuthRiskRegister(): AuthRiskRegisterItem[] {
  return [
    {
      id: "auth-risk-tenant-mis-scope",
      title: "Tenant claim mis-scope could expose cross-tenant access",
      severity: "high",
      mitigation: "Require tenant rollback checkpoints and deny-by-default claim validation.",
      acceptedInEb8: true,
    },
    {
      id: "auth-risk-flag-drift",
      title: "Feature-flag drift could bypass dry-run boundaries",
      severity: "medium",
      mitigation: "Define disabled-by-default flags with checkpoint validation before cutover.",
      acceptedInEb8: true,
    },
    {
      id: "auth-risk-rollback-latency",
      title: "Rollback latency could prolong auth errors during rollout",
      severity: "medium",
      mitigation: "Predefine tenant-scoped rollback checkpoints and escalation paths.",
      acceptedInEb8: true,
    },
    {
      id: "auth-risk-operator-ambiguity",
      title: "Operator accountability could be lost during transition",
      severity: "low",
      mitigation: "Bind operator scope in dry-run checkpoints and escalation contracts.",
      acceptedInEb8: true,
    },
  ]
}

export function evaluateAuthRiskReadiness(
  risks: AuthRiskRegisterItem[] = buildAuthRiskRegister()
) {
  const accepted = risks.filter((risk) => risk.acceptedInEb8).length
  const highSeverity = risks.filter((risk) => risk.severity === "high").length

  return {
    score: Math.round((accepted / risks.length) * 70 + (highSeverity > 0 ? 15 : 0)),
    status: "AUTH_RISK_REGISTER_DEFINED_REPORT_ONLY" as const,
    riskCount: risks.length,
  }
}
