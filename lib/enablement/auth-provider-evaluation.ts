export type AuthProviderOption =
  | "Clerk"
  | "Auth.js / NextAuth"
  | "Supabase Auth"
  | "Custom session approach"

export type AuthProviderEvaluation = {
  provider: AuthProviderOption
  score: number
  fit: "HIGH" | "MEDIUM" | "LOW"
  strengths: string[]
  tradeoffs: string[]
  implementationNotes: string[]
  installed: false
  integrated: false
  sessionsEnabled: false
  jwtEnabled: false
}

export type AuthProviderEvaluationReport = {
  ok: true
  readOnly: true
  writesToPrisma: false
  providerRecommendation: AuthProviderOption
  recommendationSummary: string
  options: AuthProviderEvaluation[]
}

const options: AuthProviderEvaluation[] = [
  option(
    "Clerk",
    86,
    "HIGH",
    [
      "Strong hosted operator identity and organization support.",
      "Good fit for dashboard-heavy admin workflows.",
      "Reduces custom session and account-management burden.",
    ],
    [
      "Adds a paid external dependency and vendor-specific integration surface.",
      "Requires careful role/permission mapping into EV-KOS contracts.",
    ],
    [
      "Map Clerk user and organization identity into OperatorIdentity.",
      "Keep EV-KOS authorization checks independent from provider-specific claims.",
    ]
  ),
  option(
    "Auth.js / NextAuth",
    80,
    "HIGH",
    [
      "Flexible and familiar in Next.js ecosystems.",
      "Can support multiple providers while keeping more control in-app.",
      "Good fit if EV-KOS wants provider portability.",
    ],
    [
      "Requires more design for sessions, callbacks, role storage, and tenant mapping.",
      "More implementation ownership than a hosted operator identity platform.",
    ],
    [
      "Use only after a session strategy and role source are explicitly approved.",
      "Do not add callbacks until route-boundary authorization tests exist.",
    ]
  ),
  option(
    "Supabase Auth",
    72,
    "MEDIUM",
    [
      "Can pair auth with Postgres-backed application data.",
      "Useful if the platform standardizes around Supabase-managed identity.",
    ],
    [
      "May overlap with existing Prisma/Postgres boundaries.",
      "Requires careful tenant and role synchronization.",
    ],
    [
      "Consider only if data hosting and identity are intentionally consolidated.",
    ]
  ),
  option(
    "Custom session approach",
    52,
    "LOW",
    [
      "Maximum control over session shape and authorization internals.",
    ],
    [
      "Highest security and maintenance burden.",
      "Slower path to production confidence.",
      "Requires custom session hardening, rotation, storage, and incident response.",
    ],
    [
      "Avoid for V1 unless external provider constraints make it necessary.",
    ]
  ),
]

export function buildAuthProviderEvaluation(): AuthProviderEvaluationReport {
  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    providerRecommendation: "Clerk",
    recommendationSummary:
      "Prefer Clerk for the first production operator identity layer, while keeping EV-KOS role and permission enforcement provider-neutral.",
    options,
  }
}

function option(
  provider: AuthProviderOption,
  score: number,
  fit: AuthProviderEvaluation["fit"],
  strengths: string[],
  tradeoffs: string[],
  implementationNotes: string[]
): AuthProviderEvaluation {
  return {
    provider,
    score,
    fit,
    strengths,
    tradeoffs,
    implementationNotes,
    installed: false,
    integrated: false,
    sessionsEnabled: false,
    jwtEnabled: false,
  }
}
