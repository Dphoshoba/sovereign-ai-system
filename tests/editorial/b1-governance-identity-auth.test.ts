import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  AUTHENTICATION_REQUIRED_BODY,
  EDITOR_FORBIDDEN_BODY,
} from "../../lib/publishing/require-editor-auth"

const EDITOR = "editor@example.com"
const SPOOF = "spoofed-actor@example.com"
const INVITEE = "invitee@example.com"

const mockGetUser = vi.fn()
const governanceRoleFindMany = vi.fn()
const governanceRoleFindFirst = vi.fn()
const governanceRoleCreateMany = vi.fn()
const constitutionalPolicyFindMany = vi.fn()
const constitutionalPolicyCreateMany = vi.fn()
const governanceActorFindFirst = vi.fn()
const governanceActorFindMany = vi.fn()
const governanceActorCreate = vi.fn()
const executionRequestFindMany = vi.fn()
const executionRequestFindUnique = vi.fn()
const executionRequestCreate = vi.fn()
const executionRequestUpdate = vi.fn()
const auditFindMany = vi.fn()
const auditCreate = vi.fn()
const operationalCreate = vi.fn()
const executiveFindMany = vi.fn()
const executiveFindUnique = vi.fn()
const executiveCreate = vi.fn()
const executiveUpdate = vi.fn()
const identityUserFindUnique = vi.fn()
const identityUserFindMany = vi.fn()
const identityUserCreate = vi.fn()
const identityUserUpdate = vi.fn()
const orgFindUnique = vi.fn()
const orgFindFirst = vi.fn()
const memberFindFirst = vi.fn()
const memberCreate = vi.fn()
const memberUpdate = vi.fn()
const policyFindMany = vi.fn()
const policyFindFirst = vi.fn()
const policyCreateMany = vi.fn()
const invitationFindUnique = vi.fn()
const invitationFindMany = vi.fn()
const invitationCreate = vi.fn()
const invitationUpdate = vi.fn()
const invitationUpdateMany = vi.fn()
const sessionFindMany = vi.fn()
const sessionCreate = vi.fn()
const workspaceFindFirst = vi.fn()
const accessLogFindMany = vi.fn()
const accessLogCreate = vi.fn()
const intelligenceCreate = vi.fn()
let acceptanceTransactionAborted = false

const privilegedWork = [
  governanceRoleFindMany,
  governanceRoleFindFirst,
  governanceRoleCreateMany,
  constitutionalPolicyFindMany,
  constitutionalPolicyCreateMany,
  governanceActorFindFirst,
  governanceActorFindMany,
  governanceActorCreate,
  executionRequestFindMany,
  executionRequestFindUnique,
  executionRequestCreate,
  executionRequestUpdate,
  auditFindMany,
  auditCreate,
  operationalCreate,
  executiveFindMany,
  executiveFindUnique,
  executiveCreate,
  executiveUpdate,
  identityUserFindUnique,
  identityUserFindMany,
  identityUserCreate,
  identityUserUpdate,
  orgFindUnique,
  orgFindFirst,
  memberFindFirst,
  memberCreate,
  memberUpdate,
  policyFindMany,
  policyFindFirst,
  policyCreateMany,
  invitationFindUnique,
  invitationFindMany,
  invitationCreate,
  invitationUpdate,
  invitationUpdateMany,
  sessionFindMany,
  sessionCreate,
  workspaceFindFirst,
  accessLogFindMany,
  accessLogCreate,
  intelligenceCreate,
]

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock("@/lib/prisma", () => {
  const prisma = {
    governanceRole: {
      findMany: (...args: unknown[]) => governanceRoleFindMany(...args),
      findFirst: (...args: unknown[]) => governanceRoleFindFirst(...args),
      createMany: (...args: unknown[]) => governanceRoleCreateMany(...args),
    },
    constitutionalPolicy: {
      findMany: (...args: unknown[]) => constitutionalPolicyFindMany(...args),
      createMany: (...args: unknown[]) => constitutionalPolicyCreateMany(...args),
    },
    governanceActor: {
      findFirst: (...args: unknown[]) => governanceActorFindFirst(...args),
      findMany: (...args: unknown[]) => governanceActorFindMany(...args),
      create: (...args: unknown[]) => governanceActorCreate(...args),
    },
    executionAuthorizationRequest: {
      findMany: (...args: unknown[]) => executionRequestFindMany(...args),
      findUnique: (...args: unknown[]) => executionRequestFindUnique(...args),
      create: (...args: unknown[]) => executionRequestCreate(...args),
      update: (...args: unknown[]) => executionRequestUpdate(...args),
    },
    governanceAuditTrail: {
      findMany: (...args: unknown[]) => auditFindMany(...args),
      create: (...args: unknown[]) => auditCreate(...args),
    },
    operationalEvent: {
      create: (...args: unknown[]) => operationalCreate(...args),
    },
    executiveDecision: {
      findMany: (...args: unknown[]) => executiveFindMany(...args),
      findUnique: (...args: unknown[]) => executiveFindUnique(...args),
      create: (...args: unknown[]) => executiveCreate(...args),
      update: (...args: unknown[]) => executiveUpdate(...args),
    },
    identityUser: {
      findUnique: (...args: unknown[]) => identityUserFindUnique(...args),
      findMany: (...args: unknown[]) => identityUserFindMany(...args),
      create: (...args: unknown[]) => identityUserCreate(...args),
      update: (...args: unknown[]) => identityUserUpdate(...args),
    },
    sovereignOrganization: {
      findUnique: (...args: unknown[]) => orgFindUnique(...args),
      findFirst: (...args: unknown[]) => orgFindFirst(...args),
    },
    organizationMember: {
      findFirst: (...args: unknown[]) => memberFindFirst(...args),
      create: (...args: unknown[]) => memberCreate(...args),
      update: (...args: unknown[]) => memberUpdate(...args),
    },
    tenantAccessPolicy: {
      findMany: (...args: unknown[]) => policyFindMany(...args),
      findFirst: (...args: unknown[]) => policyFindFirst(...args),
      createMany: (...args: unknown[]) => policyCreateMany(...args),
    },
    organizationInvitation: {
      findUnique: (...args: unknown[]) => invitationFindUnique(...args),
      findMany: (...args: unknown[]) => invitationFindMany(...args),
      create: (...args: unknown[]) => invitationCreate(...args),
      update: (...args: unknown[]) => invitationUpdate(...args),
      updateMany: (...args: unknown[]) => invitationUpdateMany(...args),
    },
    identitySession: {
      findMany: (...args: unknown[]) => sessionFindMany(...args),
      create: (...args: unknown[]) => sessionCreate(...args),
    },
    organizationWorkspace: {
      findFirst: (...args: unknown[]) => workspaceFindFirst(...args),
    },
    accessDecisionLog: {
      findMany: (...args: unknown[]) => accessLogFindMany(...args),
      create: (...args: unknown[]) => accessLogCreate(...args),
    },
    tenantIntelligenceRecord: {
      create: (...args: unknown[]) => intelligenceCreate(...args),
    },
  }
  prisma.$transaction = async (fn: (tx: typeof prisma) => Promise<unknown>) => {
    try {
      return await fn(prisma)
    } catch (error) {
      acceptanceTransactionAborted = true
      throw error
    }
  }
  return { prisma }
})

function session(user: unknown) {
  mockGetUser.mockResolvedValue({ data: { user }, error: null })
}

function user(role: "viewer" | "editor" | "admin") {
  return {
    id: `${role}-1`,
    email: role === "editor" ? EDITOR : `${role}@example.com`,
    role: "authenticated",
    app_metadata: { role },
  }
}

function post(body: unknown) {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function expectNoPrivilegedWork() {
  for (const spy of privilegedWork) {
    expect(spy).not.toHaveBeenCalled()
  }
}

function storedDecision(status = "proposed") {
  const now = new Date("2026-11-11T00:00:00.000Z")
  return {
    id: "decision-1",
    boardroomId: null,
    title: "Hold the launch",
    description: null,
    category: null,
    status,
    outcome: null,
    effectiveness: null,
    actionTaken: null,
    lessonLearned: null,
    reviewDate: null,
    impactArea: null,
    followUpRequired: false,
    createdAt: now,
    updatedAt: now,
  }
}

describe("B1 governance and identity authorisation", () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    acceptanceTransactionAborted = false
    for (const spy of privilegedWork) spy.mockReset()
  })

  it("rejects an anonymous governance decision before any database work", async () => {
    session(null)
    const { POST } = await import("../../app/api/enterprise-governance/decision/route")
    const response = await POST(post({ requestId: "req-1", action: "approve", actorEmail: SPOOF }))
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual(AUTHENTICATION_REQUIRED_BODY)
    expectNoPrivilegedWork()
  })

  it("rejects an authenticated non-editor governance decision", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/enterprise-governance/decision/route")
    const response = await POST(post({ requestId: "req-1", action: "approve", actorEmail: SPOOF }))
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual(EDITOR_FORBIDDEN_BODY)
    expectNoPrivilegedWork()
  })

  it("records an approved governance decision as the authenticated editor", async () => {
    session(user("editor"))
    executionRequestFindUnique.mockResolvedValue({
      id: "req-1",
      title: "Approve runtime",
      riskLevel: "high",
      targetType: "SovereignRuntimeAction",
      targetId: null,
      actionType: "execute-high-risk-action",
    })
    governanceActorFindFirst.mockResolvedValue({
      email: EDITOR,
      roleName: "Founder",
      status: "active",
    })
    governanceRoleFindFirst.mockResolvedValue({ name: "Founder", authorityLevel: 10 })
    executionRequestUpdate.mockResolvedValue({
      id: "req-1",
      title: "Approve runtime",
      status: "approved",
      riskLevel: "high",
    })
    auditCreate.mockResolvedValue({ id: "audit-1" })
    operationalCreate.mockResolvedValue({ id: "event-1" })

    const { POST } = await import("../../app/api/enterprise-governance/decision/route")
    const response = await POST(
      post({
        requestId: "req-1",
        action: "approve",
        actorEmail: SPOOF,
        notes: "Approved by session",
      })
    )

    expect(response.status).toBe(200)
    expect(governanceActorFindFirst).toHaveBeenCalledWith({
      where: { email: EDITOR, status: "active" },
    })
    expect(executionRequestUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "approved",
          approvedBy: EDITOR,
          rejectedBy: null,
        }),
      })
    )
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ actor: EDITOR, outcome: "approved" }),
      })
    )
    expect(JSON.stringify(auditCreate.mock.calls)).not.toContain(SPOOF)
  })

  it("records a rejected governance decision as the authenticated editor", async () => {
    session(user("editor"))
    executionRequestFindUnique.mockResolvedValue({
      id: "req-1",
      title: "Approve runtime",
      riskLevel: "high",
      targetType: "SovereignRuntimeAction",
      targetId: null,
      actionType: "execute-high-risk-action",
    })
    governanceActorFindFirst.mockResolvedValue({
      email: EDITOR,
      roleName: "Founder",
      status: "active",
    })
    governanceRoleFindFirst.mockResolvedValue({ name: "Founder", authorityLevel: 10 })
    executionRequestUpdate.mockResolvedValue({
      id: "req-1",
      title: "Approve runtime",
      status: "rejected",
      riskLevel: "high",
    })
    auditCreate.mockResolvedValue({ id: "audit-1" })
    operationalCreate.mockResolvedValue({ id: "event-1" })

    const { POST } = await import("../../app/api/enterprise-governance/decision/route")
    const response = await POST(
      post({ requestId: "req-1", action: "reject", actorEmail: SPOOF, notes: "Rejected" })
    )

    expect(response.status).toBe(200)
    expect(executionRequestUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "rejected",
          approvedBy: null,
          rejectedBy: EDITOR,
        }),
      })
    )
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ actor: EDITOR, outcome: "rejected" }),
      })
    )
  })

  it("rejects an anonymous enterprise governance read before seeding", async () => {
    session(null)
    const { GET } = await import("../../app/api/enterprise-governance/route")
    const response = await GET()
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual(AUTHENTICATION_REQUIRED_BODY)
    expectNoPrivilegedWork()
  })

  it("rejects an authenticated non-editor enterprise governance read", async () => {
    session(user("viewer"))
    const { GET } = await import("../../app/api/enterprise-governance/route")
    const response = await GET()
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual(EDITOR_FORBIDDEN_BODY)
    expectNoPrivilegedWork()
  })

  it("lets an editor read enterprise governance and seed missing records", async () => {
    session(user("editor"))
    governanceRoleFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "role-1", name: "Founder" }])
    constitutionalPolicyFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "policy-1" }])
    governanceActorFindFirst.mockResolvedValue({ id: "actor-1" })
    governanceRoleCreateMany.mockResolvedValue({ count: 3 })
    constitutionalPolicyCreateMany.mockResolvedValue({ count: 3 })
    governanceActorFindMany.mockResolvedValue([])
    executionRequestFindMany.mockResolvedValue([])
    auditFindMany.mockResolvedValue([])

    const { GET } = await import("../../app/api/enterprise-governance/route")
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.roles).toEqual([{ id: "role-1", name: "Founder" }])
    expect(governanceRoleCreateMany).toHaveBeenCalledOnce()
    expect(constitutionalPolicyCreateMany).toHaveBeenCalledOnce()
    expect(governanceActorCreate).not.toHaveBeenCalled()
  })

  it("rejects an anonymous enterprise governance request before seeding", async () => {
    session(null)
    const { POST } = await import("../../app/api/enterprise-governance/route")
    const response = await POST(
      post({ title: "Run", actionType: "execute", targetType: "Runtime", requestedBy: SPOOF })
    )
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual(AUTHENTICATION_REQUIRED_BODY)
    expectNoPrivilegedWork()
  })

  it("rejects an authenticated non-editor enterprise governance request", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/enterprise-governance/route")
    const response = await POST(
      post({ title: "Run", actionType: "execute", targetType: "Runtime", requestedBy: SPOOF })
    )
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual(EDITOR_FORBIDDEN_BODY)
    expectNoPrivilegedWork()
  })

  it("attributes a new authorisation request to the authenticated editor", async () => {
    session(user("editor"))
    governanceRoleFindMany.mockResolvedValue([{ id: "role-1" }])
    constitutionalPolicyFindMany.mockResolvedValue([])
    governanceActorFindFirst.mockResolvedValue({ id: "actor-1" })
    executionRequestCreate.mockResolvedValue({
      id: "req-1",
      title: "Run",
      status: "pending",
      riskLevel: "high",
      rationale: "because",
    })
    auditCreate.mockResolvedValue({ id: "audit-1" })
    operationalCreate.mockResolvedValue({ id: "event-1" })

    const { POST } = await import("../../app/api/enterprise-governance/route")
    const response = await POST(
      post({
        title: "Run",
        actionType: "execute",
        targetType: "Runtime",
        requestedBy: SPOOF,
        requestedRole: "system",
        riskLevel: "high",
        rationale: "because",
      })
    )

    expect(response.status).toBe(200)
    expect(executionRequestCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestedBy: EDITOR,
          status: "pending",
        }),
      })
    )
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ actor: EDITOR, actorRole: "editor" }),
      })
    )
    expect(JSON.stringify(executionRequestCreate.mock.calls)).not.toContain(SPOOF)
    expect(JSON.stringify(auditCreate.mock.calls)).not.toContain(SPOOF)
  })

  it("rejects an anonymous executive decision write", async () => {
    session(null)
    const { POST } = await import("../../app/api/executive/decisions/route")
    const response = await POST(post({ title: "Hold the launch", actorEmail: SPOOF }))
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual(AUTHENTICATION_REQUIRED_BODY)
    expectNoPrivilegedWork()
  })

  it("rejects an authenticated non-editor executive decision write", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/executive/decisions/route")
    const response = await POST(post({ title: "Hold the launch" }))
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual(EDITOR_FORBIDDEN_BODY)
    expectNoPrivilegedWork()
  })

  it("lets an editor create an executive decision without using a body identity", async () => {
    session(user("editor"))
    executiveCreate.mockResolvedValue(storedDecision())
    const { POST } = await import("../../app/api/executive/decisions/route")
    const response = await POST(
      post({ title: "Hold the launch", actorEmail: SPOOF, requestedBy: SPOOF })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.decision.title).toBe("Hold the launch")
    expect(body.decision.status).toBe("proposed")
    expect(executiveCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: "Hold the launch", status: "proposed" }),
      })
    )
    expect(JSON.stringify(executiveCreate.mock.calls)).not.toContain(SPOOF)
  })

  it("rejects an anonymous executive decision update", async () => {
    session(null)
    const { PATCH } = await import("../../app/api/executive/decisions/route")
    const response = await PATCH(post({ id: "decision-1", status: "approved", requestedBy: SPOOF }))
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual(AUTHENTICATION_REQUIRED_BODY)
    expectNoPrivilegedWork()
  })

  it("rejects an authenticated non-editor executive decision update", async () => {
    session(user("viewer"))
    const { PATCH } = await import("../../app/api/executive/decisions/route")
    const response = await PATCH(post({ id: "decision-1", status: "approved" }))
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual(EDITOR_FORBIDDEN_BODY)
    expectNoPrivilegedWork()
  })

  it("lets an editor update an executive decision", async () => {
    session(user("editor"))
    executiveFindUnique.mockResolvedValue(storedDecision())
    executiveUpdate.mockResolvedValue(storedDecision("approved"))
    const { PATCH } = await import("../../app/api/executive/decisions/route")
    const response = await PATCH(
      post({ id: "decision-1", status: "approved", requestedBy: SPOOF })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.decision.status).toBe("approved")
    expect(executiveUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "decision-1" },
        data: expect.objectContaining({ status: "approved" }),
      })
    )
    expect(JSON.stringify(executiveUpdate.mock.calls)).not.toContain(SPOOF)
  })

  it("rejects an invitation token that is not a single-use secret", async () => {
    const { POST } = await import("../../app/api/identity-runtime/accept/route")
    const response = await POST(post({ token: "token-1", email: SPOOF }))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      ok: false,
      error: "A valid invitation token is required",
    })
    expectNoPrivilegedWork()
  })

  it("does not create a membership for an unknown invitation token", async () => {
    invitationFindUnique.mockResolvedValue(null)
    const { POST } = await import("../../app/api/identity-runtime/accept/route")
    const response = await POST(post({ token: "ab".repeat(24), email: SPOOF }))
    expect(response.status).toBe(404)
    expect(identityUserCreate).not.toHaveBeenCalled()
    expect(memberUpdate).not.toHaveBeenCalled()
  })

  it("accepts an invitation for the invited address, not a body email", async () => {
    const invitation = {
      id: "inv-1",
      email: INVITEE,
      status: "pending",
      expiresAt: new Date(Date.now() + 60_000),
      organizationId: "org-1",
      role: "member",
      token: "ab".repeat(24),
    }
    invitationFindUnique.mockResolvedValue(invitation)
    identityUserFindUnique.mockResolvedValue({
      id: "user-1",
      email: INVITEE,
      name: "Invitee",
    })
    memberFindFirst.mockResolvedValue({ id: "member-1" })
    memberUpdate.mockResolvedValue({ id: "member-1", role: "member", status: "active" })
    invitationUpdateMany.mockResolvedValue({ count: 1 })
    accessLogCreate.mockResolvedValue({ id: "log-1" })

    const { POST } = await import("../../app/api/identity-runtime/accept/route")
    const response = await POST(post({ token: "ab".repeat(24), email: SPOOF, name: "Spoof" }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(identityUserFindUnique).toHaveBeenCalledWith({ where: { email: INVITEE } })
    expect(identityUserCreate).not.toHaveBeenCalled()
    expect(accessLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: INVITEE, decision: "allowed" }),
      })
    )
    expect(JSON.stringify(accessLogCreate.mock.calls)).not.toContain(SPOOF)
    expect(memberUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "member", status: "active" }),
      })
    )
    expect(JSON.stringify(memberUpdate.mock.calls)).not.toContain("org-spoof")
  })

  it("expires an invitation that is past its deadline without creating a membership", async () => {
    invitationFindUnique.mockResolvedValue({
      id: "inv-1",
      email: INVITEE,
      status: "pending",
      expiresAt: new Date(Date.now() - 60_000),
      organizationId: "org-1",
      role: "member",
      token: "ab".repeat(24),
    })
    invitationUpdate.mockResolvedValue({ id: "inv-1", status: "expired" })

    const { POST } = await import("../../app/api/identity-runtime/accept/route")
    const response = await POST(post({ token: "ab".repeat(24), organizationId: "org-spoof", email: SPOOF }))

    expect(response.status).toBe(410)
    expect(invitationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "expired" } })
    )
    expect(invitationUpdateMany).not.toHaveBeenCalled()
    expect(memberCreate).not.toHaveBeenCalled()
    expect(memberUpdate).not.toHaveBeenCalled()
  })

  it("does not accept an invitation that has no expiry", async () => {
    invitationFindUnique.mockResolvedValue({
      id: "inv-1",
      email: INVITEE,
      status: "pending",
      expiresAt: null,
      organizationId: "org-1",
      role: "member",
      token: "ab".repeat(24),
    })

    const { POST } = await import("../../app/api/identity-runtime/accept/route")
    const response = await POST(post({ token: "ab".repeat(24) }))

    expect(response.status).toBe(410)
    expect(memberCreate).not.toHaveBeenCalled()
  })

  it("lets only the first concurrent claim create a membership", async () => {
    const invitation = {
      id: "inv-1",
      email: INVITEE,
      status: "pending",
      expiresAt: new Date(Date.now() + 60_000),
      organizationId: "org-1",
      role: "member",
      token: "ab".repeat(24),
    }
    invitationFindUnique.mockResolvedValue(invitation)
    invitationUpdateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 })
    identityUserFindUnique.mockResolvedValue({ id: "user-1", email: INVITEE, name: "Invitee" })
    memberFindFirst.mockResolvedValue(null)
    memberCreate.mockResolvedValue({ id: "member-1" })
    accessLogCreate.mockResolvedValue({ id: "log-1" })

    const { POST } = await import("../../app/api/identity-runtime/accept/route")
    const first = await POST(post({ token: "ab".repeat(24), organizationId: "org-spoof", email: SPOOF }))
    const second = await POST(post({ token: "ab".repeat(24), organizationId: "org-spoof", email: SPOOF }))

    expect(first.status).toBe(200)
    expect(second.status).toBe(404)
    expect(memberCreate).toHaveBeenCalledTimes(1)
    expect(memberCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: "org-1", email: INVITEE }),
      })
    )
    expect(JSON.stringify(memberCreate.mock.calls)).not.toContain(SPOOF)
    expect(JSON.stringify(memberCreate.mock.calls)).not.toContain("org-spoof")
  })

  it("rolls the invitation claim back when membership creation fails", async () => {
    invitationFindUnique.mockResolvedValue({
      id: "inv-1",
      email: INVITEE,
      status: "pending",
      expiresAt: new Date(Date.now() + 60_000),
      organizationId: "org-1",
      role: "member",
      token: "ab".repeat(24),
    })
    invitationUpdateMany.mockResolvedValue({ count: 1 })
    identityUserFindUnique.mockResolvedValue({ id: "user-1", email: INVITEE, name: "Invitee" })
    memberFindFirst.mockResolvedValue(null)
    memberCreate.mockRejectedValue(new Error(`write failed for ${INVITEE}`))

    const { POST } = await import("../../app/api/identity-runtime/accept/route")
    const response = await POST(post({ token: "ab".repeat(24), email: SPOOF }))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ ok: false, error: "Invitation accept failed" })
    expect(JSON.stringify(body)).not.toContain(INVITEE)
    expect(invitationUpdateMany).toHaveBeenCalledTimes(1)
    expect(acceptanceTransactionAborted).toBe(true)
    expect(accessLogCreate).not.toHaveBeenCalled()
  })

  it("rejects an anonymous access check", async () => {
    session(null)
    const { POST } = await import("../../app/api/identity-runtime/access/route")
    const response = await POST(
      post({ email: SPOOF, organizationId: "org-1", resource: "admin", action: "access" })
    )
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual(AUTHENTICATION_REQUIRED_BODY)
    expectNoPrivilegedWork()
  })

  it("rejects an authenticated non-editor access check", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/identity-runtime/access/route")
    const response = await POST(
      post({ email: SPOOF, organizationId: "org-1", resource: "admin", action: "access" })
    )
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual(EDITOR_FORBIDDEN_BODY)
    expectNoPrivilegedWork()
  })

  it("checks access for the authenticated editor and ignores a body email", async () => {
    session(user("editor"))
    identityUserFindUnique.mockResolvedValue({ id: "user-1", email: EDITOR })
    memberFindFirst.mockResolvedValue({ role: "owner" })
    policyFindFirst.mockResolvedValue({ id: "policy-1", allowedRoles: ["owner"] })
    accessLogCreate.mockResolvedValue({ id: "log-1", decision: "allowed" })

    const { POST } = await import("../../app/api/identity-runtime/access/route")
    const response = await POST(
      post({ email: SPOOF, organizationId: "org-1", resource: "admin", action: "access" })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.allowed).toBe(true)
    expect(body.role).toBe("owner")
    expect(identityUserFindUnique).toHaveBeenCalledWith({ where: { email: EDITOR } })
    expect(memberFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ email: EDITOR, organizationId: "org-1" }),
      })
    )
    expect(accessLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: EDITOR, decision: "allowed" }),
      })
    )
    expect(JSON.stringify(accessLogCreate.mock.calls)).not.toContain(SPOOF)
  })

  it("rejects an anonymous invitation", async () => {
    session(null)
    const { POST } = await import("../../app/api/identity-runtime/invite/route")
    const response = await POST(
      post({ organizationId: "org-1", email: INVITEE, invitedBy: SPOOF })
    )
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual(AUTHENTICATION_REQUIRED_BODY)
    expectNoPrivilegedWork()
  })

  it("rejects an authenticated non-editor invitation", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/identity-runtime/invite/route")
    const response = await POST(
      post({ organizationId: "org-1", email: INVITEE, invitedBy: SPOOF })
    )
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual(EDITOR_FORBIDDEN_BODY)
    expectNoPrivilegedWork()
  })

  it("records the authenticated editor as the inviter", async () => {
    session(user("editor"))
    orgFindUnique.mockResolvedValue({ id: "org-1", slug: "echoes-visions" })
    invitationCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "inv-1",
      ...data,
    }))
    intelligenceCreate.mockResolvedValue({ id: "intel-1" })

    const { POST } = await import("../../app/api/identity-runtime/invite/route")
    const response = await POST(
      post({
        organizationId: "org-1",
        email: INVITEE,
        role: "member",
        invitedBy: SPOOF,
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(invitationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: INVITEE,
          invitedBy: EDITOR,
          role: "member",
        }),
      })
    )
    expect(JSON.stringify(invitationCreate.mock.calls)).not.toContain(SPOOF)
  })

  it("rejects an anonymous identity read before seeding", async () => {
    session(null)
    const { GET } = await import("../../app/api/identity-runtime/route")
    const response = await GET()
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual(AUTHENTICATION_REQUIRED_BODY)
    expectNoPrivilegedWork()
  })

  it("rejects an authenticated non-editor identity read", async () => {
    session(user("viewer"))
    const { GET } = await import("../../app/api/identity-runtime/route")
    const response = await GET()
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual(EDITOR_FORBIDDEN_BODY)
    expectNoPrivilegedWork()
  })

  it("lets an editor read identity records without creating a new user", async () => {
    session(user("editor"))
    identityUserFindUnique.mockResolvedValue({
      id: "user-1",
      email: EDITOR,
      defaultOrgId: null,
    })
    orgFindUnique.mockResolvedValue(null)
    identityUserFindMany.mockResolvedValue([])
    sessionFindMany.mockResolvedValue([])
    invitationFindMany.mockResolvedValue([])
    policyFindMany.mockResolvedValue([])
    accessLogFindMany.mockResolvedValue([])

    const { GET } = await import("../../app/api/identity-runtime/route")
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.users).toEqual([])
    expect(identityUserCreate).not.toHaveBeenCalled()
    expect(memberCreate).not.toHaveBeenCalled()
    expect(policyCreateMany).not.toHaveBeenCalled()
  })

  it("rejects an anonymous identity session", async () => {
    session(null)
    const { POST } = await import("../../app/api/identity-runtime/route")
    const response = await POST(post({ email: SPOOF, name: "Spoof" }))
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual(AUTHENTICATION_REQUIRED_BODY)
    expectNoPrivilegedWork()
  })

  it("rejects an authenticated non-editor identity session", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/identity-runtime/route")
    const response = await POST(post({ email: SPOOF }))
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual(EDITOR_FORBIDDEN_BODY)
    expectNoPrivilegedWork()
  })

  it("creates an identity session for the authenticated editor", async () => {
    session(user("editor"))
    identityUserFindUnique.mockResolvedValue({
      id: "user-1",
      email: EDITOR,
      defaultOrgId: null,
    })
    orgFindFirst.mockResolvedValue(null)
    sessionCreate.mockResolvedValue({ id: "session-1", email: EDITOR })
    identityUserUpdate.mockResolvedValue({ id: "user-1" })
    accessLogCreate.mockResolvedValue({ id: "log-1" })

    const { POST } = await import("../../app/api/identity-runtime/route")
    const response = await POST(post({ email: SPOOF, name: "Spoof" }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.session.email).toBe(EDITOR)
    expect(identityUserFindUnique).toHaveBeenCalledWith({ where: { email: EDITOR } })
    expect(sessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: EDITOR, userId: "user-1" }),
      })
    )
    expect(accessLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: EDITOR, action: "login" }),
      })
    )
    expect(JSON.stringify(sessionCreate.mock.calls)).not.toContain(SPOOF)
    expect(JSON.stringify(accessLogCreate.mock.calls)).not.toContain(SPOOF)
  })
})
