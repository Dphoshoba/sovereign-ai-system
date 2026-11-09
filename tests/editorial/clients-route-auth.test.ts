import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  AUTHENTICATION_REQUIRED_BODY,
  EDITOR_FORBIDDEN_BODY,
} from "../../lib/publishing/require-editor-auth"

const mockGetUser = vi.fn()
const findMany = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    clientProfile: {
      findMany: (...args: unknown[]) => findMany(...args),
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

describe("GET /api/clients", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    session(null)
    findMany.mockResolvedValue([
      { id: "client-1", name: "Private client", email: "private@example.com" },
    ])
  })

  it("rejects an anonymous request before reading client profiles", async () => {
    const { GET } = await import("../../app/api/clients/route")
    const response = await GET()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY)
    expect(findMany).not.toHaveBeenCalled()
  })

  it("rejects an authenticated non-editor before reading client profiles", async () => {
    session(user("viewer"))
    const { GET } = await import("../../app/api/clients/route")
    const response = await GET()

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual(EDITOR_FORBIDDEN_BODY)
    expect(findMany).not.toHaveBeenCalled()
  })

  it("returns client profiles to an editor", async () => {
    session(user("editor"))
    const { GET } = await import("../../app/api/clients/route")
    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      clients: [{ id: "client-1" }],
    })
    expect(findMany).toHaveBeenCalledWith({
      where: { type: "client" },
      orderBy: { createdAt: "desc" },
    })
  })

  it("does not return database details when the client query fails", async () => {
    session(user("admin"))
    findMany.mockRejectedValue(new Error("client private@example.com"))
    const { GET } = await import("../../app/api/clients/route")
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ ok: false, error: "Failed to fetch clients" })
    expect(JSON.stringify(body)).not.toContain("private@example.com")
  })
})
