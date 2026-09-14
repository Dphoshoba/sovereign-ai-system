import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { NAIVE_SCHEDULE_ERROR } from "../../lib/publishing/adelaide-time"

const findUnique = vi.fn()
const update = vi.fn()

vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      update: (...args: unknown[]) => update(...args),
    },
  },
}))

describe("POST /api/articles/schedule timezone contract", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    findUnique.mockResolvedValue({
      id: "article-1",
      status: "approved",
    })
    update.mockImplementation(async ({ data }: { data: { scheduledFor: Date } }) => ({
      id: "article-1",
      status: "scheduled",
      scheduledFor: data.scheduledFor,
    }))
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
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe(NAIVE_SCHEDULE_ERROR)
    expect(update).not.toHaveBeenCalled()
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
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          scheduledFor: new Date("2026-09-14T03:32:00.000Z"),
        }),
      })
    )
    expect(new Date(body.article.scheduledFor).toISOString()).toBe(
      "2026-09-14T03:32:00.000Z"
    )
  })
})
