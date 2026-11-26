import { createHmac, timingSafeEqual } from "node:crypto"

const TOKEN_VERSION = "v1"

function signingSecret(env: NodeJS.ProcessEnv = process.env): string | null {
  const dedicated = env.NEWSLETTER_UNSUB_SECRET?.trim()
  if (dedicated) return dedicated
  const key = env.NEWSLETTER_RESEND_API_KEY?.trim()
  if (key) return `unsub:${key}`
  return null
}

export function createUnsubscribeToken(
  email: string,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const secret = signingSecret(env)
  if (!secret) return null
  const normalized = email.trim().toLowerCase()
  const sig = createHmac("sha256", secret)
    .update(`${TOKEN_VERSION}:${normalized}`)
    .digest("base64url")
  const payload = Buffer.from(
    JSON.stringify({ v: TOKEN_VERSION, e: normalized }),
  ).toString("base64url")
  return `${payload}.${sig}`
}

export function verifyUnsubscribeToken(
  token: string,
  env: NodeJS.ProcessEnv = process.env,
): { ok: true; email: string } | { ok: false; error: string } {
  const secret = signingSecret(env)
  if (!secret) {
    return { ok: false, error: "Unsubscribe tokens are not configured." }
  }

  const parts = token.split(".")
  if (parts.length !== 2) {
    return { ok: false, error: "Invalid unsubscribe token." }
  }

  const [payload, sig] = parts
  let email: string
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { v?: string; e?: string }
    if (parsed.v !== TOKEN_VERSION || typeof parsed.e !== "string") {
      return { ok: false, error: "Invalid unsubscribe token." }
    }
    email = parsed.e.trim().toLowerCase()
  } catch {
    return { ok: false, error: "Invalid unsubscribe token." }
  }

  const expected = createHmac("sha256", secret)
    .update(`${TOKEN_VERSION}:${email}`)
    .digest("base64url")

  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, error: "Invalid unsubscribe token." }
  }

  return { ok: true, email }
}

export function publicUnsubscribeUrl(
  email: string,
  origin: string,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const token = createUnsubscribeToken(email, env)
  if (!token) return null
  const base = origin.replace(/\/$/, "")
  return `${base}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`
}
