import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const SECRET = "cron-secret-canary-do-not-leak"
const mockPublish = vi.fn()

vi.mock("../../lib/publishing/publish-due-articles", () => ({
  publishDueArticles: (...args: unknown[]) => mockPublish(...args),
}))

describe("POST/GET /api/cron/publish-scheduled authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = SECRET
  })

  it("rejects a missing secret", async () => {
    const { GET } = await import("../../app/api/cron/publish-scheduled/route")
    const response = await GET(
      new NextRequest("http://localhost/api/cron/publish-scheduled")
    )
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ ok: false, error: "Unauthorized" })
    expect(mockPublish).not.toHaveBeenCalled()
    expect(JSON.stringify(body)).not.toContain(SECRET)
  })

  it("rejects an incorrect secret", async () => {
    const { GET } = await import("../../app/api/cron/publish-scheduled/route")
    const response = await GET(
      new NextRequest("http://localhost/api/cron/publish-scheduled", {
        headers: { Authorization: "Bearer wrong-secret" },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe("Unauthorized")
    expect(mockPublish).not.toHaveBeenCalled()
    expect(JSON.stringify(body)).not.toContain(SECRET)
  })

  it("fails closed when CRON_SECRET is missing", async () => {
    delete process.env.CRON_SECRET
    const { GET } = await import("../../app/api/cron/publish-scheduled/route")
    const response = await GET(
      new NextRequest("http://localhost/api/cron/publish-scheduled", {
        headers: { Authorization: `Bearer ${SECRET}` },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(mockPublish).not.toHaveBeenCalled()
    expect(JSON.stringify(body)).not.toContain(SECRET)
  })

  it("publishes when the bearer token matches", async () => {
    mockPublish.mockResolvedValue({
      ok: true,
      invocationId: "inv-1",
      source: "external",
      startedAt: "2026-09-14T03:45:00.000Z",
      finishedAt: "2026-09-14T03:45:01.000Z",
      eligible: 1,
      published: 1,
      skipped: 0,
      failed: 0,
      publishedIds: ["due-1"],
      skippedItems: [],
      failedItems: [],
    })

    const { GET } = await import("../../app/api/cron/publish-scheduled/route")
    const response = await GET(
      new NextRequest("http://localhost/api/cron/publish-scheduled", {
        headers: {
          Authorization: `Bearer ${SECRET}`,
          "user-agent": "external-scheduler/1.0",
        },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.published).toBe(1)
    expect(mockPublish).toHaveBeenCalledWith({ source: "external" })
    expect(JSON.stringify(body)).not.toContain(SECRET)
  })

  it("accepts Vercel Cron user-agent as the invocation source", async () => {
    mockPublish.mockResolvedValue({
      ok: true,
      invocationId: "inv-2",
      source: "vercel-cron",
      startedAt: "2026-09-14T00:00:00.000Z",
      finishedAt: "2026-09-14T00:00:01.000Z",
      eligible: 0,
      published: 0,
      skipped: 0,
      failed: 0,
      publishedIds: [],
      skippedItems: [],
      failedItems: [],
    })

    const { GET } = await import("../../app/api/cron/publish-scheduled/route")
    const response = await GET(
      new NextRequest("http://localhost/api/cron/publish-scheduled", {
        headers: {
          Authorization: `Bearer ${SECRET}`,
          "user-agent": "vercel-cron/1.0",
        },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mockPublish).toHaveBeenCalledWith({ source: "vercel-cron" })
    expect(JSON.stringify(body)).not.toContain(SECRET)
  })
})
