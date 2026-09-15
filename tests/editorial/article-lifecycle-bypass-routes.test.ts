import { beforeEach, describe, expect, it, vi } from "vitest"

const mockGetUser = vi.fn()
const mockUpdateArticle = vi.fn()
const mockQueueUpdate = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    publishingQueue: {
      update: (...args: unknown[]) => mockQueueUpdate(...args),
    },
  },
}))

vi.mock("../../lib/publishing/article-lifecycle", () => ({
  updateArticleUnderGovernanceLock: (...args: unknown[]) =>
    mockUpdateArticle(...args),
}))

const articleId = "article-1"

async function patchArticle(body: Record<string, unknown>) {
  const { PATCH } = await import("../../app/api/articles/[id]/route")
  return PATCH(
    new Request(`http://localhost/api/articles/${articleId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: articleId }) },
  )
}

async function updateQueue(body: Record<string, unknown>) {
  const { POST } = await import("../../app/api/publishing/build-queue/route")
  return POST(
    new Request("http://localhost/api/publishing/build-queue", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  )
}

describe("C1 article lifecycle bypass protection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@example.com" } },
      error: null,
    })
    mockUpdateArticle.mockResolvedValue({
      ok: true,
      article: { id: articleId, title: "Edited title", status: "draft" },
      alreadyApplied: false,
    })
    mockQueueUpdate.mockResolvedValue({
      id: "queue-1",
      status: "scheduled",
      scheduledAt: new Date("2026-09-20T00:00:00.000Z"),
      publishedAt: null,
    })
  })

  it.each(["approved", "scheduled", "published"])(
    "rejects a direct PATCH transition to %s without an article write",
    async (status) => {
      const response = await patchArticle({ status })
      const body = await response.json()

      expect(response.status).toBe(409)
      expect(body).toMatchObject({
        ok: false,
        code: "GOVERNED_LIFECYCLE_ROUTE_REQUIRED",
        articleUnchanged: true,
      })
      expect(mockUpdateArticle).not.toHaveBeenCalled()
    },
  )

  it.each(["approvedAt", "approvedBy", "scheduledFor", "publishedAt"])(
    "rejects direct PATCH of the governed %s field without an article write",
    async (field) => {
      const response = await patchArticle({
        [field]:
          field === "approvedBy"
            ? "caller-controlled"
            : "2026-09-20T00:00:00.000Z",
      })
      const body = await response.json()

      expect(response.status).toBe(409)
      expect(body).toMatchObject({
        ok: false,
        code: "GOVERNED_LIFECYCLE_FIELD_NOT_ALLOWED",
        articleUnchanged: true,
      })
      expect(mockUpdateArticle).not.toHaveBeenCalled()
    },
  )

  it("allows a normal authenticated content edit", async () => {
    const response = await patchArticle({
      title: "Edited title",
      content: "Edited body",
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({ ok: true, article: { id: articleId } })
    expect(mockUpdateArticle).toHaveBeenCalledWith(
      {
        articleId,
        changes: { title: "Edited title", content: "Edited body" },
      },
      { prisma: expect.anything() },
    )
  })

  it("rejects attempts to mark a build-queue item published", async () => {
    const response = await updateQueue({
      queueId: "queue-1",
      status: "published",
    })
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body).toMatchObject({
      ok: false,
      code: "GOVERNED_PUBLICATION_ROUTE_REQUIRED",
      articleUnchanged: true,
    })
    expect(mockQueueUpdate).not.toHaveBeenCalled()
    expect(mockUpdateArticle).not.toHaveBeenCalled()
  })

  it("keeps permitted build-queue updates queue-only", async () => {
    const response = await updateQueue({
      queueId: "queue-1",
      status: "scheduled",
      scheduledAt: "2026-09-20T00:00:00.000Z",
    })

    expect(response.status).toBe(200)
    expect(mockQueueUpdate).toHaveBeenCalledWith({
      where: { id: "queue-1" },
      data: {
        status: "scheduled",
        scheduledAt: new Date("2026-09-20T00:00:00.000Z"),
      },
    })
    expect(mockUpdateArticle).not.toHaveBeenCalled()
  })

  it("never sends publishedAt in a build-queue write", async () => {
    await updateQueue({ queueId: "queue-1", status: "queued" })

    const write = mockQueueUpdate.mock.calls[0]?.[0]
    expect(write.data).not.toHaveProperty("publishedAt")
  })

  it.each([
    ["article PATCH", () => patchArticle({ title: "Blocked edit" })],
    [
      "build-queue update",
      () => updateQueue({ queueId: "queue-1", status: "scheduled" }),
    ],
  ])("rejects an unauthenticated %s without writes", async (_name, invoke) => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const response = await invoke()
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toMatchObject({
      ok: false,
      code: "AUTHENTICATION_REQUIRED",
      articleUnchanged: true,
    })
    expect(mockUpdateArticle).not.toHaveBeenCalled()
    expect(mockQueueUpdate).not.toHaveBeenCalled()
  })
})
