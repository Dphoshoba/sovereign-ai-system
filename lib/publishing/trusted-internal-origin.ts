const DEPLOYMENT_HOST =
  /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i

/**
 * Origin for privileged server-to-server calls.
 * VERCEL_URL is set by the platform for the current deployment.
 * Request Host and forwarded-host headers are ignored.
 * Non-production runs stay on localhost. Production without a
 * platform host fails closed instead of using the public app URL.
 */
export function trustedInternalOrigin(): string | null {
  const raw = process.env.VERCEL_URL?.trim() ?? ""
  if (raw) {
    const host = raw.replace(/^https?:\/\//i, "").replace(/\/.*$/, "")
    if (!DEPLOYMENT_HOST.test(host)) return null
    return `https://${host}`
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000"
  }

  return null
}

export function trustedInternalUrl(path: string): URL | null {
  const origin = trustedInternalOrigin()
  if (!origin) return null
  return new URL(path, origin)
}

export function trustedOriginUnavailableResponse() {
  return Response.json(
    { ok: false, error: "Trusted internal origin is unavailable." },
    { status: 500 },
  )
}
