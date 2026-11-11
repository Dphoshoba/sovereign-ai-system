import { describe, expect, it, vi } from "vitest"
import {
  CAPTURE_REDIS_TIMEOUT_MS,
  limitPublicCapture,
  memoryCaptureAllowed,
  type CaptureRedis,
} from "../../lib/security/public-capture"

function redis(overrides: Partial<CaptureRedis>): CaptureRedis {
  return {
    incr: vi.fn(async () => 1),
    pexpire: vi.fn(async () => 1),
    ...overrides,
  }
}

describe("public capture Redis limit", () => {
  it("accepts a request and starts the Redis window", async () => {
    const client = redis({})
    const allowed = await limitPublicCapture("redis-success", "203.0.113.10", client)

    expect(allowed).toBe(true)
    expect(client.incr).toHaveBeenCalledWith("public-capture:redis-success:203.0.113.10")
    expect(client.pexpire).toHaveBeenCalledWith(
      "public-capture:redis-success:203.0.113.10",
      10 * 60 * 1000,
    )
    for (let count = 0; count < 8; count += 1) {
      expect(memoryCaptureAllowed("redis-success", "203.0.113.10")).toBe(true)
    }
  })

  it("rejects the request when Redis reports the window is exhausted", async () => {
    const client = redis({ incr: vi.fn(async () => 9) })
    const allowed = await limitPublicCapture("redis-exhausted", "203.0.113.11", client)

    expect(allowed).toBe(false)
    expect(client.pexpire).not.toHaveBeenCalled()
    for (let count = 0; count < 8; count += 1) {
      expect(memoryCaptureAllowed("redis-exhausted", "203.0.113.11")).toBe(true)
    }
  })

  it("falls back to the process window when Redis cannot connect", async () => {
    const client = redis({
      incr: vi.fn(async () => {
        throw new Error("ECONNREFUSED")
      }),
    })

    await expect(limitPublicCapture("redis-down", "203.0.113.12", client)).resolves.toBe(true)
    expect(memoryCaptureAllowed("redis-down", "203.0.113.12")).toBe(true)
  })

  it("falls back when Redis does not answer before the timeout", async () => {
    vi.useFakeTimers()
    const client = redis({
      incr: vi.fn(() => new Promise<number>(() => undefined)),
    })
    const pending = limitPublicCapture("redis-timeout", "203.0.113.13", client)
    await vi.advanceTimersByTimeAsync(CAPTURE_REDIS_TIMEOUT_MS)
    await expect(pending).resolves.toBe(true)
    vi.useRealTimers()
    expect(memoryCaptureAllowed("redis-timeout", "203.0.113.13")).toBe(true)
  })
})
