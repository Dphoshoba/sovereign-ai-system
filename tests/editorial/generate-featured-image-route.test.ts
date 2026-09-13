import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const mockGetUser = vi.fn()
const mockGenerate = vi.fn()

const SERVICE_ROLE_CANARY = "service-role-canary-do-not-leak"

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}))

vi.mock("../../lib/ai/persist-featured-image", () => ({
  generateAndPersistFeaturedImage: (...args: unknown[]) => mockGenerate(...args),
}))

describe("POST /api/ai/generate-featured-image", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.OPENAI_API_KEY = "test-openai-key"
    process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_ROLE_CANARY
  })

  it("rejects unauthenticated requests and does not generate or persist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const { POST } = await import("../../app/api/ai/generate-featured-image/route")

    const response = await POST(
      new NextRequest("http://localhost/api/ai/generate-featured-image", {
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
    expect(mockGenerate).not.toHaveBeenCalled()
    expect(JSON.stringify(body)).not.toContain(SERVICE_ROLE_CANARY)
  })

  it("persists a durable URL for an authenticated admin", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "admin@example.com" } },
      error: null,
    })
    mockGenerate.mockResolvedValue({
      ok: true,
      article: {
        id: "article-1",
        featuredImage:
          "https://kqptdgbttfuqkzxzbazw.supabase.co/storage/v1/object/public/article-images/ai-automation-for-creators/img.png",
      },
      imageUrl:
        "https://kqptdgbttfuqkzxzbazw.supabase.co/storage/v1/object/public/article-images/ai-automation-for-creators/img.png",
      editorialQuality: { score: 80, grade: "B", warnings: [] },
      articleUnchanged: false,
    })

    const { POST } = await import("../../app/api/ai/generate-featured-image/route")

    const response = await POST(
      new NextRequest("http://localhost/api/ai/generate-featured-image", {
        method: "POST",
        body: JSON.stringify({ articleId: "article-1" }),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.imageUrl).toContain("/storage/v1/object/public/article-images/")
    expect(body.article.featuredImage).toBe(body.imageUrl)
    expect(mockGenerate).toHaveBeenCalledWith({ articleId: "article-1" })
    expect(JSON.stringify(body)).not.toContain(SERVICE_ROLE_CANARY)
    expect(JSON.stringify(body)).not.toContain("SUPABASE_SERVICE_ROLE_KEY")
  })

  it("does not expose the service-role credential when upload fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "admin@example.com" } },
      error: null,
    })
    mockGenerate.mockResolvedValue({
      ok: false,
      error: "Image upload failed",
      articleUnchanged: true,
    })

    const { POST } = await import("../../app/api/ai/generate-featured-image/route")

    const response = await POST(
      new NextRequest("http://localhost/api/ai/generate-featured-image", {
        method: "POST",
        body: JSON.stringify({ articleId: "article-1" }),
      })
    )
    const body = await response.json()
    const serialized = JSON.stringify(body)

    expect(response.status).toBe(500)
    expect(body).toMatchObject({
      ok: false,
      error: "Image upload failed",
      articleUnchanged: true,
    })
    expect(serialized).not.toContain(SERVICE_ROLE_CANARY)
    expect(serialized).not.toMatch(/eyJ[a-zA-Z0-9_-]{10,}\./)
  })
})
