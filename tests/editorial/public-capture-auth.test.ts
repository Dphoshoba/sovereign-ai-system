import { beforeEach, describe, expect, it, vi } from "vitest"
import { AUTHENTICATION_REQUIRED_BODY } from "../../lib/publishing/require-editor-auth"

const mockGetUser = vi.fn()
const leadFindUnique = vi.fn()
const leadCreate = vi.fn()
const leadFindMany = vi.fn()
const auditFindFirst = vi.fn()
const auditCreate = vi.fn()
const auditFindMany = vi.fn()
const modelCreate = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser: mockGetUser },
  }),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    creatorLead: {
      findUnique: leadFindUnique,
      create: leadCreate,
      findMany: leadFindMany,
    },
    creatorAuditRequest: {
      create: auditCreate,
      findMany: auditFindMany,
      findFirst: auditFindFirst,
    },
  },
}))

vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: () => ({
    responses: { create: modelCreate },
  }),
}))

function session(role: "editor" | "viewer" | null) {
  mockGetUser.mockResolvedValue({
    data: {
      user:
        role === null
          ? null
          : {
              id: `${role}-1`,
              email: `${role}@example.com`,
              app_metadata: { role },
            },
    },
    error: null,
  })
}

function post(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("public capture separated from privileged reads and model calls", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    leadFindUnique.mockResolvedValue(null)
    leadCreate.mockResolvedValue({ id: "lead-1" })
    auditFindFirst.mockResolvedValue(null)
    auditCreate.mockResolvedValue({ id: "audit-1" })
    modelCreate.mockResolvedValue({
      output_text: JSON.stringify({
        opportunityScore: 75,
        auditSummary: "summary",
        recommendedSystems: "systems",
        nextActions: "actions",
        proposalDraft: "draft",
      }),
    })
    session(null)
  })

  it("accepts a public creator lead without returning the stored record", async () => {
    const { POST } = await import("../../app/api/creator-leads/route")
    const response = await POST(
      post("/api/creator-leads", {
        name: "Ada",
        email: "Ada@Example.com",
        creatorType: "writer",
        actorEmail: "spoofed@example.com",
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ ok: true })
    expect(leadCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Ada",
        email: "ada@example.com",
        creatorType: "writer",
      }),
    })
    expect(JSON.stringify(leadCreate.mock.calls[0][0])).not.toContain("spoofed@example.com")
    expect(modelCreate).not.toHaveBeenCalled()
  })

  it("rejects an invalid public lead before writing", async () => {
    const { POST } = await import("../../app/api/creator-leads/route")
    const response = await POST(
      post("/api/creator-leads", { name: "Ada", email: "not-an-email" })
    )

    expect(response.status).toBe(400)
    expect(leadCreate).not.toHaveBeenCalled()
    expect(leadFindUnique).not.toHaveBeenCalled()
  })

  it("hides an existing lead record from a repeat public submission", async () => {
    leadFindUnique.mockResolvedValue({
      id: "lead-1",
      email: "ada@example.com",
      leadScore: 90,
      notes: "private",
    })
    const { POST } = await import("../../app/api/creator-leads/route")
    const response = await POST(
      post("/api/creator-leads", { name: "Ada", email: "ada@example.com" })
    )

    expect(await response.json()).toEqual({ ok: true })
    expect(leadCreate).not.toHaveBeenCalled()
  })

  it("keeps the creator lead list editor-only", async () => {
    const { GET } = await import("../../app/api/creator-leads/route")
    const response = await GET()

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual(AUTHENTICATION_REQUIRED_BODY)
    expect(leadFindMany).not.toHaveBeenCalled()
  })

  it("stores a public audit request without calling the model", async () => {
    const { POST } = await import("../../app/api/creator-audit/route")
    const response = await POST(
      post("/api/creator-audit", {
        name: "Ada",
        email: "ada@example.com",
        biggestBottleneck: "publishing",
        actorEmail: "spoofed@example.com",
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ ok: true })
    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Ada",
        email: "ada@example.com",
        biggestBottleneck: "publishing",
        status: "audit-requested",
      }),
    })
    expect(modelCreate).not.toHaveBeenCalled()
    expect(JSON.stringify(auditCreate.mock.calls[0][0])).not.toContain("spoofed@example.com")
  })

  it("lets an editor audit request call the model", async () => {
    session("editor")
    const { POST } = await import("../../app/api/creator-audit/route")
    const response = await POST(
      post("/api/creator-audit", {
        name: "Ada",
        email: "ada@example.com",
        secretNote: "secret-note",
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.audit).toBeTruthy()
    expect(modelCreate).toHaveBeenCalledOnce()
    expect(String(modelCreate.mock.calls[0][0].input)).not.toContain("secret-note")
  })

  it("does not store a second public audit for the same address", async () => {
    auditFindFirst.mockResolvedValue({ id: "audit-1" })
    const { POST } = await import("../../app/api/creator-audit/route")
    const response = await POST(
      post("/api/creator-audit", { name: "Ada", email: "ada@example.com" })
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(auditCreate).not.toHaveBeenCalled()
    expect(modelCreate).not.toHaveBeenCalled()
  })

  it("stops a burst of public lead submissions before another write", async () => {
    const { POST } = await import("../../app/api/creator-leads/route")
    const burst = (n: number) =>
      new Request("http://localhost/api/creator-leads", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "203.0.113.50",
        },
        body: JSON.stringify({ name: "Ada", email: `ada${n}@example.com` }),
      })

    for (let n = 0; n < 8; n += 1) {
      expect((await POST(burst(n))).status).toBe(200)
    }
    const blocked = await POST(burst(8))
    expect(blocked.status).toBe(429)
    expect(leadCreate).toHaveBeenCalledTimes(8)
  })

  it("does not let a non-editor trigger the audit model", async () => {
    session("viewer")
    const { POST } = await import("../../app/api/creator-audit/route")
    const response = await POST(
      post("/api/creator-audit", { name: "Ada", email: "ada@example.com" })
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(modelCreate).not.toHaveBeenCalled()
  })
})
