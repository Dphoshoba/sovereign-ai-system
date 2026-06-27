export type ActivationRisk = {
  id: string
  title: string
  severity: "low" | "medium" | "high"
  mitigation: string
  acceptedInEb10: boolean
}

export function buildActivationRisks(): ActivationRisk[] {
  return [
    {
      id: "activation-risk-wave-overreach",
      title: "Activation wave overreach can increase tenant blast radius",
      severity: "high",
      mitigation: "Constrain tenant waves and require holdpoint approval before promotion.",
      acceptedInEb10: true,
    },
    {
      id: "activation-risk-telemetry-blindspot",
      title: "Guardrail telemetry blindspots can hide regressions",
      severity: "medium",
      mitigation: "Require thresholded telemetry signals for each pilot wave.",
      acceptedInEb10: true,
    },
    {
      id: "activation-risk-rollback-failure",
      title: "Rollback drill failures can delay recovery",
      severity: "high",
      mitigation: "Enforce rollback drill SLAs and operator escalation gates.",
      acceptedInEb10: true,
    },
    {
      id: "activation-risk-promotion-drift",
      title: "Promotion threshold drift can bypass readiness protections",
      severity: "medium",
      mitigation: "Freeze promotion thresholds and re-evaluate at every holdpoint.",
      acceptedInEb10: true,
    },
  ]
}

export function evaluateActivationRiskReadiness(
  risks: ActivationRisk[] = buildActivationRisks()
) {
  const accepted = risks.filter((risk) => risk.acceptedInEb10).length
  const highSeverity = risks.filter((risk) => risk.severity === "high").length

  return {
    score: Math.round((accepted / risks.length) * 70 + (highSeverity > 0 ? 15 : 0)),
    status: "ACTIVATION_RISK_DEFINED_REPORT_ONLY" as const,
    riskCount: risks.length,
  }
}
