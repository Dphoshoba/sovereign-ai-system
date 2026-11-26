/**
 * Newsletter-only Resend credentials. Fail closed when missing.
 * Unrelated email services continue to use RESEND_API_KEY / EMAIL_FROM.
 */

export const NEWSLETTER_SENDER_DOMAIN = "news.echoesandvisions.com"

export const EXPECTED_NEWSLETTER_FROM =
  "Echoes & Visions <newsletter@news.echoesandvisions.com>"

const PLACEHOLDER_FROM_MARKERS = [
  "yourdomain.com",
  "example.com",
  "localhost",
]

export type NewsletterConfigOk = {
  ok: true
  apiKey: string
  from: string
}

export type NewsletterConfigErr = {
  ok: false
  code:
    | "missing_newsletter_resend_api_key"
    | "missing_newsletter_from"
    | "placeholder_newsletter_from"
    | "invalid_newsletter_from_domain"
  error: string
}

export type NewsletterConfigResult = NewsletterConfigOk | NewsletterConfigErr

function extractEmailAddress(from: string): string | null {
  const angled = from.match(/<([^>]+)>/)
  const candidate = (angled?.[1] ?? from).trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) return null
  return candidate
}

export function resolveNewsletterConfig(
  env: NodeJS.ProcessEnv = process.env,
): NewsletterConfigResult {
  const apiKey = env.NEWSLETTER_RESEND_API_KEY?.trim()
  if (!apiKey) {
    return {
      ok: false,
      code: "missing_newsletter_resend_api_key",
      error:
        "NEWSLETTER_RESEND_API_KEY is required for newsletter sends. RESEND_API_KEY is not used as a fallback.",
    }
  }

  const from = env.NEWSLETTER_FROM?.trim()
  if (!from) {
    return {
      ok: false,
      code: "missing_newsletter_from",
      error:
        "NEWSLETTER_FROM is required for newsletter sends. Placeholder fallbacks are disabled.",
    }
  }

  const lower = from.toLowerCase()
  if (PLACEHOLDER_FROM_MARKERS.some((marker) => lower.includes(marker))) {
    return {
      ok: false,
      code: "placeholder_newsletter_from",
      error: "NEWSLETTER_FROM must not use a placeholder domain.",
    }
  }

  const address = extractEmailAddress(from)
  if (!address || !address.endsWith(`@${NEWSLETTER_SENDER_DOMAIN}`)) {
    return {
      ok: false,
      code: "invalid_newsletter_from_domain",
      error: `NEWSLETTER_FROM must send from @${NEWSLETTER_SENDER_DOMAIN}.`,
    }
  }

  return { ok: true, apiKey, from }
}

/** Preview/runtime safety: never allow live list distribution in Preview. */
export function newsletterLiveListDistributionAllowed(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.VERCEL_ENV === "preview") return false
  if (env.NEWSLETTER_LIVE_LIST_DISABLED === "true") return false
  return true
}
