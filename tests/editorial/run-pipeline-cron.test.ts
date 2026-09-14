import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const SECRET = "pipeline-secret-canary-do-not-leak"

describe("GET /api/cron/run-pipeline daily cron compatibility", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = SECRET
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (String(url).includes("/api/discovery/scheduled-run")) {
          return new Response(JSON.stringify({ ok: true, generatedCount: 0 }), {
            status: 200,
          })
        }

        if (String(url).includes("/api/cron/publish-scheduled")) {
          const authorization = new Headers(init?.headers).get("authorization")
          if (authorization !== `Bearer ${SECRET}`) {
            return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
              status: 401,
            })
          }

          return new Response(
            JSON.stringify({
              ok: true,
              invocationId: "inv-pipeline",
              published: 0,
              eligible: 0,
              skipped: 0,
              failed: 0,
            }),
            { status: 200 }
          )
        }

        return new Response(JSON.stringify({ ok: false }), { status: 404 })
      })
    )
  })

  it("rejects unauthenticated pipeline invocations", async () => {
    const { GET } = await import("../../app/api/cron/run-pipeline/route")
    const response = await GET(new NextRequest("http://localhost/api/cron/run-pipeline"))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ ok: false, error: "Unauthorized" })
    expect(fetch).not.toHaveBeenCalled()
    expect(JSON.stringify(body)).not.toContain(SECRET)
  })

  it("forwards the Vercel Cron bearer token to publish-scheduled", async () => {
    const { GET } = await import("../../app/api/cron/run-pipeline/route")
    const response = await GET(
      new NextRequest("http://localhost/api/cron/run-pipeline", {
        headers: {
          Authorization: `Bearer ${SECRET}`,
          "user-agent": "vercel-cron/1.0",
        },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stage: "publish", ok: true }),
      ])
    )

    const publishCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes("/api/cron/publish-scheduled"))

    expect(publishCall).toBeTruthy()
    const headers = new Headers(publishCall?.[1]?.headers)
    expect(headers.get("authorization")).toBe(`Bearer ${SECRET}`)
    expect(headers.get("x-invocation-source")).toBe("vercel-pipeline")
    expect(JSON.stringify(body)).not.toContain(SECRET)
  })
})
