export type EnvironmentAuditStatus = "PASS" | "WARNING" | "BLOCKER"

export type EnvironmentVariableCheck = {
  name: string
  requiredForProduction: boolean
  configured: boolean
  category: "runtime" | "database" | "public-url" | "ai" | "auth" | "monitoring"
  status: EnvironmentAuditStatus
  notes: string[]
}

export type EnvironmentAudit = {
  ok: true
  readOnly: true
  writesToPrisma: false
  environmentScore: number
  status: EnvironmentAuditStatus
  checks: EnvironmentVariableCheck[]
  releaseBlockers: string[]
  recommendedFixes: string[]
}

const REQUIRED_ENVIRONMENT_VARIABLES: Array<
  Pick<
    EnvironmentVariableCheck,
    "name" | "requiredForProduction" | "category"
  > & { notes?: string[] }
> = [
  {
    name: "DATABASE_URL",
    requiredForProduction: true,
    category: "database",
    notes: ["Required by Prisma-backed routes and health checks."],
  },
  {
    name: "NEXT_PUBLIC_APP_URL",
    requiredForProduction: true,
    category: "public-url",
    notes: ["Must match the canonical Vercel production origin."],
  },
  {
    name: "NEXT_PUBLIC_BASE_URL",
    requiredForProduction: true,
    category: "public-url",
    notes: ["Must match the canonical Vercel production origin."],
  },
  {
    name: "OPENAI_API_KEY",
    requiredForProduction: false,
    category: "ai",
    notes: ["Needed only for approved AI execution routes, not for this audit."],
  },
  {
    name: "NEXTAUTH_SECRET",
    requiredForProduction: false,
    category: "auth",
    notes: ["Required if NextAuth-backed sessions are enabled for operators."],
  },
  {
    name: "SENTRY_DSN",
    requiredForProduction: false,
    category: "monitoring",
    notes: ["Recommended for production error monitoring."],
  },
]

export function buildEnvironmentAudit(
  env: NodeJS.ProcessEnv = process.env
): EnvironmentAudit {
  const checks = REQUIRED_ENVIRONMENT_VARIABLES.map((definition) => {
    const configured = Boolean(env[definition.name])
    const missingRequired = definition.requiredForProduction && !configured
    const status: EnvironmentAuditStatus = missingRequired
      ? "BLOCKER"
      : configured
        ? "PASS"
        : "WARNING"

    return {
      ...definition,
      configured,
      status,
      notes: definition.notes ?? [],
    }
  })

  const releaseBlockers = checks
    .filter((check) => check.status === "BLOCKER")
    .map((check) => `${check.name} is required for production.`)
  const warnings = checks.filter((check) => check.status === "WARNING").length
  const environmentScore = Math.max(
    0,
    100 - releaseBlockers.length * 25 - warnings * 5
  )

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    environmentScore,
    status: releaseBlockers.length > 0 ? "BLOCKER" : warnings > 0 ? "WARNING" : "PASS",
    checks,
    releaseBlockers,
    recommendedFixes: [
      "Set NEXT_PUBLIC_APP_URL and NEXT_PUBLIC_BASE_URL to https://sovereign-ai-executive.vercel.app in Vercel.",
      "Verify DATABASE_URL points to the production database before release.",
      "Add monitoring secrets before enabling operator execution controls.",
      "Keep AI provider secrets unavailable to preview-only routes unless a governed execution phase requires them.",
    ],
  }
}
