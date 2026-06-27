export type EnterpriseGapSeverity = "LOW" | "MEDIUM" | "HIGH"

export type EnterpriseGap = {
  id: string
  title: string
  severity: EnterpriseGapSeverity
  alphaPosition: string
  betaRequirement: string
}

export function buildEnterpriseGapAnalysis(): EnterpriseGap[] {
  return [
    {
      id: "gap-auth-enforcement",
      title: "Authentication and session enforcement",
      severity: "HIGH",
      alphaPosition: "Contracts only; no provider integration, sessions, or JWT.",
      betaRequirement: "Select and enforce an enterprise auth provider with tenant-aware sessions.",
    },
    {
      id: "gap-route-guards",
      title: "Route guard enforcement",
      severity: "HIGH",
      alphaPosition: "Guard contracts and audits exist in report-only mode.",
      betaRequirement: "Apply authorization middleware or route-level guard wrappers.",
    },
    {
      id: "gap-audit-persistence",
      title: "Enterprise audit evidence persistence",
      severity: "MEDIUM",
      alphaPosition: "Audit event taxonomy and evidence packets are preview-only.",
      betaRequirement: "Persist immutable audit evidence using approved existing or new models.",
    },
    {
      id: "gap-policy-enforcement",
      title: "Policy lifecycle enforcement",
      severity: "MEDIUM",
      alphaPosition: "Policy versioning, exception, and drift models are contracts only.",
      betaRequirement: "Connect policies to approval boundaries and deployment gates.",
    },
    {
      id: "gap-ci-promotion",
      title: "Deployment gate automation",
      severity: "MEDIUM",
      alphaPosition: "Promotion and release gates are defined but not wired into CI.",
      betaRequirement: "Connect release checks to branch protection and deployment workflows.",
    },
  ]
}

export function evaluateEnterpriseGaps(gaps: EnterpriseGap[] = buildEnterpriseGapAnalysis()) {
  const high = gaps.filter((gap) => gap.severity === "HIGH").length
  const medium = gaps.filter((gap) => gap.severity === "MEDIUM").length
  const low = gaps.filter((gap) => gap.severity === "LOW").length
  const score = Math.max(0, 100 - high * 12 - medium * 6 - low * 2)

  return {
    score,
    status: high > 0 ? "BETA_BLOCKERS_PRESENT" as const : "NO_HIGH_GAPS" as const,
    totalGaps: gaps.length,
    high,
    medium,
    low,
  }
}
