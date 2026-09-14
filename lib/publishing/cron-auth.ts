import { createHash, timingSafeEqual } from "node:crypto"

export function getCronSecret() {
  return process.env.CRON_SECRET?.trim() || ""
}

export function timingSafeStringEqual(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest()
  const rightHash = createHash("sha256").update(right).digest()
  return timingSafeEqual(leftHash, rightHash)
}

export function extractBearerToken(authorization: string | null) {
  if (!authorization) return ""
  const [scheme, token] = authorization.split(" ")
  if (scheme !== "Bearer" || !token) return ""
  return token
}

export function authorizeCronRequest(request: Request) {
  const configured = getCronSecret()
  if (!configured) {
    return { ok: false as const, error: "Unauthorized" }
  }

  const presented = extractBearerToken(request.headers.get("authorization"))
  if (!presented || !timingSafeStringEqual(presented, configured)) {
    return { ok: false as const, error: "Unauthorized" }
  }

  return { ok: true as const }
}

export function cronUnauthorizedResponse() {
  return Response.json(
    { ok: false, error: "Unauthorized" },
    { status: 401 }
  )
}

export function resolveInvocationSource(request: Request) {
  const explicit = request.headers.get("x-invocation-source")?.trim()
  if (explicit) return explicit

  const userAgent = request.headers.get("user-agent") || ""
  if (userAgent.toLowerCase().includes("vercel-cron")) {
    return "vercel-cron"
  }

  return "external"
}
