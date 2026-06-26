export type RateLimitOptionName =
  | "middleware"
  | "Redis"
  | "Upstash"
  | "Vercel Edge"
  | "in-memory dev fallback"

export type RateLimitOption = {
  option: RateLimitOptionName
  score: number
  fit: "HIGH" | "MEDIUM" | "LOW"
  strengths: string[]
  tradeoffs: string[]
  enabled: false
}

export type RateLimitEnforcementPlan = {
  ok: true
  readOnly: true
  writesToPrisma: false
  rateLimitRecommendation: string
  rateLimitReadiness: number
  enforcementEnabled: false
  options: RateLimitOption[]
  rolloutOrder: string[]
}

const options: RateLimitOption[] = [
  option("middleware", 82, "HIGH", [
    "Single route-boundary enforcement point.",
    "Good fit for operator and release route families.",
  ], [
    "Needs careful method/route matching and bypass tests.",
  ]),
  option("Redis", 78, "HIGH", [
    "Durable shared counters across server instances.",
    "Good fit for high-risk POST throttling.",
  ], [
    "Requires infrastructure selection and operational monitoring.",
  ]),
  option("Upstash", 84, "HIGH", [
    "Managed Redis-style rate limiting with low operational overhead.",
    "Good fit for Vercel-hosted deployments.",
  ], [
    "Adds external dependency and usage limits.",
  ]),
  option("Vercel Edge", 76, "MEDIUM", [
    "Can stop abusive requests before full app execution.",
  ], [
    "May not cover all app-specific identity and tenant dimensions alone.",
  ]),
  option("in-memory dev fallback", 58, "LOW", [
    "Useful for local development behavior parity.",
  ], [
    "Not safe as production enforcement.",
    "Does not work reliably across serverless instances.",
  ]),
]

export function buildRateLimitEnforcementPlan(): RateLimitEnforcementPlan {
  const rateLimitReadiness = Math.round(
    options.reduce((sum, item) => sum + item.score, 0) / options.length
  )

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    rateLimitRecommendation:
      "Use middleware plus Upstash-backed counters for production, with an in-memory fallback limited to local development.",
    rateLimitReadiness,
    enforcementEnabled: false,
    options,
    rolloutOrder: [
      "Define route policy map from existing RC-2 rate-limit contracts.",
      "Add middleware in report-only mode.",
      "Connect managed counter storage after approval.",
      "Add negative tests for exceeded limits.",
      "Enable blocking only after release approval.",
    ],
  }
}

function option(
  name: RateLimitOptionName,
  score: number,
  fit: RateLimitOption["fit"],
  strengths: string[],
  tradeoffs: string[]
): RateLimitOption {
  return {
    option: name,
    score,
    fit,
    strengths,
    tradeoffs,
    enabled: false,
  }
}
