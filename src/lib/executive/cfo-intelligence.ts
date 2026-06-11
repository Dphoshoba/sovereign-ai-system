import { getBusinessSnapshot } from "@/lib/business/business-data-layer"
import { buildBusinessMemory } from "@/lib/executive/business-memory"
import { buildClientIntelligence } from "@/lib/executive/client-intelligence"
import { buildRevenueIntelligence } from "@/lib/executive/revenue-intelligence"
import { prisma } from "@/lib/prisma"

// Phase 31 — CFO Intelligence Layer.
// Financial intelligence that sits above revenue intelligence: health,
// cashflow, 30/60/90 forecasts, client value, concentration, and CFO-level
// recommendations. Deterministic only. No OpenAI. Production safe.

export type CashflowStatus = "Healthy" | "Stable" | "Warning" | "Critical"

export type CfoRiskType =
  | "cashflow_risk"
  | "collections_risk"
  | "concentration_risk"
  | "forecast_risk"

export type CfoRisk = {
  type: CfoRiskType
  title: string
  severity: "low" | "medium" | "high" | "critical"
  impact: string
  mitigation: string
}

export type CfoOpportunityType =
  | "accelerate_collections"
  | "expand_existing_clients"
  | "convert_pipeline"
  | "increase_retainers"

export type CfoOpportunity = {
  type: CfoOpportunityType
  title: string
  value: number
  action: string
}

export type CfoIntelligence = {
  financialHealth: number
  cashflowHealth: {
    score: number
    status: CashflowStatus
  }
  revenueForecast: {
    next30Days: number
    next60Days: number
    next90Days: number
  }
  collectionsForecast: {
    expectedCollections: number
    collectionRate: number
    overdueExposure: number
  }
  clientValue: {
    highestValueClient: string | null
    averageClientValue: number
    totalClientValue: number
  }
  revenueConcentration: {
    largestClientPercent: number
    concentrationRisk: "low" | "medium" | "high"
  }
  risks: CfoRisk[]
  opportunities: CfoOpportunity[]
  recommendations: string[]
  generatedAt: string
}

const QUERY_LIMIT = 100

// Pipeline maturity reaching cash by horizon (deterministic staging).
const HORIZON_PIPELINE_FACTORS = { d30: 0.3, d60: 0.6, d90: 1 } as const

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
async function storeCfoSnapshot(cfo: CfoIntelligence) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const title = `CFO Intelligence Snapshot ${today}`

    const content = JSON.stringify({
      financialHealth: cfo.financialHealth,
      cashflowHealth: cfo.cashflowHealth,
      revenueForecast: cfo.revenueForecast,
      collectionsForecast: cfo.collectionsForecast,
      revenueConcentration: cfo.revenueConcentration,
      riskCount: cfo.risks.length,
      opportunityCount: cfo.opportunities.length,
      recommendations: cfo.recommendations,
    })

    const existing = await prisma.aiMemory.findFirst({
      where: { type: "cfo-intelligence-snapshot", title },
    })

    if (existing) {
      await prisma.aiMemory.update({
        where: { id: existing.id },
        data: { content },
      })
    } else {
      await prisma.aiMemory.create({
        data: {
          type: "cfo-intelligence-snapshot",
          title,
          content,
          source: "cfo-intelligence",
          tags: "executive,cfo,finance,snapshot",
        },
      })
    }
  } catch (error) {
    console.error("Failed to store CFO snapshot:", error)
  }
}

export async function buildCfoIntelligence(): Promise<CfoIntelligence> {
  const now = new Date()

  // Shared inputs, fetched once and reused across engines (production safe).
  const snapshot = await getBusinessSnapshot()
  const memory = await buildBusinessMemory({ snapshot })

  const [revenue, clientIntel, invoiceRows] = await Promise.all([
    buildRevenueIntelligence({ snapshot, memory }),
    buildClientIntelligence({ snapshot }),
    prisma.clientInvoice.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
      select: { status: true, amountAud: true, dueDate: true },
    }),
  ])

  // ---------------------------------------------------------------------------
  // Core financial figures.
  // ---------------------------------------------------------------------------
  const collected = revenue.collectedRevenue
  const outstanding = revenue.outstandingRevenue
  const collectionRate = revenue.collectionRate

  // Weighted pipeline is the forecast component beyond cash and receivables.
  const weightedPipeline = round2(
    Math.max(0, revenue.forecastRevenue - collected - outstanding)
  )

  const overdueExposure = round2(
    invoiceRows
      .filter(
        (invoice) =>
          invoice.status !== "paid" &&
          invoice.dueDate !== null &&
          invoice.dueDate < now
      )
      .reduce((sum, invoice) => sum + invoice.amountAud, 0)
  )

  // ---------------------------------------------------------------------------
  // Revenue forecast — paid + outstanding + staged weighted pipeline.
  // ---------------------------------------------------------------------------
  const revenueForecast = {
    next30Days: round2(
      collected + outstanding + weightedPipeline * HORIZON_PIPELINE_FACTORS.d30
    ),
    next60Days: round2(
      collected + outstanding + weightedPipeline * HORIZON_PIPELINE_FACTORS.d60
    ),
    next90Days: round2(
      collected + outstanding + weightedPipeline * HORIZON_PIPELINE_FACTORS.d90
    ),
  }

  // ---------------------------------------------------------------------------
  // Collections forecast — expected recovery discounted by collection record.
  // ---------------------------------------------------------------------------
  const collectionsForecast = {
    expectedCollections: round2(
      outstanding * (collectionRate >= 50 ? 0.9 : 0.7)
    ),
    collectionRate,
    overdueExposure,
  }

  // ---------------------------------------------------------------------------
  // Client value.
  // ---------------------------------------------------------------------------
  const clientsByValue = [...clientIntel.clients].sort(
    (a, b) => b.revenueGenerated - a.revenueGenerated
  )

  const totalClientValue = round2(
    clientIntel.clients.reduce(
      (sum, client) => sum + client.revenueGenerated,
      0
    )
  )

  const clientValue = {
    highestValueClient:
      clientsByValue.length > 0 && clientsByValue[0].revenueGenerated > 0
        ? clientsByValue[0].clientName
        : null,
    averageClientValue:
      clientIntel.clients.length > 0
        ? round2(totalClientValue / clientIntel.clients.length)
        : 0,
    totalClientValue,
  }

  // ---------------------------------------------------------------------------
  // Revenue concentration — largest client's share of invoiced revenue.
  // ---------------------------------------------------------------------------
  const invoicedByClient = clientIntel.clients.map(
    (client) => client.revenueGenerated + client.outstandingRevenue
  )
  const totalInvoicedAcrossClients = invoicedByClient.reduce(
    (sum, value) => sum + value,
    0
  )

  const largestClientPercent =
    totalInvoicedAcrossClients > 0
      ? Math.round(
          (Math.max(...invoicedByClient, 0) / totalInvoicedAcrossClients) * 100
        )
      : 0

  const concentrationRisk: "low" | "medium" | "high" =
    largestClientPercent >= 60
      ? "high"
      : largestClientPercent >= 40
        ? "medium"
        : "low"

  // ---------------------------------------------------------------------------
  // Cashflow health.
  // ---------------------------------------------------------------------------
  const cashBalanceRatio =
    collected + outstanding > 0
      ? (collected - outstanding) / (collected + outstanding)
      : 0

  const cashflowScore = Math.round(
    clamp(
      50 +
        cashBalanceRatio * 30 +
        collectionRate / 5 -
        snapshot.invoices.overdue * 10 -
        (overdueExposure > collected ? 10 : 0),
      0,
      100
    )
  )

  const cashflowStatus: CashflowStatus =
    cashflowScore >= 75
      ? "Healthy"
      : cashflowScore >= 55
        ? "Stable"
        : cashflowScore >= 35
          ? "Warning"
          : "Critical"

  // ---------------------------------------------------------------------------
  // Financial health score.
  // ---------------------------------------------------------------------------
  const positive =
    Math.min(collected / 1000, 10) +
    (collectionRate >= 70 ? 10 : collectionRate >= 50 ? 5 : 0) +
    (weightedPipeline >= outstanding && weightedPipeline > 0 ? 8 : 0) +
    (weightedPipeline > 0 ? 4 : 0) +
    Math.min(snapshot.clients.active * 2, 6) +
    (revenueForecast.next90Days > collected * 1.5 ? 6 : 0)

  const negative =
    (outstanding > 0 ? 5 : 0) +
    snapshot.invoices.overdue * 6 +
    (concentrationRisk === "high" ? 10 : concentrationRisk === "medium" ? 5 : 0) +
    (collected + outstanding > 0 && collectionRate < 50 ? 10 : 0) +
    (weightedPipeline === 0 ? 8 : 0)

  const financialHealth = Math.round(clamp(50 + positive - negative, 0, 100))

  // ---------------------------------------------------------------------------
  // Risk engine.
  // ---------------------------------------------------------------------------
  const risks: CfoRisk[] = []

  if (outstanding > collected || snapshot.invoices.overdue > 0) {
    risks.push({
      type: "cashflow_risk",
      title:
        snapshot.invoices.overdue > 0
          ? `${formatAud(overdueExposure)} overdue exposure`
          : "Receivables exceed collected cash",
      severity: overdueExposure > collected ? "high" : "medium",
      impact: `${formatAud(outstanding)} outstanding against ${formatAud(collected)} collected constrains operating cashflow.`,
      mitigation:
        "Shorten payment terms, invoice milestones, and require deposits on new engagements.",
    })
  }

  if (collected + outstanding > 0 && collectionRate < 50) {
    risks.push({
      type: "collections_risk",
      title: `Collection rate at ${collectionRate}%`,
      severity: collectionRate < 30 ? "critical" : "high",
      impact: `Less than half of invoiced revenue converts to cash — ${formatAud(outstanding)} sits unrealized.`,
      mitigation:
        "Run a structured collections sweep with reminder cadence and escalation after 14 days.",
    })
  }

  if (concentrationRisk !== "low") {
    risks.push({
      type: "concentration_risk",
      title: `Largest client represents ${largestClientPercent}% of revenue`,
      severity: concentrationRisk === "high" ? "high" : "medium",
      impact:
        "A single client departure would remove a major share of revenue in one event.",
      mitigation:
        "Diversify: convert pipeline leads into new accounts and grow secondary clients.",
    })
  }

  if (weightedPipeline < outstanding || weightedPipeline === 0) {
    risks.push({
      type: "forecast_risk",
      title: "Forecast depends on collections, not pipeline",
      severity: weightedPipeline === 0 ? "high" : "medium",
      impact: `Weighted pipeline (${formatAud(weightedPipeline)}) is below receivables (${formatAud(outstanding)}) — 90-day growth is not underwritten by new business.`,
      mitigation:
        "Send proposals to qualified leads and follow up sent proposals to rebuild forecast coverage.",
    })
  }

  // ---------------------------------------------------------------------------
  // Opportunity engine.
  // ---------------------------------------------------------------------------
  const opportunities: CfoOpportunity[] = []

  if (outstanding > 0) {
    opportunities.push({
      type: "accelerate_collections",
      title: "Accelerate collections",
      value: round2(outstanding),
      action:
        "Chase every unpaid invoice this week — fastest cash available with zero delivery cost.",
    })
  }

  if (clientIntel.clients.length > 0 && totalClientValue > 0) {
    opportunities.push({
      type: "expand_existing_clients",
      title: `Expand ${snapshot.clients.active} active client account${snapshot.clients.active === 1 ? "" : "s"}`,
      value: round2(snapshot.projects.totalValueAud * 0.25),
      action:
        "Offer phase-two scope on completed work — existing clients close faster than new acquisition.",
    })
  }

  if (weightedPipeline > 0) {
    opportunities.push({
      type: "convert_pipeline",
      title: "Convert weighted pipeline",
      value: weightedPipeline,
      action:
        "Follow up sent proposals with specific start dates; move drafts to sent within the week.",
    })
  }

  if (snapshot.clients.active > 0) {
    opportunities.push({
      type: "increase_retainers",
      title: "Introduce monthly retainers",
      value: round2(
        clientValue.averageClientValue > 0
          ? clientValue.averageClientValue * snapshot.clients.active * 0.5
          : snapshot.clients.active * 1000
      ),
      action:
        "Convert project clients to maintenance retainers for recurring, predictable cashflow.",
    })
  }

  opportunities.sort((a, b) => b.value - a.value)

  // ---------------------------------------------------------------------------
  // Top 5 CFO recommendations — deterministic priority order.
  // ---------------------------------------------------------------------------
  const recommendations: string[] = []

  if (outstanding > 0) {
    recommendations.push(
      `Collect ${formatAud(outstanding)} in outstanding invoices before pursuing new acquisition.`
    )
  }

  if (collected + outstanding > 0 && collectionRate < 50) {
    recommendations.push(
      "Move to milestone invoicing with deposits — collection rate below 50% means terms, not demand, are the constraint."
    )
  }

  if (weightedPipeline > 0) {
    recommendations.push(
      `Convert the ${formatAud(weightedPipeline)} weighted pipeline — every sent proposal needs a follow-up with a start date.`
    )
  }

  if (concentrationRisk !== "low") {
    recommendations.push(
      `Reduce revenue concentration (largest client at ${largestClientPercent}%) by opening two new accounts from the lead pipeline.`
    )
  }

  if (snapshot.clients.active > 0) {
    recommendations.push(
      "Introduce monthly retainers on active accounts to convert project revenue into recurring revenue."
    )
  }

  if (recommendations.length < 5 && snapshot.leads.qualified > 0) {
    recommendations.push(
      `Send audit-based proposals to ${snapshot.leads.qualified} qualified lead${snapshot.leads.qualified === 1 ? "" : "s"} to extend the 90-day forecast.`
    )
  }

  if (recommendations.length < 5) {
    recommendations.push(
      "Maintain weekly revenue reviews — collection rate and pipeline coverage are the two numbers to watch."
    )
  }

  const cfo: CfoIntelligence = {
    financialHealth,
    cashflowHealth: {
      score: cashflowScore,
      status: cashflowStatus,
    },
    revenueForecast,
    collectionsForecast,
    clientValue,
    revenueConcentration: {
      largestClientPercent,
      concentrationRisk,
    },
    risks,
    opportunities,
    recommendations: recommendations.slice(0, 5),
    generatedAt: now.toISOString(),
  }

  // Fire-and-forget: persistence never blocks or fails the response.
  void storeCfoSnapshot(cfo)

  return cfo
}
