export type RehearsalRisk = {
  id: string
  title: string
  severity: "low" | "medium" | "high"
  mitigation: string
  acceptedInEb9: boolean
}

export function buildRehearsalRisks(): RehearsalRisk[] {
  return [
    {
      id: "rehearsal-risk-canary-overreach",
      title: "Canary cohort definition too broad could increase blast radius",
      severity: "high",
      mitigation: "Limit cohort expansion to tenant-scoped gates with operator approval.",
      acceptedInEb9: true,
    },
    {
      id: "rehearsal-risk-rollback-sla-miss",
      title: "Rollback SLA miss could prolong tenant impact",
      severity: "high",
      mitigation: "Define strict detect-to-disable and disable-to-stabilize checkpoints.",
      acceptedInEb9: true,
    },
    {
      id: "rehearsal-risk-approval-ambiguity",
      title: "Approval gate ambiguity could lead to unsafe progression",
      severity: "medium",
      mitigation: "Require explicit operator approval gates for each rehearsal stage.",
      acceptedInEb9: true,
    },
    {
      id: "rehearsal-risk-scorecard-drift",
      title: "Cutover scorecard drift could hide failed readiness conditions",
      severity: "medium",
      mitigation: "Lock scorecard checkpoints and re-evaluate before every go/no-go review.",
      acceptedInEb9: true,
    },
  ]
}

export function evaluateRehearsalRiskReadiness(
  risks: RehearsalRisk[] = buildRehearsalRisks()
) {
  const accepted = risks.filter((risk) => risk.acceptedInEb9).length
  const highSeverity = risks.filter((risk) => risk.severity === "high").length

  return {
    score: Math.round((accepted / risks.length) * 70 + (highSeverity > 0 ? 15 : 0)),
    status: "REHEARSAL_RISK_REGISTER_DEFINED_REPORT_ONLY" as const,
    riskCount: risks.length,
  }
}
