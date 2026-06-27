export type GuardGap = {
  id: string
  title: string
  severity: "LOW" | "MEDIUM" | "HIGH"
  blockerForBetaRuntime: boolean
  recommendation: string
}

export function buildGuardGapAnalysis(): GuardGap[] {
  return [
    {
      id: "gap-no-middleware",
      title: "No route guard middleware exists yet.",
      severity: "HIGH",
      blockerForBetaRuntime: true,
      recommendation: "Implement report-only guard wrappers before any enforcing middleware.",
    },
    {
      id: "gap-no-session-source",
      title: "No runtime session or identity source exists.",
      severity: "HIGH",
      blockerForBetaRuntime: true,
      recommendation: "Complete provider decision and session contract before enforcement.",
    },
    {
      id: "gap-route-inventory",
      title: "Legacy execution and publishing routes need per-route guard mapping.",
      severity: "MEDIUM",
      blockerForBetaRuntime: true,
      recommendation: "Inventory high-risk route handlers before adding execution controls.",
    },
    {
      id: "gap-audit-hook",
      title: "Guard decisions are not persisted or emitted to telemetry.",
      severity: "MEDIUM",
      blockerForBetaRuntime: true,
      recommendation: "Define audit and telemetry hook contracts before runtime guards.",
    },
  ]
}

export function evaluateGuardGaps(gaps: GuardGap[] = buildGuardGapAnalysis()) {
  const high = gaps.filter((gap) => gap.severity === "HIGH").length
  const medium = gaps.filter((gap) => gap.severity === "MEDIUM").length
  const score = Math.max(0, 100 - high * 14 - medium * 7)

  return {
    score,
    status: "GUARD_GAPS_IDENTIFIED" as const,
    gapCount: gaps.length,
    betaRuntimeBlockers: gaps.filter((gap) => gap.blockerForBetaRuntime).length,
  }
}
