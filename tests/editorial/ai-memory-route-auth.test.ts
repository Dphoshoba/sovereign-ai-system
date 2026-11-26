import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  AUTHENTICATION_REQUIRED_BODY,
  EDITOR_FORBIDDEN_BODY,
} from "../../lib/publishing/require-editor-auth"

const mockGetUser = vi.fn()
const findMany = vi.fn()
const create = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aiMemory: {
      findMany: (...args: unknown[]) => findMany(...args),
      create: (...args: unknown[]) => create(...args),
    },
  },
}))

function session(user: Record<string, unknown> | null) {
  mockGetUser.mockResolvedValue({ data: { user }, error: null })
}

function user(role: string) {
  return {
    id: `${role}-1`,
    email: `${role}@example.com`,
    role: "authenticated",
    app_metadata: { role },
  }
}

function post(body: unknown) {
  return new Request("http://localhost/api/ai/memory?id=other-user&userId=other-user", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("GET and POST /api/ai/memory", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    session(null)
    findMany.mockResolvedValue([{ id: "memory-1", title: "Strategy" }])
    create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "memory-2",
      ...data,
    }))
  })

  it("rejects an anonymous read before querying memory", async () => {
    const { GET } = await import("../../app/api/ai/memory/route")
    const response = await GET()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY)
    expect(findMany).not.toHaveBeenCalled()
  })

  it("rejects an authenticated non-editor read", async () => {
    session(user("viewer"))
    const { GET } = await import("../../app/api/ai/memory/route")
    const response = await GET()

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual(EDITOR_FORBIDDEN_BODY)
    expect(findMany).not.toHaveBeenCalled()
  })

  it("returns editorial memory to an editor without a caller-selected record", async () => {
    session(user("editor"))
    const { GET } = await import("../../app/api/ai/memory/route")
    const response = await GET()

    expect(response.status).toBe(200)
    expect(findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 100,
    })
  })

  it("rejects an anonymous write before creating memory", async () => {
    const { POST } = await import("../../app/api/ai/memory/route")
    const response = await POST(post({ title: "Note", content: "Private", id: "other-user" }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY)
    expect(create).not.toHaveBeenCalled()
  })

  it("rejects an authenticated non-editor write", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/ai/memory/route")
    const response = await POST(
      post({ title: "Note", content: "Private", userId: "other-user" }),
    )

    expect(response.status).toBe(403)
    expect(create).not.toHaveBeenCalled()
  })

  it("stores only editorial fields when an editor supplies another identifier", async () => {
    session(user("admin"))
    const { POST } = await import("../../app/api/ai/memory/route")
    const response = await POST(
      post({
        id: "other-memory",
        userId: "other-user",
        ownerId: "other-owner",
        clientId: "other-client",
        type: "strategy",
        title: " Brand voice ",
        content: " Keep the voice consistent. ",
        source: "manual",
        tags: "voice",
      }),
    )

    expect(response.status).toBe(200)
    expect(create).toHaveBeenCalledWith({
      data: {
        type: "strategy",
        title: "Brand voice",
        content: "Keep the voice consistent.",
        source: "manual",
        tags: "voice",
      },
    })
    expect(findMany).not.toHaveBeenCalled()
  })

  it("does not write when title or content is missing", async () => {
    session(user("editor"))
    const { POST } = await import("../../app/api/ai/memory/route")
    const response = await POST(post({ title: " ", content: "", id: "other-memory" }))

    expect(response.status).toBe(400)
    expect(create).not.toHaveBeenCalled()
  })
})
