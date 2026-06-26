export type StartupValidationStatus = "READY" | "PARTIAL" | "BLOCKED"

export type StartupEnvironmentCheck = {
  name: string
  required: boolean
  configured: boolean
  category: "database" | "public-url" | "auth" | "ai" | "monitoring"
  notes: string[]
}

export type StartupValidationResult = {
  ok: boolean
  enforcementEnabled: false
  status: StartupValidationStatus
  score: number
  checks: StartupEnvironmentCheck[]
  missingRequired: string[]
  warnings: string[]
}

const STARTUP_ENVIRONMENT_CHECKS: Array<
  Omit<StartupEnvironmentCheck, "configured">
> = [
  {
    name: "DATABASE_URL",
    required: true,
    category: "database",
    notes: ["Required for Prisma-backed runtime routes."],
  },
  {
    name: "NEXT_PUBLIC_APP_URL",
    required: true,
    category: "public-url",
    notes: ["Must be https://sovereign-ai-executive.vercel.app in Vercel production."],
  },
  {
    name: "NEXT_PUBLIC_BASE_URL",
    required: true,
    category: "public-url",
    notes: ["Must match the canonical public origin."],
  },
  {
    name: "NEXTAUTH_SECRET",
    required: false,
    category: "auth",
    notes: ["Reserved for future auth integration; not integrated in RC-2."],
  },
  {
    name: "OPENAI_API_KEY",
    required: false,
    category: "ai",
    notes: ["Not required by RC-2; future generation routes must remain governed."],
  },
  {
    name: "SENTRY_DSN",
    required: false,
    category: "monitoring",
    notes: ["Recommended before production execution controls."],
  },
]

export function validateEnvironment(
  env: NodeJS.ProcessEnv = process.env
): StartupValidationResult {
  const checks = STARTUP_ENVIRONMENT_CHECKS.map((check) => ({
    ...check,
    configured: Boolean(env[check.name]),
  }))
  const missingRequired = checks
    .filter((check) => check.required && !check.configured)
    .map((check) => check.name)
  const optionalMissing = checks.filter(
    (check) => !check.required && !check.configured
  ).length
  const score = Math.max(0, 100 - missingRequired.length * 25 - optionalMissing * 5)

  return {
    ok: missingRequired.length === 0,
    enforcementEnabled: false,
    status:
      missingRequired.length > 0
        ? "BLOCKED"
        : optionalMissing > 0
          ? "PARTIAL"
          : "READY",
    score,
    checks,
    missingRequired,
    warnings: [
      "Startup validation is report-only in RC-2 and does not block boot.",
      "Auth provider secrets are not required until a provider is explicitly selected.",
    ],
  }
}

export function validateProductionReadiness(env: NodeJS.ProcessEnv = process.env) {
  const environment = validateEnvironment(env)

  return {
    ok: environment.ok,
    startupValidationStatus: environment.status,
    startupValidationScore: environment.score,
    enforcementEnabled: false,
    releaseBlockers: environment.missingRequired.map(
      (name) => `${name} is required before production release.`
    ),
    recommendedActions: [
      "Enable startup validation enforcement in a later RC after Vercel environment parity is verified.",
      "Keep RC-2 report-only so no production boot behavior changes are introduced.",
    ],
  }
}

export function missingEnvSummary(env: NodeJS.ProcessEnv = process.env) {
  const validation = validateEnvironment(env)

  return {
    missingRequired: validation.missingRequired,
    missingOptional: validation.checks
      .filter((check) => !check.required && !check.configured)
      .map((check) => check.name),
    summary:
      validation.missingRequired.length > 0
        ? `${validation.missingRequired.length} required environment variables are missing.`
        : "Required startup environment variables are present.",
  }
}
