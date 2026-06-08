export type EnvVarSpec = {
  key: string
  required: boolean
  productionOnly?: boolean
  group:
    | "database"
    | "authentication"
    | "openai"
    | "email"
    | "stripe"
    | "external"
    | "application"
  description: string
}

export const ENV_SPECS: EnvVarSpec[] = [
  {
    key: "DATABASE_URL",
    required: true,
    group: "database",
    description: "PostgreSQL connection string for Prisma.",
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    required: true,
    productionOnly: true,
    group: "application",
    description: "Public site URL used for metadata, server fetches, and callbacks.",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    group: "authentication",
    description: "Supabase project URL for admin authentication.",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    required: true,
    group: "authentication",
    description: "Supabase anonymous key for client-side auth.",
  },
  {
    key: "OPENAI_API_KEY",
    required: false,
    group: "openai",
    description: "Required for AI article generation, legacy sovereign runtime, and agent features. Not required for V1 rule-based executive stack.",
  },
  {
    key: "RESEND_API_KEY",
    required: false,
    group: "email",
    description: "Resend API key for newsletter and transactional email.",
  },
  {
    key: "EMAIL_FROM",
    required: false,
    group: "email",
    description: "Default from address for transactional email.",
  },
  {
    key: "NEWSLETTER_FROM",
    required: false,
    group: "email",
    description: "From address for newsletter sends.",
  },
  {
    key: "STRIPE_SECRET_KEY",
    required: false,
    group: "stripe",
    description: "Stripe secret key for billing runtime and payments.",
  },
  {
    key: "GOOGLE_CLIENT_ID",
    required: false,
    group: "external",
    description: "Google OAuth client ID for YouTube integration.",
  },
  {
    key: "GOOGLE_CLIENT_SECRET",
    required: false,
    group: "external",
    description: "Google OAuth client secret for YouTube integration.",
  },
  {
    key: "GOOGLE_REDIRECT_URI",
    required: false,
    group: "external",
    description: "OAuth redirect URI registered with Google.",
  },
  {
    key: "GOOGLE_CALENDAR_CLIENT_ID",
    required: false,
    group: "external",
    description: "Google Calendar client ID for booking integrations.",
  },
  {
    key: "TWITTER_API_KEY",
    required: false,
    group: "external",
    description: "Twitter/X API key for social publishing.",
  },
  {
    key: "TWITTER_API_SECRET",
    required: false,
    group: "external",
    description: "Twitter/X API secret.",
  },
  {
    key: "TWITTER_ACCESS_TOKEN",
    required: false,
    group: "external",
    description: "Twitter/X access token.",
  },
  {
    key: "TWITTER_ACCESS_SECRET",
    required: false,
    group: "external",
    description: "Twitter/X access token secret.",
  },
  {
    key: "BRAVE_SEARCH_API_KEY",
    required: false,
    group: "external",
    description: "Brave Search API key for research pipeline.",
  },
  {
    key: "SEARCH_PROVIDER",
    required: false,
    group: "external",
    description: "Research search provider override (default: none).",
  },
  {
    key: "NEXT_PUBLIC_BASE_URL",
    required: false,
    group: "application",
    description: "Alternate base URL used by some agent pipelines.",
  },
]

export type EnvValidationResult = {
  ok: boolean
  environment: "development" | "production" | "test"
  errors: string[]
  warnings: string[]
  missing: string[]
  configured: string[]
}

function isProduction() {
  return process.env.NODE_ENV === "production"
}

function isSet(key: string) {
  const value = process.env[key]
  return typeof value === "string" && value.trim().length > 0
}

export function validateEnv(): EnvValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const missing: string[] = []
  const configured: string[] = []

  for (const spec of ENV_SPECS) {
    if (isSet(spec.key)) {
      configured.push(spec.key)
      continue
    }

    const requiredNow =
      spec.required && (!spec.productionOnly || isProduction())

    if (requiredNow) {
      missing.push(spec.key)
      errors.push(
        `Missing required environment variable ${spec.key}: ${spec.description}`
      )
      continue
    }

    warnings.push(
      `Optional variable ${spec.key} is not set: ${spec.description}`
    )
  }

  const environment =
    process.env.NODE_ENV === "production"
      ? "production"
      : process.env.NODE_ENV === "test"
        ? "test"
        : "development"

  return {
    ok: errors.length === 0,
    environment,
    errors,
    warnings,
    missing,
    configured,
  }
}

export function formatEnvValidationErrors(result: EnvValidationResult) {
  if (result.ok) {
    return "Environment validation passed."
  }

  return [
    "Environment validation failed:",
    ...result.errors.map((error) => `- ${error}`),
  ].join("\n")
}
