import { validateEnvironment } from "../security/startup-validation"

export type StartupEnvironmentBehavior = {
  environment: "production" | "preview/staging" | "local development"
  behavior: string
  blocksBoot: boolean
  readiness: number
}

export type StartupEnforcementPlan = {
  ok: true
  readOnly: true
  writesToPrisma: false
  startupGateRecommendation: string
  startupReadiness: number
  enforcementEnabled: false
  requiredEnvs: string[]
  optionalEnvs: string[]
  environmentBehavior: StartupEnvironmentBehavior[]
  missingRequired: string[]
}

export function buildStartupEnforcementPlan(): StartupEnforcementPlan {
  const environment = validateEnvironment()
  const environmentBehavior: StartupEnvironmentBehavior[] = [
    {
      environment: "production",
      behavior:
        "Block boot when required environment variables are missing after explicit release approval.",
      blocksBoot: false,
      readiness: 82,
    },
    {
      environment: "preview/staging",
      behavior:
        "Warn loudly and mark release readiness blocked, but allow preview deployments for diagnostics.",
      blocksBoot: false,
      readiness: 78,
    },
    {
      environment: "local development",
      behavior:
        "Report missing variables without blocking local developer workflows.",
      blocksBoot: false,
      readiness: 88,
    },
  ]
  const startupReadiness = Math.round(
    [environment.score, ...environmentBehavior.map((item) => item.readiness)].reduce(
      (sum, score) => sum + score,
      0
    ) /
      (environmentBehavior.length + 1)
  )

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    startupGateRecommendation:
      "Keep startup enforcement report-only until RC approval, then enable production-only boot blocking for required envs.",
    startupReadiness,
    enforcementEnabled: false,
    requiredEnvs: ["DATABASE_URL", "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_BASE_URL"],
    optionalEnvs: ["NEXTAUTH_SECRET", "OPENAI_API_KEY", "SENTRY_DSN"],
    environmentBehavior,
    missingRequired: environment.missingRequired,
  }
}
