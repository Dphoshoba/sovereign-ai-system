const WINDOW_MS = 10 * 60 * 1000
const LIMIT = 8
const buckets = new Map<string, { count: number; resetAt: number }>()

export function captureText(value: unknown, max: number) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

export function captureEmail(value: unknown) {
  const email = captureText(value, 200)?.toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

export function payloadWithinLimit(request: Request, maxBytes = 8192) {
  const header = request.headers.get("content-length")
  if (!header) return true
  const length = Number(header)
  return Number.isFinite(length) && length >= 0 && length <= maxBytes
}

export function captureIdentity(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return forwarded || "local"
}

export function memoryCaptureAllowed(route: string, identity: string, now = Date.now()) {
  const key = `${route}:${identity}`
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (current.count >= LIMIT) return false
  current.count += 1
  return true
}

export const CAPTURE_REDIS_TIMEOUT_MS = 200

export type CaptureRedis = {
  incr(key: string): Promise<number>
  pexpire(key: string, milliseconds: number): Promise<number>
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), milliseconds)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

export async function limitPublicCapture(
  route: string,
  identity: string,
  redis: CaptureRedis | null,
) {
  if (!redis) return memoryCaptureAllowed(route, identity)

  try {
    const key = `public-capture:${route}:${identity}`
    const count = await withTimeout(redis.incr(key), CAPTURE_REDIS_TIMEOUT_MS)
    if (count === 1) {
      await withTimeout(redis.pexpire(key, WINDOW_MS), CAPTURE_REDIS_TIMEOUT_MS)
    }
    return count <= LIMIT
  } catch {
    return memoryCaptureAllowed(route, identity)
  }
}

let redisClient: CaptureRedis | null = null

async function redisCaptureAllowed(route: string, identity: string) {
  const url = process.env.REDIS_URL
  if (!url || process.env.VITEST === "true") return null

  try {
    if (!redisClient) {
      const imported = await import("ioredis")
      const Redis = imported.default
      const client = new Redis(url, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
      })
      await client.connect()
      redisClient = client
    }

    return await limitPublicCapture(route, identity, redisClient)
  } catch {
    console.error("Public capture Redis limit unavailable.")
    redisClient = null
    return null
  }
}

export async function publicCaptureAllowed(route: string, request: Request) {
  const identity = captureIdentity(request)
  const distributed = await redisCaptureAllowed(route, identity)
  if (distributed !== null) return distributed
  return memoryCaptureAllowed(route, identity)
}
