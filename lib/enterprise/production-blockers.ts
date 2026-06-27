export type EnterpriseProductionBlocker = {
  id: string
  blocker: string
  severity: "high" | "critical"
  requiredBeforeProduction: true
}

export function buildEnterpriseProductionBlockers(): EnterpriseProductionBlocker[] {
  return [
    {
      id: "auth-not-integrated",
      blocker: "Authentication provider is not integrated.",
      severity: "critical",
      requiredBeforeProduction: true,
    },
    {
      id: "authorization-not-enforced",
      blocker: "Route authorization is not enforced.",
      severity: "critical",
      requiredBeforeProduction: true,
    },
    {
      id: "audit-not-persisted",
      blocker: "Audit persistence is not approved or implemented.",
      severity: "high",
      requiredBeforeProduction: true,
    },
    {
      id: "telemetry-not-integrated",
      blocker: "Telemetry backend is not integrated.",
      severity: "high",
      requiredBeforeProduction: true,
    },
  ]
}

export function evaluateProductionBlockers(
  blockers: EnterpriseProductionBlocker[] = buildEnterpriseProductionBlockers()
) {
  const allRequired = blockers.every((blocker) => blocker.requiredBeforeProduction)

  return {
    score: allRequired ? 100 : 50,
    status: "PRODUCTION_BLOCKERS_DEFINED" as const,
    blockerCount: blockers.length,
    productionEligible: false,
  }
}

