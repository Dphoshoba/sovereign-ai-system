import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  AUTHENTICATION_REQUIRED_BODY,
  PUBLISHING_FORBIDDEN_BODY,
} from "../../lib/publishing/require-editor-auth"

const mockGetUser = vi.fn()
const subscriberUpdate = vi.fn()
const subscriberUpdateMany = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscriber: {
      update: (...args: unknown[]) => subscriberUpdate(...args),
      updateMany: (...args: unknown[]) => subscriberUpdateMany(...args),
    },
  },
}))

function session(user: Record<string, unknown> | null) {
  mockGetUser.mockResolvedValue({ data: { user }, error: null })
}

function editor() {
  return {
    id: "editor-1",
    email: "editor@example.com",
    role: "authenticated",
    app_metadata: { role: "editor" },
  }
}

function post(path: string, body?: unknown, headers?: HeadersInit) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

describe("subscriber mutation authorisation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    session(editor())
    subscriberUpdate.mockResolvedValue({
      id: "subscriber-1",
      email: "reader@example.com",
      status: "active",
    })
    subscriberUpdateMany.mockResolvedValue({ count: 2 })
  })

  it.each([
    ["backfill", "../../app/api/subscribers/backfill-source/route", "/api/subscribers/backfill-source"],
    ["reactivate", "../../app/api/subscribers/reactivate/route", "/api/subscribers/reactivate"],
    ["unsubscribe", "../../app/api/subscribers/unsubscribe/route", "/api/subscribers/unsubscribe"],
  ] as const)("rejects an anonymous %s before writing", async (_label, modulePath, path) => {
    session(null)
    const { POST } = await import(modulePath)
    const response = await POST(
      post(path, {
        subscriberId: "subscriber-1",
        role: "administrator",
      }, { "x-user-role": "administrator" }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY)
    expect(subscriberUpdate).not.toHaveBeenCalled()
    expect(subscriberUpdateMany).not.toHaveBeenCalled()
  })

  it.each(["viewer", "reviewer", "anon"] as const)(
    "rejects an authenticated %s before writing",
    async (role) => {
      session({
        id: "user-1",
        email: `${role}@example.com`,
        role,
        app_metadata: { role },
      })

      const backfill = await import("../../app/api/subscribers/backfill-source/route")
      const reactivate = await import("../../app/api/subscribers/reactivate/route")
      const unsubscribe = await import("../../app/api/subscribers/unsubscribe/route")

      const responses = await Promise.all([
        backfill.POST(),
        reactivate.POST(post("/api/subscribers/reactivate", { subscriberId: "subscriber-1", role: "editor" })),
        unsubscribe.POST(post("/api/subscribers/unsubscribe", { subscriberId: "subscriber-1", role: "editor" })),
      ])

      for (const response of responses) {
        expect(response.status).toBe(403)
        await expect(response.json()).resolves.toEqual(PUBLISHING_FORBIDDEN_BODY)
      }
      expect(subscriberUpdate).not.toHaveBeenCalled()
      expect(subscriberUpdateMany).not.toHaveBeenCalled()
    },
  )

  it.each([
    ["ordinary authenticated user", { id: "user-2", email: "new@example.com", role: "authenticated" }],
    ["missing editorial role", { id: "user-3", email: "missing@example.com" }],
    ["unknown role", { id: "user-4", email: "unknown@example.com", app_metadata: { role: "owner" } }],
    ["client-supplied role", {
      id: "user-5",
      email: "spoof@example.com",
      role: "authenticated",
      user_metadata: { role: "admin" },
    }],
  ] as const)("rejects a %s before writing", async (_label, user) => {
    session(user)
    const backfill = await import("../../app/api/subscribers/backfill-source/route")
    const response = await backfill.POST()

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual(PUBLISHING_FORBIDDEN_BODY)
    expect(subscriberUpdate).not.toHaveBeenCalled()
    expect(subscriberUpdateMany).not.toHaveBeenCalled()
  })

  it("backfills only missing sources for an explicit editor", async () => {
    const { POST } = await import("../../app/api/subscribers/backfill-source/route")

    const response = await POST()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, updated: 2 })
    expect(subscriberUpdateMany).toHaveBeenCalledWith({
      where: { source: null },
      data: { source: "legacy" },
    })
  })

  it("backfills only missing sources for an explicit admin", async () => {
    session({
      id: "admin-1",
      email: "admin@example.com",
      role: "authenticated",
      app_metadata: { role: "admin" },
    })
    const { POST } = await import("../../app/api/subscribers/backfill-source/route")

    const response = await POST()

    expect(response.status).toBe(200)
    expect(subscriberUpdateMany).toHaveBeenCalledTimes(1)
  })

  it("reactivates only the requested subscriber for an explicit editor", async () => {
    const { POST } = await import("../../app/api/subscribers/reactivate/route")

    const response = await POST(
      post("/api/subscribers/reactivate", {
        subscriberId: "subscriber-1",
        role: "administrator",
        status: "active",
      }),
    )

    expect(response.status).toBe(200)
    expect(subscriberUpdate).toHaveBeenCalledWith({
      where: { id: "subscriber-1" },
      data: { status: "active" },
    })
  })

  it("unsubscribes only the requested subscriber for an authorised editor", async () => {
    subscriberUpdate.mockResolvedValue({
      id: "subscriber-1",
      status: "unsubscribed",
    })
    const { POST } = await import("../../app/api/subscribers/unsubscribe/route")

    const response = await POST(
      post("/api/subscribers/unsubscribe", { subscriberId: "subscriber-1" }),
    )

    expect(response.status).toBe(200)
    expect(subscriberUpdate).toHaveBeenCalledWith({
      where: { id: "subscriber-1" },
      data: { status: "unsubscribed" },
    })
  })

  it("does not reactivate when the identifier is missing", async () => {
    const { POST } = await import("../../app/api/subscribers/reactivate/route")

    const response = await POST(post("/api/subscribers/reactivate", {}))

    expect(response.status).toBe(400)
    expect(subscriberUpdate).not.toHaveBeenCalled()
  })
})
