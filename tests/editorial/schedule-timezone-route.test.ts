import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { NAIVE_SCHEDULE_ERROR } from "../../lib/publishing/adelaide-time"

const transitionArticleLifecycle = vi.fn()
const mockGetUser = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}))

vi.mock("../../lib/publishing/article-lifecycle", () => ({
  transitionArticleLifecycle: (...args: unknown[]) =>
    transitionArticleLifecycle(...args),
}))

describe("POST /api/articles/schedule timezone contract", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@example.com" } },
      error: null,
    })
    transitionArticleLifecycle.mockResolvedValue({
      ok: true,
      article: {
        id: "article-1",
        status: "scheduled",
        scheduledFor: new Date("2026-09-14T03:32:00.000Z"),
      },
      alreadyApplied: false,
      articleUnchanged: false,
    })
  })

  it("rejects offset-free timestamps", async () => {
    const { POST } = await import("../../app/api/articles/schedule/route")
    const response = await POST(
      new NextRequest("http://localhost/api/articles/schedule", {
        method: "POST",
        body: JSON.stringify({
          articleId: "article-1",
          scheduledFor: "2026-09-14T13:02",
        }),
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe(NAIVE_SCHEDULE_ERROR)
    expect(transitionArticleLifecycle).not.toHaveBeenCalled()
  })

  it("stores the Adelaide instant on a UTC server", async () => {
    const { POST } = await import("../../app/api/articles/schedule/route")
    const response = await POST(
      new NextRequest("http://localhost/api/articles/schedule", {
        method: "POST",
        body: JSON.stringify({
          articleId: "article-1",
          scheduledFor: "2026-09-14T13:02:00+09:30",
        }),
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(transitionArticleLifecycle).toHaveBeenCalledWith(
      {
        articleId: "article-1",
        transition: "schedule",
        scheduledFor: new Date("2026-09-14T03:32:00.000Z"),
      },
      expect.any(Object),
    )
    expect(new Date(body.article.scheduledFor).toISOString()).toBe(
      "2026-09-14T03:32:00.000Z",
    )
  })

  it("rejects scheduling when only a stale audit exists", async () => {
    transitionArticleLifecycle.mockResolvedValue({
      ok: false,
      code: "stale_audit",
      error:
        "A current research audit matching this content revision is required.",
      articleUnchanged: true,
    })

    const { POST } = await import("../../app/api/articles/schedule/route")
    const response = await POST(
      new NextRequest("http://localhost/api/articles/schedule", {
        method: "POST",
        body: JSON.stringify({
          articleId: "article-1",
          scheduledFor: "2026-09-14T13:02:00+09:30",
        }),
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error).toContain("current research audit")
    expect(body.articleUnchanged).toBe(true)
  })
})
