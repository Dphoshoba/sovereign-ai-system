import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  AUTHENTICATION_REQUIRED_BODY,
  EDITOR_FORBIDDEN_BODY,
} from "../../lib/publishing/require-editor-auth"

const mockGetUser = vi.fn()
const createResponse = vi.fn()
const permissionFindFirst = vi.fn()
const memoryCreate = vi.fn()
const jobCreate = vi.fn()
const activityCreate = vi.fn()
const approvalRequestCreate = vi.fn()
const clientCreate = vi.fn()
const jobFindMany = vi.fn()
const activityFindMany = vi.fn()
const agentFindMany = vi.fn()
const approvalRequestFindMany = vi.fn()
const scheduleFindMany = vi.fn()
const workflowFindMany = vi.fn()
const emptyFindMany = vi.fn()
const arbitrationCreate = vi.fn()
const matrixApprovalCreate = vi.fn()
const riskCreate = vi.fn()
const operationalCreate = vi.fn()
const matrixApprovalUpdate = vi.fn()
const arbitrationUpdate = vi.fn()
const riskUpdate = vi.fn()
const policyFindMany = vi.fn()
const policyCreateMany = vi.fn()
const arbitrationFindMany = vi.fn()
const matrixApprovalFindMany = vi.fn()
const riskFindMany = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: () => ({
    responses: { create: (...args: unknown[]) => createResponse(...args) },
  }),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aiPermissionRule: {
      findFirst: (...args: unknown[]) => permissionFindFirst(...args),
    },
    aiMemory: { create: (...args: unknown[]) => memoryCreate(...args) },
    aiJob: {
      create: (...args: unknown[]) => jobCreate(...args),
      findMany: (...args: unknown[]) => jobFindMany(...args),
    },
    aiActivityEvent: {
      create: (...args: unknown[]) => activityCreate(...args),
      findMany: (...args: unknown[]) => activityFindMany(...args),
    },
    aiApprovalRequest: {
      create: (...args: unknown[]) => approvalRequestCreate(...args),
      findMany: (...args: unknown[]) => approvalRequestFindMany(...args),
    },
    clientProfile: { create: (...args: unknown[]) => clientCreate(...args) },
    aiAgent: { findMany: (...args: unknown[]) => agentFindMany(...args) },
    aiScheduledOperation: {
      findMany: (...args: unknown[]) => scheduleFindMany(...args),
    },
    aiWorkflow: { findMany: (...args: unknown[]) => workflowFindMany(...args) },
    strategicInitiative: { findMany: (...args: unknown[]) => emptyFindMany(...args) },
    workflowExecution: { findMany: (...args: unknown[]) => emptyFindMany(...args) },
    autonomousMissionTask: { findMany: (...args: unknown[]) => emptyFindMany(...args) },
    emailExecution: { findMany: (...args: unknown[]) => emptyFindMany(...args) },
    runtimeRetryQueue: { findMany: (...args: unknown[]) => emptyFindMany(...args) },
    runtimeHeartbeat: { findMany: (...args: unknown[]) => emptyFindMany(...args) },
    orchestrationDecision: { findMany: (...args: unknown[]) => emptyFindMany(...args) },
    evolutionPolicyRecommendation: { findMany: (...args: unknown[]) => emptyFindMany(...args) },
    strategicPlan: { findMany: (...args: unknown[]) => emptyFindMany(...args) },
    strategicDecisionLog: { findMany: (...args: unknown[]) => emptyFindMany(...args) },
    operationalEvent: {
      findMany: (...args: unknown[]) => emptyFindMany(...args),
      create: (...args: unknown[]) => operationalCreate(...args),
    },
    governancePolicy: {
      findMany: (...args: unknown[]) => policyFindMany(...args),
      createMany: (...args: unknown[]) => policyCreateMany(...args),
    },
    governanceArbitration: {
      findMany: (...args: unknown[]) => arbitrationFindMany(...args),
      create: (...args: unknown[]) => arbitrationCreate(...args),
      update: (...args: unknown[]) => arbitrationUpdate(...args),
    },
    governanceApproval: {
      findMany: (...args: unknown[]) => matrixApprovalFindMany(...args),
      create: (...args: unknown[]) => matrixApprovalCreate(...args),
      update: (...args: unknown[]) => matrixApprovalUpdate(...args),
    },
    governanceRiskSignal: {
      findMany: (...args: unknown[]) => riskFindMany(...args),
      create: (...args: unknown[]) => riskCreate(...args),
      update: (...args: unknown[]) => riskUpdate(...args),
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

function post(path: string, body?: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

function expectNoPrivilegedWork() {
  expect(permissionFindFirst).not.toHaveBeenCalled()
  expect(memoryCreate).not.toHaveBeenCalled()
  expect(jobCreate).not.toHaveBeenCalled()
  expect(activityCreate).not.toHaveBeenCalled()
  expect(approvalRequestCreate).not.toHaveBeenCalled()
  expect(clientCreate).not.toHaveBeenCalled()
  expect(jobFindMany).not.toHaveBeenCalled()
  expect(activityFindMany).not.toHaveBeenCalled()
  expect(agentFindMany).not.toHaveBeenCalled()
  expect(approvalRequestFindMany).not.toHaveBeenCalled()
  expect(scheduleFindMany).not.toHaveBeenCalled()
  expect(workflowFindMany).not.toHaveBeenCalled()
  expect(emptyFindMany).not.toHaveBeenCalled()
  expect(arbitrationCreate).not.toHaveBeenCalled()
  expect(matrixApprovalCreate).not.toHaveBeenCalled()
  expect(riskCreate).not.toHaveBeenCalled()
  expect(operationalCreate).not.toHaveBeenCalled()
  expect(matrixApprovalUpdate).not.toHaveBeenCalled()
  expect(arbitrationUpdate).not.toHaveBeenCalled()
  expect(riskUpdate).not.toHaveBeenCalled()
  expect(policyFindMany).not.toHaveBeenCalled()
  expect(policyCreateMany).not.toHaveBeenCalled()
  expect(arbitrationFindMany).not.toHaveBeenCalled()
  expect(matrixApprovalFindMany).not.toHaveBeenCalled()
  expect(riskFindMany).not.toHaveBeenCalled()
  expect(createResponse).not.toHaveBeenCalled()
}

describe("remaining administrative API authorisation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    session(null)
    permissionFindFirst.mockResolvedValue({
      allowed: true,
      requiresApproval: false,
      notes: null,
    })
    memoryCreate.mockResolvedValue({ id: "memory-1" })
    activityCreate.mockResolvedValue({ id: "event-1" })
    jobFindMany.mockResolvedValue([
      { id: "job-running", status: "running" },
      { id: "job-queued", status: "queued" },
      { id: "job-failed", status: "failed" },
    ])
    activityFindMany.mockResolvedValue([{ id: "event-1" }])
    agentFindMany.mockResolvedValue([{ id: "agent-1" }])
    approvalRequestFindMany.mockResolvedValue([{ id: "approval-1", status: "pending" }])
    scheduleFindMany.mockResolvedValue([{ id: "schedule-1", status: "active" }])
    workflowFindMany.mockResolvedValue([{ id: "workflow-1", status: "active" }])
    emptyFindMany.mockResolvedValue([])
    policyFindMany.mockResolvedValue([{ id: "policy-1", title: "Existing policy" }])
    policyCreateMany.mockResolvedValue({ count: 2 })
    arbitrationFindMany.mockResolvedValue([{ id: "arbitration-existing" }])
    matrixApprovalFindMany.mockResolvedValue([{ id: "approval-existing" }])
    riskFindMany.mockResolvedValue([{ id: "risk-existing" }])
    createResponse.mockResolvedValue({
      output_text: JSON.stringify({
        arbitrations: [
          {
            title: "Resource conflict",
            arbitrationType: "resource-conflict",
            targetSystem: "runtime",
            severity: "high",
            rationale: "Two plans overlap",
            riskScore: 70,
            competingItems: [],
          },
        ],
        approvals: [
          {
            title: "Review email",
            targetType: "email",
            targetId: "email-1",
            priority: "high",
            rationale: "External send",
          },
        ],
        riskSignals: [
          {
            title: "Retry storm",
            signalType: "runtime-risk",
            severity: "medium",
            affectedArea: "runtime",
            description: "Retries are climbing",
            recommendation: "Pause automatic retries",
          },
        ],
      }),
    })
    arbitrationCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "arbitration-1",
      ...data,
    }))
    matrixApprovalCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "matrix-approval-1",
      ...data,
    }))
    riskCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "risk-1",
      ...data,
    }))
    operationalCreate.mockResolvedValue({ id: "operational-1" })
    matrixApprovalUpdate.mockImplementation(
      async ({ where, data }: { where: { id: string }; data: { status: string } }) => ({
        id: where.id,
        title: "Review email",
        status: data.status,
      }),
    )
  })

  it("rejects an anonymous tool execution before governance or writes", async () => {
    const { POST } = await import("../../app/api/ai/tool-execution/route")
    const response = await POST(
      post("/api/ai/tool-execution", {
        action: "save_memory",
        payload: { title: "Example Memory", content: "Private" },
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY)
    expectNoPrivilegedWork()
  })

  it("rejects an authenticated non-editor tool execution", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/ai/tool-execution/route")
    const response = await POST(
      post("/api/ai/tool-execution", { action: "create_crm_client", payload: { name: "Lead" } }),
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual(EDITOR_FORBIDDEN_BODY)
    expectNoPrivilegedWork()
  })

  it("keeps an authorised tool execution for an editor", async () => {
    session(user("editor"))
    const { POST } = await import("../../app/api/ai/tool-execution/route")
    const response = await POST(
      post("/api/ai/tool-execution", {
        action: "save_memory",
        payload: {
          type: "strategy",
          title: "Example Memory",
          content: "This is a saved memory from tool execution.",
          tags: "tool, memory",
        },
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      action: "save_memory",
      result: { id: "memory-1" },
    })
    expect(permissionFindFirst).toHaveBeenCalledWith({
      where: {
        action: "save_memory",
        OR: [{}, {}, { agentId: null, department: null }],
      },
      orderBy: { createdAt: "desc" },
    })
    expect(memoryCreate).toHaveBeenCalledWith({
      data: {
        type: "strategy",
        title: "Example Memory",
        content: "This is a saved memory from tool execution.",
        source: "tool-execution",
        tags: "tool, memory",
      },
    })
    expect(activityCreate).toHaveBeenCalledOnce()
  })

  it("rejects an anonymous live command center read", async () => {
    const { GET } = await import("../../app/api/ai/live-command-center/route")
    const response = await GET()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY)
    expectNoPrivilegedWork()
  })

  it("rejects an authenticated non-editor live command center read", async () => {
    session(user("viewer"))
    const { GET } = await import("../../app/api/ai/live-command-center/route")
    const response = await GET()

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual(EDITOR_FORBIDDEN_BODY)
    expectNoPrivilegedWork()
  })

  it("returns the live command center contract to an editor", async () => {
    session(user("admin"))
    const { GET } = await import("../../app/api/ai/live-command-center/route")
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.metrics).toEqual({
      activeAgents: 1,
      runningJobs: 1,
      queuedJobs: 1,
      failedJobs: 1,
      pendingApprovals: 1,
      activeWorkflows: 1,
      activeSchedules: 1,
    })
    expect(body.jobs).toHaveLength(3)
    expect(jobFindMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" }, take: 20 })
    expect(activityFindMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" }, take: 30 })
    expect(agentFindMany).toHaveBeenCalledWith({
      where: { status: "active" },
      include: { department: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    })
    expect(approvalRequestFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    expect(scheduleFindMany).toHaveBeenCalledWith({ orderBy: { nextRunAt: "asc" }, take: 20 })
    expect(workflowFindMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" }, take: 20 })
  })

  it("rejects an anonymous governance analysis before model or database work", async () => {
    const { POST } = await import("../../app/api/governance-matrix/route")
    const response = await POST()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY)
    expectNoPrivilegedWork()
  })

  it("rejects an authenticated non-editor governance analysis", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/governance-matrix/route")
    const response = await POST()

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual(EDITOR_FORBIDDEN_BODY)
    expectNoPrivilegedWork()
  })

  it("keeps the governance analysis contract for an editor", async () => {
    session(user("editor"))
    const { POST } = await import("../../app/api/governance-matrix/route")
    const response = await POST()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      arbitrations: [{ id: "arbitration-1", title: "Resource conflict" }],
      approvals: [{ id: "matrix-approval-1", title: "Review email" }],
      risks: [{ id: "risk-1", title: "Retry storm" }],
    })
    expect(createResponse).toHaveBeenCalledOnce()
    expect(arbitrationCreate).toHaveBeenCalledWith({
      data: {
        title: "Resource conflict",
        arbitrationType: "resource-conflict",
        targetSystem: "runtime",
        severity: "high",
        rationale: "Two plans overlap",
        competingItems: [],
        riskScore: 70,
        status: "pending",
      },
    })
    expect(matrixApprovalCreate).toHaveBeenCalledWith({
      data: {
        title: "Review email",
        targetType: "email",
        targetId: "email-1",
        priority: "high",
        rationale: "External send",
        status: "pending",
      },
    })
    expect(riskCreate).toHaveBeenCalledWith({
      data: {
        title: "Retry storm",
        signalType: "runtime-risk",
        severity: "medium",
        affectedArea: "runtime",
        description: "Retries are climbing",
        recommendation: "Pause automatic retries",
        status: "open",
      },
    })
    expect(operationalCreate).toHaveBeenCalledOnce()
  })

  it("rejects an anonymous governance decision before any update", async () => {
    const { POST } = await import("../../app/api/governance-matrix/decision/route")
    const response = await POST(
      post("/api/governance-matrix/decision", {
        type: "approval",
        id: "approval-1",
        action: "approve",
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY)
    expectNoPrivilegedWork()
  })

  it("rejects an authenticated non-editor governance decision", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/governance-matrix/decision/route")
    const response = await POST(
      post("/api/governance-matrix/decision", {
        type: "risk",
        id: "risk-1",
        action: "close",
      }),
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual(EDITOR_FORBIDDEN_BODY)
    expectNoPrivilegedWork()
  })

  it("keeps an authorised governance decision for an editor", async () => {
    session(user("admin"))
    const { POST } = await import("../../app/api/governance-matrix/decision/route")
    const response = await POST(
      post("/api/governance-matrix/decision", {
        type: "approval",
        id: "approval-1",
        action: "approve",
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      item: { id: "approval-1", title: "Review email", status: "approved" },
    })
    expect(matrixApprovalUpdate).toHaveBeenCalledWith({
      where: { id: "approval-1" },
      data: {
        status: "approved",
        decisionNotes: null,
        approvedAt: expect.any(Date),
        rejectedAt: null,
      },
    })
    expect(operationalCreate).toHaveBeenCalledWith({
      data: {
        type: "governance-approval-decision",
        source: "governance-matrix",
        title: "Review email",
        message: "Approval approved",
        severity: "medium",
        entityType: "GovernanceApproval",
        entityId: "approval-1",
      },
    })
  })

  it("rejects an anonymous governance matrix read before any policy query", async () => {
    const { GET } = await import("../../app/api/governance-matrix/route")
    const response = await GET()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY)
    expectNoPrivilegedWork()
  })

  it("rejects an authenticated non-editor governance matrix read", async () => {
    session(user("viewer"))
    const { GET } = await import("../../app/api/governance-matrix/route")
    const response = await GET()

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual(EDITOR_FORBIDDEN_BODY)
    expectNoPrivilegedWork()
  })

  it("returns the existing governance matrix to an editor", async () => {
    session(user("editor"))
    const { GET } = await import("../../app/api/governance-matrix/route")
    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      policies: [{ id: "policy-1", title: "Existing policy" }],
      arbitrations: [{ id: "arbitration-existing" }],
      approvals: [{ id: "approval-existing" }],
      risks: [{ id: "risk-existing" }],
    })
    expect(policyFindMany).toHaveBeenCalledWith({ orderBy: { createdAt: "asc" } })
    expect(policyCreateMany).not.toHaveBeenCalled()
    expect(arbitrationFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 100,
    })
    expect(matrixApprovalFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 100,
    })
    expect(riskFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 100,
    })
    expect(createResponse).not.toHaveBeenCalled()
  })

  it("creates the starter policies for an editor when none exist", async () => {
    session(user("admin"))
    policyFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: "policy-1", title: "High-risk execution approval required" },
        { id: "policy-2", title: "Protect runtime continuity" },
      ])
    const { GET } = await import("../../app/api/governance-matrix/route")
    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      policies: [
        { id: "policy-1", title: "High-risk execution approval required" },
        { id: "policy-2", title: "Protect runtime continuity" },
      ],
    })
    expect(policyCreateMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          title: "High-risk execution approval required",
          policyType: "execution-control",
          severity: "high",
          enforcement: "strict",
        }),
        expect.objectContaining({
          title: "Protect runtime continuity",
          policyType: "runtime-protection",
          severity: "critical",
          enforcement: "strict",
        }),
      ],
    })
    expect(policyFindMany).toHaveBeenCalledTimes(2)
  })
})
