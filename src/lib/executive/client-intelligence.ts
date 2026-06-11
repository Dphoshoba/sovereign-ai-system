import { getBusinessSnapshot } from "@/lib/business/business-data-layer"
import { buildBusinessMemory } from "@/lib/executive/business-memory"
import { prisma } from "@/lib/prisma"

// Phase 29.4 — Client Intelligence.
// Deterministic executive intelligence for every client, built on the unified
// business data layer and business memory. No OpenAI. Production safe.

export type ClientRelationshipStatus =
  | "Healthy"
  | "Growing"
  | "At Risk"
  | "Dormant"

export type ClientIntelligenceRecord = {
  clientId: string
  clientName: string
  healthScore: number
  riskScore: number
  opportunityScore: number
  revenueGenerated: number
  outstandingRevenue: number
  activeProjects: number
  completedProjects: number
  invoiceStatus: string
  projectStatus: string
  relationshipStatus: ClientRelationshipStatus
  nextBestAction: string
}

export type ClientIntelligenceSummary = {
  totalClients: number
  healthyClients: number
  atRiskClients: number
  dormantClients: number
  totalRevenue: number
  totalOutstanding: number
}

export type ClientIntelligence = {
  clients: ClientIntelligenceRecord[]
  summary: ClientIntelligenceSummary
  generatedAt: string
}

const QUERY_LIMIT = 100
const RECENT_ACTIVITY_DAYS = 30

const COMPLETED_PROJECT_STATUSES = new Set(["completed", "done"])
const ACCEPTED_PROPOSAL_STATUSES = new Set(["accepted", "approved", "won"])
const OPEN_PROPOSAL_STATUSES = new Set(["draft", "sent"])

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function daysSince(date: Date, now: Date) {
  return Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000))
}

/** Best-effort daily snapshot persistence — never fails the caller. */
async function storeClientIntelligenceSnapshot(
  intelligence: ClientIntelligence
) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const title = `Client Intelligence Snapshot ${today}`

    const content = JSON.stringify({
      summary: intelligence.summary,
      clients: intelligence.clients.map((client) => ({
        name: client.clientName,
        relationshipStatus: client.relationshipStatus,
        healthScore: client.healthScore,
        riskScore: client.riskScore,
        nextBestAction: client.nextBestAction,
      })),
    })

    const existing = await prisma.aiMemory.findFirst({
      where: { type: "client-intelligence-snapshot", title },
    })

    if (existing) {
      await prisma.aiMemory.update({
        where: { id: existing.id },
        data: { content },
      })
    } else {
      await prisma.aiMemory.create({
        data: {
          type: "client-intelligence-snapshot",
          title,
          content,
          source: "client-intelligence",
          tags: "executive,client,intelligence,snapshot",
        },
      })
    }
  } catch (error) {
    console.error("Failed to store client intelligence snapshot:", error)
  }
}

export async function buildClientIntelligence(): Promise<ClientIntelligence> {
  const now = new Date()

  // Shared snapshot feeds business memory without duplicate queries; memory
  // keeps the daily business event stream warm alongside this engine.
  const snapshot = await getBusinessSnapshot()

  const [, clients, projects, invoices, leads, proposals] = await Promise.all([
    buildBusinessMemory({ snapshot }),
    prisma.clientProfile.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        updatedAt: true,
      },
    }),
    prisma.clientProject.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
      select: {
        clientId: true,
        status: true,
        valueAud: true,
        dueDate: true,
        updatedAt: true,
      },
    }),
    prisma.clientInvoice.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
      select: {
        clientId: true,
        status: true,
        amountAud: true,
        dueDate: true,
        updatedAt: true,
      },
    }),
    prisma.creatorLead.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
      select: { id: true, email: true },
    }),
    prisma.creatorProposal.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
      select: { leadId: true, status: true, estimatedValue: true },
    }),
  ])

  // Proposals link to leads; match leads to clients by email (deterministic).
  const leadIdByEmail = new Map(
    leads
      .filter((lead) => lead.email)
      .map((lead) => [lead.email.toLowerCase(), lead.id])
  )

  const records: ClientIntelligenceRecord[] = []

  for (const client of clients) {
    const clientProjects = projects.filter(
      (project) => project.clientId === client.id
    )
    const clientInvoices = invoices.filter(
      (invoice) => invoice.clientId === client.id
    )

    const leadId = client.email
      ? leadIdByEmail.get(client.email.toLowerCase())
      : undefined
    const clientProposals = leadId
      ? proposals.filter((proposal) => proposal.leadId === leadId)
      : []

    // Invoices.
    const paidInvoices = clientInvoices.filter(
      (invoice) => invoice.status === "paid"
    )
    const unpaidInvoices = clientInvoices.filter(
      (invoice) => invoice.status !== "paid"
    )
    const overdueInvoices = unpaidInvoices.filter(
      (invoice) => invoice.dueDate !== null && invoice.dueDate < now
    )

    const revenueGenerated = round2(
      paidInvoices.reduce((sum, invoice) => sum + invoice.amountAud, 0)
    )
    const outstandingRevenue = round2(
      unpaidInvoices.reduce((sum, invoice) => sum + invoice.amountAud, 0)
    )

    // Projects.
    const activeProjects = clientProjects.filter(
      (project) => project.status === "active"
    ).length
    const completedProjects = clientProjects.filter((project) =>
      COMPLETED_PROJECT_STATUSES.has(project.status)
    ).length
    const overdueProjects = clientProjects.filter(
      (project) =>
        !COMPLETED_PROJECT_STATUSES.has(project.status) &&
        project.dueDate !== null &&
        project.dueDate < now
    ).length

    // Proposals.
    const acceptedProposals = clientProposals.filter((proposal) =>
      ACCEPTED_PROPOSAL_STATUSES.has(proposal.status)
    ).length
    const openProposals = clientProposals.filter((proposal) =>
      OPEN_PROPOSAL_STATUSES.has(proposal.status)
    ).length

    // Activity recency across all client touchpoints.
    const lastActivity = [
      client.updatedAt,
      ...clientProjects.map((project) => project.updatedAt),
      ...clientInvoices.map((invoice) => invoice.updatedAt),
    ].reduce((latest, date) => (date > latest ? date : latest))

    const recentActivity = daysSince(lastActivity, now) <= RECENT_ACTIVITY_DAYS

    // -----------------------------------------------------------------------
    // Scores.
    // -----------------------------------------------------------------------
    const healthScore = Math.round(
      clamp(
        40 +
          Math.min(paidInvoices.length * 10, 20) +
          Math.min(completedProjects * 8, 16) +
          (activeProjects > 0 ? 10 : 0) +
          Math.min(acceptedProposals * 8, 8) +
          (recentActivity ? 6 : 0),
        0,
        100
      )
    )

    const riskScore = Math.round(
      clamp(
        overdueInvoices.length * 25 +
          overdueProjects * 20 +
          (!recentActivity ? 20 : 0) +
          (outstandingRevenue > 0
            ? outstandingRevenue > revenueGenerated
              ? 20
              : 10
            : 0),
        0,
        100
      )
    )

    const opportunityScore = Math.round(
      clamp(
        Math.min(activeProjects * 15, 30) +
          Math.min(openProposals * 15, 30) +
          (completedProjects > 0 ? 15 : 0) +
          (clientProjects.length >= 2 ? 15 : 0) +
          (recentActivity ? 10 : 0),
        0,
        100
      )
    )

    // -----------------------------------------------------------------------
    // Relationship status — deterministic precedence.
    // -----------------------------------------------------------------------
    let relationshipStatus: ClientRelationshipStatus

    if (riskScore >= 50) {
      relationshipStatus = "At Risk"
    } else if (!recentActivity && activeProjects === 0) {
      relationshipStatus = "Dormant"
    } else if (opportunityScore >= 50 && healthScore >= 50) {
      relationshipStatus = "Growing"
    } else {
      relationshipStatus = "Healthy"
    }

    // -----------------------------------------------------------------------
    // Next best action — first matching rule wins.
    // -----------------------------------------------------------------------
    let nextBestAction: string

    if (overdueInvoices.length > 0) {
      nextBestAction = `Follow up overdue invoice${overdueInvoices.length === 1 ? "" : "s"} — $${outstandingRevenue.toLocaleString()} AUD past due.`
    } else if (outstandingRevenue > 0) {
      nextBestAction = `Chase outstanding payment of $${outstandingRevenue.toLocaleString()} AUD before due date passes.`
    } else if (openProposals > 0) {
      nextBestAction = `Convert open proposal${openProposals === 1 ? "" : "s"} — follow up with a specific start date.`
    } else if (relationshipStatus === "Dormant") {
      nextBestAction =
        "Re-engage dormant client with a check-in and a new offer."
    } else if (completedProjects > 0 && activeProjects === 0) {
      nextBestAction =
        "Upsell maintenance package or phase-two scope on completed work."
    } else if (activeProjects > 0) {
      nextBestAction =
        "Schedule review meeting to confirm delivery progress and surface expansion scope."
    } else {
      nextBestAction =
        "Schedule review meeting to qualify the next engagement."
    }

    records.push({
      clientId: client.id,
      clientName: client.name,
      healthScore,
      riskScore,
      opportunityScore,
      revenueGenerated,
      outstandingRevenue,
      activeProjects,
      completedProjects,
      invoiceStatus: `${paidInvoices.length} paid, ${unpaidInvoices.length} unpaid (${overdueInvoices.length} overdue)`,
      projectStatus: `${activeProjects} active, ${completedProjects} completed, ${overdueProjects} overdue`,
      relationshipStatus,
      nextBestAction,
    })
  }

  records.sort(
    (a, b) =>
      b.riskScore - a.riskScore ||
      b.opportunityScore - a.opportunityScore ||
      a.clientName.localeCompare(b.clientName)
  )

  const summary: ClientIntelligenceSummary = {
    totalClients: records.length,
    healthyClients: records.filter(
      (record) =>
        record.relationshipStatus === "Healthy" ||
        record.relationshipStatus === "Growing"
    ).length,
    atRiskClients: records.filter(
      (record) => record.relationshipStatus === "At Risk"
    ).length,
    dormantClients: records.filter(
      (record) => record.relationshipStatus === "Dormant"
    ).length,
    totalRevenue: round2(
      records.reduce((sum, record) => sum + record.revenueGenerated, 0)
    ),
    totalOutstanding: round2(
      records.reduce((sum, record) => sum + record.outstandingRevenue, 0)
    ),
  }

  const intelligence: ClientIntelligence = {
    clients: records,
    summary,
    generatedAt: now.toISOString(),
  }

  // Fire-and-forget: persistence never blocks or fails the response.
  void storeClientIntelligenceSnapshot(intelligence)

  return intelligence
}
