import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  AUTHENTICATION_REQUIRED_BODY,
  EDITOR_FORBIDDEN_BODY,
} from "../../lib/publishing/require-editor-auth"

const SPOOF = "spoofed-actor@example.com"
const CLIENT_EMAIL = "ada@example.com"
const LEAD_EMAIL = "lead@example.com"

const mockGetUser = vi.fn()
const createResponse = vi.fn()
const revenueCreate = vi.fn()
const activityCreate = vi.fn()
const usageCreate = vi.fn()
const quotaFindUnique = vi.fn()
const quotaCreate = vi.fn()
const quotaUpdate = vi.fn()
const quotaUpsert = vi.fn()
const quotaFindMany = vi.fn()
const operationalCreate = vi.fn()
const billingPlanFindMany = vi.fn()
const billingPlanCreateMany = vi.fn()
const billingPlanFindUnique = vi.fn()
const orgFindUnique = vi.fn()
const orgFindMany = vi.fn()
const orgUpdate = vi.fn()
const subscriptionFindFirst = vi.fn()
const subscriptionFindMany = vi.fn()
const subscriptionCreate = vi.fn()
const subscriptionUpsert = vi.fn()
const billingInvoiceFindMany = vi.fn()
const billingRunFindMany = vi.fn()
const billingRunCreate = vi.fn()
const usageFindMany = vi.fn()
const economicFindMany = vi.fn()
const snapshotFindMany = vi.fn()
const realtimeFindMany = vi.fn()
const clientFindUnique = vi.fn()
const clientFindFirst = vi.fn()
const clientCreate = vi.fn()
const projectFindUnique = vi.fn()
const invoiceFindMany = vi.fn()
const invoiceFindUnique = vi.fn()
const invoiceCreate = vi.fn()
const invoiceUpdate = vi.fn()
const leadFindUnique = vi.fn()
const proposalFindUnique = vi.fn()
const proposalCreate = vi.fn()
const creatorInvoiceCreate = vi.fn()
const revenueEventCreate = vi.fn()
const auditFindUnique = vi.fn()

const privilegedWork = [
  createResponse,
  revenueCreate,
  activityCreate,
  usageCreate,
  quotaFindUnique,
  quotaCreate,
  quotaUpdate,
  quotaUpsert,
  quotaFindMany,
  operationalCreate,
  billingPlanFindMany,
  billingPlanCreateMany,
  billingPlanFindUnique,
  orgFindUnique,
  orgFindMany,
  orgUpdate,
  subscriptionFindFirst,
  subscriptionFindMany,
  subscriptionCreate,
  subscriptionUpsert,
  billingInvoiceFindMany,
  billingRunFindMany,
  billingRunCreate,
  usageFindMany,
  economicFindMany,
  snapshotFindMany,
  realtimeFindMany,
  clientFindUnique,
  clientFindFirst,
  clientCreate,
  projectFindUnique,
  invoiceFindMany,
  invoiceFindUnique,
  invoiceCreate,
  invoiceUpdate,
  leadFindUnique,
  proposalFindUnique,
  proposalCreate,
  creatorInvoiceCreate,
  revenueEventCreate,
  auditFindUnique,
]

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
    revenueRecord: { create: (...args: unknown[]) => revenueCreate(...args) },
    aiActivityEvent: { create: (...args: unknown[]) => activityCreate(...args) },
    usageMeterEvent: {
      create: (...args: unknown[]) => usageCreate(...args),
      findMany: (...args: unknown[]) => usageFindMany(...args),
    },
    tenantQuotaState: {
      findUnique: (...args: unknown[]) => quotaFindUnique(...args),
      create: (...args: unknown[]) => quotaCreate(...args),
      update: (...args: unknown[]) => quotaUpdate(...args),
      upsert: (...args: unknown[]) => quotaUpsert(...args),
      findMany: (...args: unknown[]) => quotaFindMany(...args),
    },
    operationalEvent: { create: (...args: unknown[]) => operationalCreate(...args) },
    billingPlan: {
      findMany: (...args: unknown[]) => billingPlanFindMany(...args),
      createMany: (...args: unknown[]) => billingPlanCreateMany(...args),
      findUnique: (...args: unknown[]) => billingPlanFindUnique(...args),
    },
    sovereignOrganization: {
      findUnique: (...args: unknown[]) => orgFindUnique(...args),
      findMany: (...args: unknown[]) => orgFindMany(...args),
      update: (...args: unknown[]) => orgUpdate(...args),
    },
    tenantSubscription: {
      findFirst: (...args: unknown[]) => subscriptionFindFirst(...args),
      findMany: (...args: unknown[]) => subscriptionFindMany(...args),
      create: (...args: unknown[]) => subscriptionCreate(...args),
      upsert: (...args: unknown[]) => subscriptionUpsert(...args),
    },
    billingInvoiceRecord: {
      findMany: (...args: unknown[]) => billingInvoiceFindMany(...args),
    },
    billingIntelligenceRun: {
      findMany: (...args: unknown[]) => billingRunFindMany(...args),
      create: (...args: unknown[]) => billingRunCreate(...args),
    },
    economicIntelligenceRun: {
      findMany: (...args: unknown[]) => economicFindMany(...args),
    },
    sovereignRuntimeSnapshot: {
      findMany: (...args: unknown[]) => snapshotFindMany(...args),
    },
    realtimeFabricRun: { findMany: (...args: unknown[]) => realtimeFindMany(...args) },
    clientProfile: {
      findUnique: (...args: unknown[]) => clientFindUnique(...args),
      findFirst: (...args: unknown[]) => clientFindFirst(...args),
      create: (...args: unknown[]) => clientCreate(...args),
    },
    clientProject: { findUnique: (...args: unknown[]) => projectFindUnique(...args) },
    clientInvoice: {
      findMany: (...args: unknown[]) => invoiceFindMany(...args),
      findUnique: (...args: unknown[]) => invoiceFindUnique(...args),
      create: (...args: unknown[]) => invoiceCreate(...args),
      update: (...args: unknown[]) => invoiceUpdate(...args),
    },
    creatorLead: { findUnique: (...args: unknown[]) => leadFindUnique(...args) },
    creatorProposal: {
      findUnique: (...args: unknown[]) => proposalFindUnique(...args),
      create: (...args: unknown[]) => proposalCreate(...args),
    },
    creatorInvoice: { create: (...args: unknown[]) => creatorInvoiceCreate(...args) },
    creatorRevenueEvent: { create: (...args: unknown[]) => revenueEventCreate(...args) },
    creatorAuditRequest: { findUnique: (...args: unknown[]) => auditFindUnique(...args) },
  },
}))

function session(user: unknown) {
  mockGetUser.mockResolvedValue({ data: { user }, error: null })
}

function user(role: "viewer" | "editor") {
  return {
    id: `${role}-1`,
    email: `${role}@example.com`,
    role: "authenticated",
    app_metadata: { role },
  }
}

function jsonRequest(body: unknown, method = "POST") {
  return new Request("http://localhost/api", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function expectNoPrivilegedWork() {
  for (const spy of privilegedWork) expect(spy).not.toHaveBeenCalled()
}

async function expectDenied(
  status: 401 | 403,
  run: () => Promise<Response>
) {
  const response = await run()
  expect(response.status).toBe(status)
  expect(await response.json()).toEqual(
    status === 401 ? AUTHENTICATION_REQUIRED_BODY : EDITOR_FORBIDDEN_BODY
  )
  expectNoPrivilegedWork()
}

describe("B2 financial and client authorisation", () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    for (const spy of privilegedWork) spy.mockReset()
  })

  it("rejects an anonymous revenue record before any database work", async () => {
    session(null)
    const { POST } = await import("../../app/api/ai/revenue/route")
    await expectDenied(401, () =>
      POST(jsonRequest({ source: "YouTube", category: "AI", amount: 100, actorEmail: SPOOF }))
    )
  })

  it("rejects an authenticated non-editor revenue record", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/ai/revenue/route")
    await expectDenied(403, () =>
      POST(jsonRequest({ source: "YouTube", category: "AI", amount: 100 }))
    )
  })

  it("lets an editor record revenue without treating a body email as the actor", async () => {
    session(user("editor"))
    revenueCreate.mockResolvedValue({
      id: "revenue-1",
      source: "YouTube",
      category: "AI Automation",
      currency: "AUD",
      amount: 100,
    })
    activityCreate.mockResolvedValue({ id: "activity-1" })

    const { POST } = await import("../../app/api/ai/revenue/route")
    const response = await POST(
      jsonRequest({
        source: "YouTube",
        category: "AI Automation",
        amount: 100,
        clientName: "Ada",
        actorEmail: SPOOF,
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.record.id).toBe("revenue-1")
    expect(revenueCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: "YouTube",
          category: "AI Automation",
          amount: 100,
          clientName: "Ada",
        }),
      })
    )
    expect(activityCreate).toHaveBeenCalledOnce()
    expect(JSON.stringify(revenueCreate.mock.calls)).not.toContain(SPOOF)
  })

  it("rejects an anonymous usage meter", async () => {
    session(null)
    const { POST } = await import("../../app/api/billing-runtime/meter/route")
    await expectDenied(401, () =>
      POST(jsonRequest({ organizationId: "org-1", meterType: "aiRuns", actorEmail: SPOOF }))
    )
  })

  it("rejects an authenticated non-editor usage meter", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/billing-runtime/meter/route")
    await expectDenied(403, () =>
      POST(jsonRequest({ organizationId: "org-1", meterType: "aiRuns" }))
    )
  })

  it("lets an editor record usage and create a quota", async () => {
    session(user("editor"))
    usageCreate.mockResolvedValue({ id: "usage-1", quantity: 1 })
    quotaFindUnique.mockResolvedValue(null)
    quotaCreate.mockResolvedValue({
      id: "quota-1",
      usedValue: 1,
      limitValue: 0,
      status: "unlimited-or-unconfigured",
    })

    const { POST } = await import("../../app/api/billing-runtime/meter/route")
    const response = await POST(
      jsonRequest({ organizationId: "org-1", meterType: "aiRuns", quantity: 1 })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.usage.id).toBe("usage-1")
    expect(body.quota.status).toBe("unlimited-or-unconfigured")
    expect(quotaCreate).toHaveBeenCalledOnce()
    expect(quotaUpdate).not.toHaveBeenCalled()
    expect(operationalCreate).not.toHaveBeenCalled()
  })

  it("rejects an anonymous billing read before seeding", async () => {
    session(null)
    const { GET } = await import("../../app/api/billing-runtime/route")
    await expectDenied(401, () => GET())
  })

  it("rejects an authenticated non-editor billing read", async () => {
    session(user("viewer"))
    const { GET } = await import("../../app/api/billing-runtime/route")
    await expectDenied(403, () => GET())
  })

  it("lets an editor read billing records and seed missing plans", async () => {
    session(user("editor"))
    billingPlanFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValue([{ id: "plan-1", priceAud: 49 }])
    billingPlanCreateMany.mockResolvedValue({ count: 3 })
    orgFindUnique.mockResolvedValue(null)
    subscriptionFindMany.mockResolvedValue([])
    usageFindMany.mockResolvedValue([])
    quotaFindMany.mockResolvedValue([])
    billingInvoiceFindMany.mockResolvedValue([])
    billingRunFindMany.mockResolvedValue([])

    const { GET } = await import("../../app/api/billing-runtime/route")
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.plans).toEqual([{ id: "plan-1", priceAud: 49 }])
    expect(billingPlanCreateMany).toHaveBeenCalledOnce()
    expect(subscriptionCreate).not.toHaveBeenCalled()
    expect(createResponse).not.toHaveBeenCalled()
  })

  it("rejects an anonymous billing intelligence run before the model call", async () => {
    session(null)
    const { POST } = await import("../../app/api/billing-runtime/route")
    await expectDenied(401, () => POST())
  })

  it("rejects an authenticated non-editor billing intelligence run", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/billing-runtime/route")
    await expectDenied(403, () => POST())
  })

  it("lets an editor run billing intelligence", async () => {
    session(user("editor"))
    billingPlanFindMany.mockResolvedValue([{ id: "plan-1" }])
    orgFindUnique.mockResolvedValue(null)
    orgFindMany.mockResolvedValue([])
    subscriptionFindMany.mockResolvedValue([])
    usageFindMany.mockResolvedValue([])
    quotaFindMany.mockResolvedValue([])
    billingInvoiceFindMany.mockResolvedValue([])
    economicFindMany.mockResolvedValue([])
    snapshotFindMany.mockResolvedValue([])
    realtimeFindMany.mockResolvedValue([])
    createResponse.mockResolvedValue({
      output_text: JSON.stringify({
        title: "Billing health",
        summary: "Stable",
        revenueHealth: 82,
        usageHealth: 78,
        quotaRisk: 30,
        costRisk: 35,
        findings: { billingStrengths: ["Plans exist"] },
      }),
    })
    billingRunCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "run-1",
      ...data,
    }))
    operationalCreate.mockResolvedValue({ id: "event-1" })

    const { POST } = await import("../../app/api/billing-runtime/route")
    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.run.title).toBe("Billing health")
    expect(createResponse).toHaveBeenCalledOnce()
    expect(billingRunCreate).toHaveBeenCalledOnce()
    expect(operationalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "billing-intelligence-run" }),
      })
    )
    expect(billingPlanCreateMany).not.toHaveBeenCalled()
  })

  it("rejects an anonymous subscription change", async () => {
    session(null)
    const { POST } = await import("../../app/api/billing-runtime/subscription/route")
    await expectDenied(401, () =>
      POST(jsonRequest({ organizationId: "org-1", planSlug: "growth", actorEmail: SPOOF }))
    )
  })

  it("rejects an authenticated non-editor subscription change", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/billing-runtime/subscription/route")
    await expectDenied(403, () =>
      POST(jsonRequest({ organizationId: "org-1", planSlug: "growth" }))
    )
  })

  it("lets an editor change a subscription plan", async () => {
    session(user("editor"))
    billingPlanFindUnique.mockResolvedValue({
      id: "plan-1",
      slug: "growth",
      name: "Growth",
      limits: { aiRuns: 10 },
    })
    subscriptionFindFirst.mockResolvedValue(null)
    subscriptionUpsert.mockResolvedValue({ id: "sub-1", planSlug: "growth" })
    orgUpdate.mockResolvedValue({ id: "org-1", plan: "growth" })
    quotaUpsert.mockResolvedValue({ id: "quota-1" })
    operationalCreate.mockResolvedValue({ id: "event-1" })

    const { POST } = await import("../../app/api/billing-runtime/subscription/route")
    const response = await POST(jsonRequest({ organizationId: "org-1", planSlug: "growth" }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.subscription.planSlug).toBe("growth")
    expect(subscriptionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "new" } })
    )
    expect(orgUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { plan: "growth" } })
    )
    expect(quotaUpsert).toHaveBeenCalledOnce()
    expect(operationalCreate).toHaveBeenCalledOnce()
  })

  it("rejects an anonymous client invoice", async () => {
    session(null)
    const { POST } = await import("../../app/api/client-invoices/route")
    await expectDenied(401, () =>
      POST(jsonRequest({ clientId: "client-1", invoiceNumber: "INV-1", amountAud: 250 }))
    )
  })

  it("rejects an authenticated non-editor client invoice", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/client-invoices/route")
    await expectDenied(403, () =>
      POST(jsonRequest({ clientId: "client-1", invoiceNumber: "INV-1", amountAud: 250 }))
    )
  })

  it("lets an editor create a client invoice", async () => {
    session(user("editor"))
    clientFindUnique.mockResolvedValue({ id: "client-1", name: "Ada" })
    invoiceCreate.mockResolvedValue({
      id: "invoice-1",
      clientId: "client-1",
      projectId: null,
      invoiceNumber: "INV-1",
      amountAud: 250,
      status: "draft",
    })

    const { POST } = await import("../../app/api/client-invoices/route")
    const response = await POST(
      jsonRequest({ clientId: "client-1", invoiceNumber: "INV-1", amountAud: 250 })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.invoice.status).toBe("draft")
    expect(body.invoice.client.name).toBe("Ada")
    expect(invoiceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: "client-1",
          invoiceNumber: "INV-1",
          amountAud: 250,
          status: "draft",
        }),
      })
    )
  })

  it("rejects an anonymous invoice status change", async () => {
    session(null)
    const { PATCH } = await import("../../app/api/client-invoices/route")
    await expectDenied(401, () => PATCH(jsonRequest({ id: "invoice-1", status: "paid" }, "PATCH")))
  })

  it("rejects an authenticated non-editor invoice status change", async () => {
    session(user("viewer"))
    const { PATCH } = await import("../../app/api/client-invoices/route")
    await expectDenied(403, () => PATCH(jsonRequest({ id: "invoice-1", status: "paid" }, "PATCH")))
  })

  it("lets an editor mark an invoice paid", async () => {
    session(user("editor"))
    invoiceFindUnique.mockResolvedValue({
      id: "invoice-1",
      clientId: "client-1",
      projectId: null,
      paidDate: null,
      status: "draft",
    })
    invoiceUpdate.mockResolvedValue({
      id: "invoice-1",
      clientId: "client-1",
      projectId: null,
      status: "paid",
    })
    clientFindUnique.mockResolvedValue({ id: "client-1", name: "Ada" })

    const { PATCH } = await import("../../app/api/client-invoices/route")
    const response = await PATCH(jsonRequest({ id: "invoice-1", status: "paid" }, "PATCH"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.invoice.status).toBe("paid")
    expect(invoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "invoice-1" },
        data: expect.objectContaining({ status: "paid" }),
      })
    )
  })

  it("rejects an anonymous lead conversion", async () => {
    session(null)
    const { POST } = await import("../../app/api/clients/convert/route")
    await expectDenied(401, () => POST(jsonRequest({ leadId: "lead-1", email: SPOOF })))
  })

  it("rejects an authenticated non-editor lead conversion", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/clients/convert/route")
    await expectDenied(403, () => POST(jsonRequest({ leadId: "lead-1" })))
  })

  it("converts a lead using the lead address, not a body email", async () => {
    session(user("editor"))
    leadFindUnique.mockResolvedValue({
      id: "lead-1",
      name: "Lead",
      email: LEAD_EMAIL,
      creatorType: "teacher",
      notes: null,
      niche: "faith",
    })
    clientFindFirst.mockResolvedValue(null)
    clientCreate.mockResolvedValue({ id: "client-1", email: LEAD_EMAIL, name: "Lead" })

    const { POST } = await import("../../app/api/clients/convert/route")
    const response = await POST(jsonRequest({ leadId: "lead-1", email: SPOOF }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.client.email).toBe(LEAD_EMAIL)
    expect(clientCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: LEAD_EMAIL, source: "creator-lead" }),
      })
    )
    expect(JSON.stringify(clientCreate.mock.calls)).not.toContain(SPOOF)
  })

  it("rejects an anonymous creator invoice", async () => {
    session(null)
    const { POST } = await import("../../app/api/creator-revenue/invoice/route")
    await expectDenied(401, () => POST(jsonRequest({ proposalId: "proposal-1" })))
  })

  it("rejects an authenticated non-editor creator invoice", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/creator-revenue/invoice/route")
    await expectDenied(403, () => POST(jsonRequest({ proposalId: "proposal-1" })))
  })

  it("lets an editor generate a creator invoice from a proposal", async () => {
    session(user("editor"))
    proposalFindUnique.mockResolvedValue({
      id: "proposal-1",
      leadId: "lead-1",
      estimatedValue: 1200,
      title: "Automation package",
    })
    creatorInvoiceCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "invoice-1",
      ...data,
    }))
    revenueEventCreate.mockResolvedValue({ id: "event-1" })

    const { POST } = await import("../../app/api/creator-revenue/invoice/route")
    const response = await POST(jsonRequest({ proposalId: "proposal-1" }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.invoice.amount).toBe(1200)
    expect(body.invoice.status).toBe("sent")
    expect(String(body.invoice.invoiceNumber)).toMatch(/^EV-/)
    expect(revenueEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "invoice-generated", amount: 1200 }),
      })
    )
  })

  it("rejects an anonymous creator proposal before the model call", async () => {
    session(null)
    const { POST } = await import("../../app/api/creator-revenue/route")
    await expectDenied(401, () => POST(jsonRequest({ auditId: "audit-1" })))
  })

  it("rejects an authenticated non-editor creator proposal", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/creator-revenue/route")
    await expectDenied(403, () => POST(jsonRequest({ auditId: "audit-1" })))
  })

  it("lets an editor generate a creator proposal", async () => {
    session(user("editor"))
    auditFindUnique.mockResolvedValue({ id: "audit-1", summary: "Audit" })
    createResponse.mockResolvedValue({
      output_text: JSON.stringify({
        title: "Creator automation proposal",
        description: "Implement the workflow",
        packageType: "automation",
        estimatedValue: 3500,
        implementationWeeks: 4,
        proposalContent: "Scope",
        pricingBreakdown: { audit: 500 },
        aiSummary: "Ready for review",
      }),
    })
    proposalCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "proposal-1",
      ...data,
    }))
    revenueEventCreate.mockResolvedValue({ id: "event-1" })

    const { POST } = await import("../../app/api/creator-revenue/route")
    const response = await POST(jsonRequest({ auditId: "audit-1" }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.proposal.title).toBe("Creator automation proposal")
    expect(body.proposal.status).toBe("review-required")
    expect(createResponse).toHaveBeenCalledOnce()
    expect(revenueEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "proposal-generated" }),
      })
    )
  })

  it("rejects an anonymous CRM client before disclosure or creation", async () => {
    session(null)
    const { POST } = await import("../../app/api/crm/clients/route")
    await expectDenied(401, () =>
      POST(jsonRequest({ name: "Ada", email: CLIENT_EMAIL, actorEmail: SPOOF }))
    )
  })

  it("rejects an authenticated non-editor CRM client", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/crm/clients/route")
    await expectDenied(403, () => POST(jsonRequest({ name: "Ada", email: CLIENT_EMAIL })))
  })

  it("lets an editor save a CRM client contact without an actor override", async () => {
    session(user("editor"))
    clientCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "client-1",
      ...data,
    }))

    const { POST } = await import("../../app/api/crm/clients/route")
    const response = await POST(
      jsonRequest({
        name: "Ada",
        email: CLIENT_EMAIL,
        type: "lead",
        actorEmail: SPOOF,
        requestedBy: SPOOF,
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.client.name).toBe("Ada")
    expect(body.client.email).toBe(CLIENT_EMAIL)
    expect(clientCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Ada",
          email: CLIENT_EMAIL,
          type: "lead",
        }),
      })
    )
    expect(JSON.stringify(clientCreate.mock.calls)).not.toContain(SPOOF)
  })
})
