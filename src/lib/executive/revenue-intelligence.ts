import {
  getBusinessSnapshot,
  type BusinessSnapshot,
} from "@/lib/business/business-data-layer"
import {
  buildBusinessMemory,
  type BusinessMemory,
} from "@/lib/executive/business-memory"
import { prisma } from "@/lib/prisma"

// Phase 29.3 — Revenue Intelligence.
// Transforms the unified business data layer and business memory into
// deterministic executive revenue intelligence. No OpenAI. Production safe.

export type RevenueRiskType =
  | "collection_risk"
  | "cashflow_risk"
  | "pipeline_risk"
  | "client_concentration_risk"

export type RevenueRisk = {
  type: RevenueRiskType
  title: string
  severity: "low" | "medium" | "high" | "critical"
  impact: string
  mitigation: string
}

export type RevenueOpportunityType =
  | "proposal_conversion"
  | "upsell_existing_clients"
  | "qualified_lead_conversion"
  | "invoice_collection"

export type RevenueOpportunity = {
  type: RevenueOpportunityType
  title: string
  value: number
  action: string
}

export type RevenueIntelligence = {
  collectedRevenue: number
  outstandingRevenue: number
  pipelineValue: number
  forecastRevenue: number
  collectionRate: number
  revenueHealth: number
  risks: RevenueRisk[]
  opportunities: RevenueOpportunity[]
  trendSummary: string[]
  generatedAt: string
}

const QUERY_LIMIT = 100
const CONCENTRATION_THRESHOLD = 0.6

const ACCEPTED_PROPOSAL_STATUSES = new Set(["accepted", "approved", "won"])

const PIPELINE_WEIGHTS = {
  accepted: 1,
  sent: 0.6,
  draft: 0.25,
} as const

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function formatAud(value: number) {
  return `$${value.toLocaleString()} AUD`
}

/** Best-effort daily snapshot persistence — never fails the caller. */
async function storeRevenueIntelligenceSnapshot(
  intelligence: RevenueIntelligence
) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const title = `Revenue Intelligence Snapshot ${today}`

    const content = JSON.stringify({
      revenueHealth: intelligence.revenueHealth,
      collectedRevenue: intelligence.collectedRevenue,
      outstandingRevenue: intelligence.outstandingRevenue,
      pipelineValue: intelligence.pipelineValue,
      forecastRevenue: intelligence.forecastRevenue,
      collectionRate: intelligence.collectionRate,
      riskCount: intelligence.risks.length,
      opportunityCount: intelligence.opportunities.length,
    })

    const existing = await prisma.aiMemory.findFirst({
      where: { type: "revenue-intelligence-snapshot", title },
    })

    if (existing) {
      await prisma.aiMemory.update({
        where: { id: existing.id },
        data: { content },
      })
    } else {
      await prisma.aiMemory.create({
        data: {
          type: "revenue-intelligence-snapshot",
          title,
          content,
          source: "revenue-intelligence",
          tags: "executive,revenue,intelligence,snapshot",
        },
      })
    }
  } catch (error) {
    console.error("Failed to store revenue intelligence snapshot:", error)
  }
}

function buildRisks(
  snapshot: BusinessSnapshot,
  topClientShare: number
): RevenueRisk[] {
  const risks: RevenueRisk[] = []
  const { revenue, invoices, proposals } = snapshot

  if (revenue.totalInvoicedAud > 0 && revenue.collectionRate < 50) {
    risks.push({
      type: "collection_risk",
      title: `Collection rate at ${revenue.collectionRate}%`,
      severity: revenue.collectionRate < 30 ? "critical" : "high",
      impact: `${formatAud(revenue.outstandingAud)} of ${formatAud(revenue.totalInvoicedAud)} invoiced remains uncollected.`,
      mitigation:
        "Run a collections sweep: send payment reminders, follow up by phone, and require deposits on new work.",
    })
  }

  if (revenue.outstandingAud > revenue.totalPaidAud || invoices.overdue > 0) {
    risks.push({
      type: "cashflow_risk",
      title:
        invoices.overdue > 0
          ? `${invoices.overdue} invoice${invoices.overdue === 1 ? "" : "s"} overdue`
          : "Outstanding revenue exceeds collected revenue",
      severity: invoices.overdue > 0 ? "high" : "medium",
      impact: `${formatAud(revenue.outstandingAud)} outstanding against ${formatAud(revenue.totalPaidAud)} collected constrains operating cashflow.`,
      mitigation:
        "Prioritize overdue invoices, shorten payment terms, and invoice milestones instead of completions.",
    })
  }

  if (proposals.sent === 0 && snapshot.revenue.pipelineValueAud === 0) {
    risks.push({
      type: "pipeline_risk",
      title: "No active proposal pipeline",
      severity: "high",
      impact:
        "No sent proposals or open pipeline value — future revenue depends entirely on existing clients.",
      mitigation:
        "Convert qualified leads into proposals this week and standardize the proposal template to reduce turnaround.",
    })
  }

  if (topClientShare >= CONCENTRATION_THRESHOLD) {
    risks.push({
      type: "client_concentration_risk",
      title: `Top client represents ${Math.round(topClientShare * 100)}% of invoiced revenue`,
      severity: topClientShare >= 0.8 ? "high" : "medium",
      impact:
        "Losing the top client would remove most invoiced revenue in one event.",
      mitigation:
        "Diversify: convert high-score leads into new clients and grow secondary accounts.",
    })
  }

  return risks
}

function buildOpportunities(
  snapshot: BusinessSnapshot,
  sentProposalValue: number
): RevenueOpportunity[] {
  const opportunities: RevenueOpportunity[] = []
  const { revenue, proposals, leads, projects, clients } = snapshot

  if (sentProposalValue > 0) {
    opportunities.push({
      type: "proposal_conversion",
      title: `Convert ${proposals.sent} sent proposal${proposals.sent === 1 ? "" : "s"}`,
      value: round2(sentProposalValue * PIPELINE_WEIGHTS.sent),
      action:
        "Follow up on every sent proposal within 48 hours with a specific next step and start date.",
    })
  }

  if (clients.active > 0 && projects.totalValueAud > 0) {
    opportunities.push({
      type: "upsell_existing_clients",
      title: `Upsell ${clients.active} active client${clients.active === 1 ? "" : "s"}`,
      value: round2(projects.totalValueAud * 0.25),
      action:
        "Offer a maintenance retainer or phase-two scope to every client with a completed or active project.",
    })
  }

  if (leads.qualified > 0 || leads.highValue > 0) {
    opportunities.push({
      type: "qualified_lead_conversion",
      title: `Convert ${Math.max(leads.qualified, leads.highValue)} qualified/high-score lead${Math.max(leads.qualified, leads.highValue) === 1 ? "" : "s"}`,
      value: round2(
        leads.projectedValueAud > 0
          ? leads.projectedValueAud
          : Math.max(leads.qualified, leads.highValue) * 1500
      ),
      action:
        "Send audit-based proposals to all qualified leads — proposals tied to specific findings close faster.",
    })
  }

  if (revenue.outstandingAud > 0) {
    opportunities.push({
      type: "invoice_collection",
      title: "Collect outstanding invoices",
      value: round2(revenue.outstandingAud),
      action:
        "Chase every unpaid invoice this week — fastest revenue available with zero new delivery work.",
    })
  }

  return opportunities.sort((a, b) => b.value - a.value)
}

function buildTrendSummary(
  snapshot: BusinessSnapshot,
  memory: BusinessMemory
): string[] {
  const trends: string[] = []
  const counts = memory.eventCounts

  trends.push(
    `${counts.invoice_issued} invoice${counts.invoice_issued === 1 ? "" : "s"} issued vs ${counts.invoice_paid} paid — collection rate ${snapshot.revenue.collectionRate}%.`
  )

  if (counts.lead_created > 0) {
    trends.push(
      `${counts.lead_created} lead${counts.lead_created === 1 ? "" : "s"} captured, ${counts.lead_qualified} qualified, ${counts.lead_converted} converted.`
    )
  }

  if (counts.proposal_sent > 0 || counts.proposal_accepted > 0) {
    trends.push(
      `${counts.proposal_sent} proposal${counts.proposal_sent === 1 ? "" : "s"} sent, ${counts.proposal_accepted} accepted — ${formatAud(snapshot.revenue.pipelineValueAud)} open pipeline.`
    )
  }

  trends.push(
    `${counts.project_started} project${counts.project_started === 1 ? "" : "s"} started, ${counts.project_completed} completed, ${counts.project_overdue} overdue.`
  )

  if (counts.task_completed > 0 || counts.task_overdue > 0) {
    trends.push(
      `${counts.task_completed} delivery task${counts.task_completed === 1 ? "" : "s"} completed, ${counts.task_overdue} overdue.`
    )
  }

  return trends
}

export async function buildRevenueIntelligence(): Promise<RevenueIntelligence> {
  const now = new Date()

  // Unified business data layer + business memory (snapshot shared, not re-queried).
  const snapshot = await getBusinessSnapshot()

  const [memory, invoiceRows, proposalRows] = await Promise.all([
    buildBusinessMemory({ snapshot }),
    prisma.clientInvoice.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
      select: { clientId: true, amountAud: true, status: true },
    }),
    prisma.creatorProposal.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
      select: { status: true, estimatedValue: true },
    }),
  ])

  // ---------------------------------------------------------------------------
  // Core metrics.
  // ---------------------------------------------------------------------------
  const collectedRevenue = snapshot.revenue.totalPaidAud
  const outstandingRevenue = snapshot.revenue.outstandingAud
  const pipelineValue = snapshot.revenue.pipelineValueAud
  const collectionRate = snapshot.revenue.collectionRate

  // Weighted pipeline: accepted 100%, sent 60%, draft 25%.
  let weightedPipeline = 0
  let sentProposalValue = 0
  let acceptedProposals = 0

  for (const proposal of proposalRows) {
    const value = proposal.estimatedValue ?? 0

    if (ACCEPTED_PROPOSAL_STATUSES.has(proposal.status)) {
      weightedPipeline += value * PIPELINE_WEIGHTS.accepted
      acceptedProposals += 1
    } else if (proposal.status === "sent") {
      weightedPipeline += value * PIPELINE_WEIGHTS.sent
      sentProposalValue += value
    } else if (proposal.status === "draft") {
      weightedPipeline += value * PIPELINE_WEIGHTS.draft
    }
  }

  const forecastRevenue = round2(
    collectedRevenue + outstandingRevenue + weightedPipeline
  )

  // ---------------------------------------------------------------------------
  // Client concentration — top client's share of invoiced revenue.
  // ---------------------------------------------------------------------------
  const invoicedByClient = new Map<string, number>()
  let totalInvoiced = 0

  for (const invoice of invoiceRows) {
    invoicedByClient.set(
      invoice.clientId,
      (invoicedByClient.get(invoice.clientId) ?? 0) + invoice.amountAud
    )
    totalInvoiced += invoice.amountAud
  }

  const topClientShare =
    totalInvoiced > 0
      ? Math.max(...invoicedByClient.values(), 0) / totalInvoiced
      : 0

  // ---------------------------------------------------------------------------
  // Revenue health score.
  // ---------------------------------------------------------------------------
  const positive =
    (collectionRate >= 70 ? 10 : collectionRate >= 50 ? 5 : 0) +
    Math.min(snapshot.invoices.paid * 3, 9) +
    Math.min(snapshot.leads.qualified * 3, 9) +
    (pipelineValue > 0 ? 5 : 0) +
    (snapshot.proposals.total >= 3 ? 4 : 0) +
    (acceptedProposals > 0 ? 5 : 0)

  const negative =
    (outstandingRevenue > collectedRevenue ? 8 : 0) +
    snapshot.invoices.overdue * 6 +
    (snapshot.revenue.totalInvoicedAud > 0 && collectionRate < 50 ? 10 : 0) +
    (acceptedProposals === 0 ? 5 : 0) +
    (topClientShare >= CONCENTRATION_THRESHOLD ? 8 : 0)

  const revenueHealth = Math.round(clamp(50 + positive - negative, 0, 100))

  // ---------------------------------------------------------------------------
  // Risks, opportunities, trends.
  // ---------------------------------------------------------------------------
  const intelligence: RevenueIntelligence = {
    collectedRevenue,
    outstandingRevenue,
    pipelineValue,
    forecastRevenue,
    collectionRate,
    revenueHealth,
    risks: buildRisks(snapshot, topClientShare),
    opportunities: buildOpportunities(snapshot, sentProposalValue),
    trendSummary: buildTrendSummary(snapshot, memory),
    generatedAt: now.toISOString(),
  }

  // Fire-and-forget: persistence never blocks or fails the response.
  void storeRevenueIntelligenceSnapshot(intelligence)

  return intelligence
}
