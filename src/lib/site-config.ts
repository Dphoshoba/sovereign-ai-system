/** Canonical production origin (Vercel). */
export const PRODUCTION_APP_URL =
  "https://sovereign-ai-executive.vercel.app" as const

/** Public app URL: env override, then production default, then local dev. */
export function getAppUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL

  if (fromEnv) {
    return fromEnv.replace(/\/$/, "")
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_APP_URL
  }

  return "http://localhost:3000"
}
