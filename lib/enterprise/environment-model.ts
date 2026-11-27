export type EnterpriseEnvironmentKind = "local" | "preview" | "staging" | "production"

export type EnterpriseEnvironment = {
  id: string
  name: string
  kind: EnterpriseEnvironmentKind
  promotionAllowed: boolean
  executionAllowed: false
  persistenceAllowed: false
  requiredChecks: string[]
}

export function buildEnterpriseEnvironments(): EnterpriseEnvironment[] {
  return [
    {
      id: "local",
      name: "Local Development",
      kind: "local",
      promotionAllowed: false,
      executionAllowed: false,
      persistenceAllowed: false,
      requiredChecks: ["build", "smoke"],
    },
    {
      id: "preview",
      name: "Preview",
      kind: "preview",
      promotionAllowed: true,
      executionAllowed: false,
      persistenceAllowed: false,
      requiredChecks: ["build", "smoke", "guard-readiness"],
    },
    {
      id: "staging",
      name: "Staging",
      kind: "staging",
      promotionAllowed: true,
      executionAllowed: false,
      persistenceAllowed: false,
      requiredChecks: ["build", "smoke", "policy-readiness", "approval-readiness"],
    },
    {
      id: "production",
      name: "Production",
      kind: "production",
      promotionAllowed: false,
      executionAllowed: false,
      persistenceAllowed: false,
      requiredChecks: ["auth", "authorization", "rate-limits", "audit-persistence", "telemetry"],
    },
  ]
}

export function evaluateEnvironmentSafety(
  environments: EnterpriseEnvironment[] = buildEnterpriseEnvironments()
) {
  const allExecutionBlocked = environments.every((env) => env.executionAllowed === false)
  const allPersistenceBlocked = environments.every((env) => env.persistenceAllowed === false)
  const productionBlocked = environments.some(
    (env) => env.kind === "production" && env.promotionAllowed === false
  )
  const checks = [allExecutionBlocked, allPersistenceBlocked, productionBlocked]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "ENVIRONMENTS_DEFINED_EXECUTION_BLOCKED" as const,
    environmentCount: environments.length,
    productionPromotionBlocked: productionBlocked,
  }
}

