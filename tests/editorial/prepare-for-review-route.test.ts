import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const mockGetUser = vi.fn()
const mockPrepare = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: { article: {} },
}))

vi.mock("../../lib/research/prepare-article-for-review", () => ({
  prepareArticleForReview: (...args: unknown[]) => mockPrepare(...args),
}))

describe("POST /api/articles/prepare-for-review authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrepare.mockReset()
  })

  it("rejects unauthenticated requests and does not prepare the article", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const { POST } = await import("../../app/api/articles/prepare-for-review/route")

    const response = await POST(
      new NextRequest("http://localhost/api/articles/prepare-for-review", {
        method: "POST",
        body: JSON.stringify({ articleId: "article-1" }),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toMatchObject({
      ok: false,
      error: "Authentication required.",
    })
    expect(mockPrepare).not.toHaveBeenCalled()
  })

  it("allows an authenticated admin to prepare an article", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "admin@example.com" } },
      error: null,
    })
    mockPrepare.mockResolvedValue({
      ok: true,
      article: { id: "article-1", status: "review-required" },
      audit: { sourceCount: 1 },
      sourceDiagnostics: [],
    })

    const { POST } = await import("../../app/api/articles/prepare-for-review/route")

    const response = await POST(
      new NextRequest("http://localhost/api/articles/prepare-for-review", {
        method: "POST",
        body: JSON.stringify({ articleId: "article-1" }),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(mockPrepare).toHaveBeenCalledWith("article-1", {
      prisma: expect.anything(),
      reviewer: "admin@example.com",
    })
    expect(body.sourceDiagnostics).toEqual([])
  })

  it("returns sanitized source diagnostics on failed preparation", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "admin@example.com" } },
      error: null,
    })
    mockPrepare.mockResolvedValue({
      ok: false,
      code: "missing_evidence",
      error: "Required evidence could not be collected.",
      articleUnchanged: true,
      sourceDiagnostics: [
        {
          sourceId: "pwc-2026",
          hostname: "www.pwc.com",
          documentType: "unknown",
          category: "http_forbidden",
          httpStatusCategory: "forbidden",
          bytesReceived: 0,
          extractedCharacterCount: 0,
          acceptedPassageCount: 0,
          rejectionReason: "Source refused the request.",
        },
      ],
    })

    const { POST } = await import("../../app/api/articles/prepare-for-review/route")
    const response = await POST(
      new NextRequest("http://localhost/api/articles/prepare-for-review", {
        method: "POST",
        body: JSON.stringify({ articleId: "article-1" }),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body.sourceDiagnostics[0].category).toBe("http_forbidden")
    expect(JSON.stringify(body)).not.toMatch(/cookie|authorization|secret|192\.168|stack/i)
  })
})
