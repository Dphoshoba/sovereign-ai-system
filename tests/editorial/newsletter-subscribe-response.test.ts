import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const findUnique = vi.fn()
const update = vi.fn()
const create = vi.fn()

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscriber: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      update: (...args: unknown[]) => update(...args),
      create: (...args: unknown[]) => create(...args),
    },
  },
}))

const STORED_SUBSCRIBER = {
  id: "subscriber-1",
  email: "reader@example.com",
  status: "active",
  source: "newsletter",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
}

const PUBLIC_ACK = { ok: true, subscribed: true }

function post(body: unknown) {
  return new NextRequest("http://localhost/api/newsletter/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/newsletter/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    findUnique.mockResolvedValue(null)
    update.mockResolvedValue(STORED_SUBSCRIBER)
    create.mockResolvedValue(STORED_SUBSCRIBER)
  })

  it("acknowledges a new subscription without the stored record", async () => {
    const { POST } = await import("../../app/api/newsletter/subscribe/route")
    const response = await POST(post({ email: " Reader@Example.com " }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(PUBLIC_ACK)
    expect(JSON.stringify(body)).not.toContain("subscriber-1")
    expect(create).toHaveBeenCalledWith({
      data: {
        email: "reader@example.com",
        status: "active",
        source: "newsletter",
      },
    })
    expect(update).not.toHaveBeenCalled()
  })

  it("uses the same acknowledgement for an existing subscriber", async () => {
    findUnique
      .mockResolvedValueOnce(STORED_SUBSCRIBER)
      .mockResolvedValueOnce(null)
    const { POST } = await import("../../app/api/newsletter/subscribe/route")
    const existing = await POST(post({ email: "reader@example.com", source: "footer" }))
    const created = await POST(post({ email: "new@example.com" }))
    const existingBody = await existing.json()
    const createdBody = await created.json()

    expect(existing.status).toBe(created.status)
    expect(existingBody).toEqual(PUBLIC_ACK)
    expect(createdBody).toEqual(PUBLIC_ACK)
    expect(update).toHaveBeenCalledWith({
      where: { email: "reader@example.com" },
      data: { status: "active", source: "footer" },
    })
    expect(JSON.stringify(existingBody)).not.toContain("reader@example.com")
  })

  it("rejects a missing or invalid email before writing", async () => {
    const { POST } = await import("../../app/api/newsletter/subscribe/route")
    const missing = await POST(post({}))
    const invalid = await POST(post({ email: "not-an-email" }))

    expect(missing.status).toBe(400)
    expect(invalid.status).toBe(400)
    expect(await missing.json()).toEqual(await invalid.json())
    expect(findUnique).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
  })

  it("does not reveal a stored subscriber when the write fails", async () => {
    findUnique.mockRejectedValue(new Error("Unique constraint failed on reader@example.com"))
    const { POST } = await import("../../app/api/newsletter/subscribe/route")
    const response = await POST(post({ email: "reader@example.com" }))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ ok: false, error: "Subscription failed" })
    expect(JSON.stringify(body)).not.toContain("reader@example.com")
  })
})
