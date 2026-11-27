import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  AUTHENTICATION_REQUIRED_BODY,
  EDITOR_FORBIDDEN_BODY,
} from "../../lib/publishing/require-editor-auth"

const mockGetUser = vi.fn()
const ruleFindMany = vi.fn()
const ruleCreate = vi.fn()
const approvalFindMany = vi.fn()
const approvalUpdate = vi.fn()
const operationFindMany = vi.fn()
const operationFindFirst = vi.fn()
const operationCreate = vi.fn()
const eventFindMany = vi.fn()
const eventCreate = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aiPermissionRule: {
      findMany: (...args: unknown[]) => ruleFindMany(...args),
      create: (...args: unknown[]) => ruleCreate(...args),
    },
    aiApprovalRequest: {
      findMany: (...args: unknown[]) => approvalFindMany(...args),
      update: (...args: unknown[]) => approvalUpdate(...args),
    },
    aiScheduledOperation: {
      findMany: (...args: unknown[]) => operationFindMany(...args),
      findFirst: (...args: unknown[]) => operationFindFirst(...args),
      create: (...args: unknown[]) => operationCreate(...args),
    },
    aiActivityEvent: {
      findMany: (...args: unknown[]) => eventFindMany(...args),
      create: (...args: unknown[]) => eventCreate(...args),
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

function post(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("editor authentication for governance, scheduler, and activity", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    session(null)
    ruleFindMany.mockResolvedValue([{ id: "rule-1", action: "publish" }])
    approvalFindMany.mockResolvedValue([{ id: "approval-1", action: "publish" }])
    approvalUpdate.mockImplementation(
      async ({ where, data }: { where: { id: string }; data: { status: string; reason: string | null } }) => ({
        id: where.id,
        action: "save_memory",
        status: data.status,
        reason: data.reason,
      }),
    )
    operationFindMany.mockResolvedValue([{ id: "operation-1", name: "Daily" }])
    operationFindFirst.mockResolvedValue(null)
    operationCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "operation-2",
      name: data.name,
      type: data.type,
    }))
    eventFindMany.mockResolvedValue([{ id: "event-1", title: "Started" }])
    eventCreate.mockResolvedValue({ id: "event-2" })
    ruleCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "rule-2",
      action: data.action,
      allowed: data.allowed,
    }))
  })

  it("rejects an anonymous governance read before querying rules", async () => {
    const { GET } = await import("../../app/api/ai/governance/route")
    const response = await GET()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY)
    expect(ruleFindMany).not.toHaveBeenCalled()
    expect(approvalFindMany).not.toHaveBeenCalled()
  })

  it("rejects an authenticated non-editor governance read", async () => {
    session(user("viewer"))
    const { GET } = await import("../../app/api/ai/governance/route")
    const response = await GET()

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual(EDITOR_FORBIDDEN_BODY)
    expect(ruleFindMany).not.toHaveBeenCalled()
  })

  it("returns governance records to an editor", async () => {
    session(user("editor"))
    const { GET } = await import("../../app/api/ai/governance/route")
    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      rules: [{ id: "rule-1", action: "publish" }],
      approvals: [{ id: "approval-1", action: "publish" }],
    })
    expect(ruleFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 100,
    })
    expect(approvalFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 100,
    })
  })

  it("rejects an anonymous governance write before creating a rule", async () => {
    const { POST } = await import("../../app/api/ai/governance/route")
    const response = await POST(post("/api/ai/governance", { action: "publish", allowed: true }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY)
    expect(ruleCreate).not.toHaveBeenCalled()
    expect(eventCreate).not.toHaveBeenCalled()
  })

  it("rejects an authenticated non-editor governance write", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/ai/governance/route")
    const response = await POST(post("/api/ai/governance", { action: "publish", allowed: false }))

    expect(response.status).toBe(403)
    expect(ruleCreate).not.toHaveBeenCalled()
  })

  it("keeps the governance write contract for an editor", async () => {
    session(user("admin"))
    const { POST } = await import("../../app/api/ai/governance/route")
    const response = await POST(
      post("/api/ai/governance", {
        action: "publish",
        allowed: true,
        requiresApproval: false,
        notes: "Editors only",
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      rule: { id: "rule-2", action: "publish", allowed: true },
    })
    expect(ruleCreate).toHaveBeenCalledWith({
      data: {
        agentId: null,
        department: null,
        action: "publish",
        allowed: true,
        requiresApproval: false,
        notes: "Editors only",
      },
    })
  })

  it("rejects an anonymous scheduler read before querying operations", async () => {
    const { GET } = await import("../../app/api/ai/scheduler/route")
    const response = await GET()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY)
    expect(operationFindMany).not.toHaveBeenCalled()
  })

  it("rejects an authenticated non-editor scheduler read", async () => {
    session(user("viewer"))
    const { GET } = await import("../../app/api/ai/scheduler/route")
    const response = await GET()

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual(EDITOR_FORBIDDEN_BODY)
    expect(operationFindMany).not.toHaveBeenCalled()
  })

  it("returns scheduled operations to an editor", async () => {
    session(user("editor"))
    const { GET } = await import("../../app/api/ai/scheduler/route")
    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      operations: [{ id: "operation-1", name: "Daily" }],
    })
    expect(operationFindMany).toHaveBeenCalledWith({
      orderBy: { nextRunAt: "asc" },
      take: 100,
    })
  })

  it("rejects an anonymous scheduler write before looking up an operation", async () => {
    const { POST } = await import("../../app/api/ai/scheduler/route")
    const response = await POST(
      post("/api/ai/scheduler", { name: "Daily", type: "publish", frequency: "daily" }),
    )

    expect(response.status).toBe(401)
    expect(operationFindFirst).not.toHaveBeenCalled()
    expect(operationCreate).not.toHaveBeenCalled()
  })

  it("rejects an authenticated non-editor scheduler write", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/ai/scheduler/route")
    const response = await POST(post("/api/ai/scheduler", { name: "Daily", type: "publish" }))

    expect(response.status).toBe(403)
    expect(operationCreate).not.toHaveBeenCalled()
  })

  it("keeps the scheduler write contract for an editor", async () => {
    session(user("editor"))
    const { POST } = await import("../../app/api/ai/scheduler/route")
    const response = await POST(
      post("/api/ai/scheduler", { name: "Daily", type: "publish", frequency: "weekly" }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      operation: { id: "operation-2", name: "Daily", type: "publish" },
    })
    expect(operationFindFirst).toHaveBeenCalledWith({
      where: { name: "Daily", type: "publish", status: "active" },
    })
    expect(operationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Daily",
        type: "publish",
        status: "active",
        frequency: "weekly",
        payload: {},
      }),
    })
  })

  it("rejects an anonymous activity read before querying events", async () => {
    const { GET } = await import("../../app/api/ai/activity/route")
    const response = await GET()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY)
    expect(eventFindMany).not.toHaveBeenCalled()
  })

  it("rejects an authenticated non-editor activity read", async () => {
    session(user("viewer"))
    const { GET } = await import("../../app/api/ai/activity/route")
    const response = await GET()

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual(EDITOR_FORBIDDEN_BODY)
    expect(eventFindMany).not.toHaveBeenCalled()
  })

  it("returns activity events to an editor", async () => {
    session(user("admin"))
    const { GET } = await import("../../app/api/ai/activity/route")
    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      events: [{ id: "event-1", title: "Started" }],
    })
    expect(eventFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 100,
    })
  })

  it("rejects an anonymous activity write before creating an event", async () => {
    const { POST } = await import("../../app/api/ai/activity/route")
    const response = await POST(post("/api/ai/activity", { title: "Manual test event" }))

    expect(response.status).toBe(401)
    expect(eventCreate).not.toHaveBeenCalled()
  })

  it("rejects an authenticated non-editor activity write", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/ai/activity/route")
    const response = await POST(post("/api/ai/activity", { title: "Manual test event" }))

    expect(response.status).toBe(403)
    expect(eventCreate).not.toHaveBeenCalled()
  })

  it("keeps the activity write contract for an editor", async () => {
    session(user("editor"))
    const { POST } = await import("../../app/api/ai/activity/route")
    const response = await POST(
      post("/api/ai/activity", {
        type: "test",
        title: "Manual test event",
        message: "The activity stream is receiving events correctly.",
        status: "success",
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      event: { id: "event-2" },
    })
    expect(eventCreate).toHaveBeenCalledWith({
      data: {
        type: "test",
        title: "Manual test event",
        message: "The activity stream is receiving events correctly.",
        status: "success",
        metadata: {},
      },
    })
  })

  it("rejects an anonymous approval decision before updating the request", async () => {
    const { POST } = await import("../../app/api/ai/governance/approval/route")
    const response = await POST(
      post("/api/ai/governance/approval", {
        id: "approval-1",
        status: "approved",
        reason: "Approved by admin.",
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY)
    expect(approvalUpdate).not.toHaveBeenCalled()
    expect(eventCreate).not.toHaveBeenCalled()
  })

  it("rejects an authenticated non-editor approval decision", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/ai/governance/approval/route")
    const response = await POST(
      post("/api/ai/governance/approval", {
        id: "approval-1",
        status: "rejected",
        reason: "Rejected by admin.",
      }),
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual(EDITOR_FORBIDDEN_BODY)
    expect(approvalUpdate).not.toHaveBeenCalled()
    expect(eventCreate).not.toHaveBeenCalled()
  })

  it("keeps the approval decision contract for an editor", async () => {
    session(user("editor"))
    const { POST } = await import("../../app/api/ai/governance/approval/route")
    const response = await POST(
      post("/api/ai/governance/approval", {
        id: "approval-1",
        status: "approved",
        reason: "Approved by admin.",
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      approval: {
        id: "approval-1",
        action: "save_memory",
        status: "approved",
        reason: "Approved by admin.",
      },
    })
    expect(approvalUpdate).toHaveBeenCalledWith({
      where: { id: "approval-1" },
      data: { status: "approved", reason: "Approved by admin." },
    })
    expect(eventCreate).toHaveBeenCalledWith({
      data: {
        type: "governance",
        title: "Approval approved: save_memory",
        message: "Approved by admin.",
        status: "success",
        metadata: {
          id: "approval-1",
          action: "save_memory",
          status: "approved",
          reason: "Approved by admin.",
        },
      },
    })
  })
})
