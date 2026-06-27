import { evaluateOrganizationBoundaries } from "./organization-guard"
import { evaluatePolicySegregation } from "./policy-isolation"
import { evaluateTenantIsolation } from "./tenant-guard"
import { evaluateWorkspaceContainment } from "./workspace-guard"
import { evaluateTenantIsolationReadiness } from "./workspace-isolation"

export type CrossTenantRiskFactor = {
  id: string
  name: string
  risk: "low" | "medium" | "high"
  mitigation: string
}

export function buildCrossTenantRiskFactors(): CrossTenantRiskFactor[] {
  return [
    {
      id: "legacy-enterprise-governance-writes",
      name: "Legacy enterprise governance routes contain writes",
      risk: "medium",
      mitigation:
        "Keep EA-3 guards separate and report-only until legacy routes are audited.",
    },
    {
      id: "auth-not-integrated",
      name: "Auth provider not integrated",
      risk: "medium",
      mitigation:
        "Treat all tenant guards as contracts until identity and membership are enforced.",
    },
    {
      id: "shared-knowledge-layer",
      name: "Shared knowledge layer can bridge workspaces",
      risk: "low",
      mitigation:
        "Allow shared knowledge reads only; keep writes blocked pending governance.",
    },
  ]
}

export function evaluateCrossTenantLeakageRisk(
  factors: CrossTenantRiskFactor[] = buildCrossTenantRiskFactors()
) {
  const riskPoints = factors.reduce((sum, factor) => {
    if (factor.risk === "high") return sum + 34
    if (factor.risk === "medium") return sum + 18
    return sum + 8
  }, 0)
  const rawRiskScore = Math.min(100, Math.round(riskPoints / factors.length))
  const safetyOffset = Math.round(
    [
      evaluateTenantIsolation().score,
      evaluateWorkspaceContainment().score,
      evaluateOrganizationBoundaries().score,
      evaluatePolicySegregation().score,
      evaluateTenantIsolationReadiness().score,
    ].reduce((sum, score) => sum + score, 0) / 5
  )
  const mitigatedRiskScore = Math.max(0, rawRiskScore - Math.round(safetyOffset * 0.12))

  return {
    score: mitigatedRiskScore,
    status: "LOW_CONTRACTUAL_RISK_WITH_UNENFORCED_AUTH" as const,
    lowerIsBetter: true,
    factorCount: factors.length,
    factors,
    mitigationsRequired: factors.map((factor) => factor.mitigation),
  }
}

