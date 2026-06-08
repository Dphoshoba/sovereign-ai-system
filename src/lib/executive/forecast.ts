import {
  computeOverallHealthScore,
  type ExecutivePlatformSnapshot,
} from "@/lib/executive/platform-snapshot"
import type { ExecutiveMonthlyReview } from "@/lib/executive/monthly-review"
import {
  parseBriefingJson,
  type ArchivedBriefingRecord,
} from "@/lib/executive/review-shared"

export type ForecastConfidence = "Low" | "Medium" | "High"

export type ExecutiveForecast = {
  forecastDate: string
  forecastPeriodDays: number
  forecastHealthScore: number
  confidence: ForecastConfidence
  growthForecast: string
  revenueForecast: string
  deliveryForecast: string
  riskForecast: string[]
  opportunityForecast: string[]
  executiveOutlook: string
  recommendedFocusAreas: string[]
}

export type ExecutiveForecastInputs = {
  snapshot: ExecutivePlatformSnapshot
  briefings: ArchivedBriefingRecord[]
  monthlyReview: ExecutiveMonthlyReview
}

const FORECAST_PERIOD_DAYS = 30

function formatAud(value: number) {
  return `AUD ${value.toLocaleString("en-AU")}`
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function computeConfidence(briefingCount: number): ForecastConfidence {
  if (briefingCount < 7) {
    return "Low"
  }

  if (briefingCount <= 20) {
    return "Medium"
  }

  return "High"
}

function trendAdjustment(
  healthTrend: ExecutiveMonthlyReview["healthTrend"]
): number {
  if (healthTrend === "Improving") {
    return 5
  }

  if (healthTrend === "Declining") {
    return -5
  }

  return 0
}

function buildGrowthForecast(
  snapshot: ExecutivePlatformSnapshot,
  monthlyReview: ExecutiveMonthlyReview,
  briefings: ArchivedBriefingRecord[]
): string {
  const parts: string[] = []

  if (snapshot.monthlySubscribers > 0) {
    parts.push(
      `${snapshot.monthlySubscribers} new subscriber${snapshot.monthlySubscribers === 1 ? "" : "s"} this month (${snapshot.growthRate}% growth rate)`
    )
  } else {
    parts.push("No new subscribers recorded this month")
  }

  if (snapshot.totalLeads > 0) {
    parts.push(
      `${snapshot.totalLeads} creator lead${snapshot.totalLeads === 1 ? "" : "s"} tracked (${snapshot.hotLeads.length} hot, ${snapshot.wonLeads} won)`
    )
  } else {
    parts.push("Creator lead pipeline has no tracked leads")
  }

  if (snapshot.leadMagnetCount > 0) {
    parts.push(
      `${snapshot.leadMagnetCount} lead magnet${snapshot.leadMagnetCount === 1 ? "" : "s"} with ${snapshot.leadMagnetSubscribers} attributed subscriber conversions`
    )
  } else {
    parts.push("No lead magnets are currently configured")
  }

  if (briefings.length >= 2) {
    const sorted = [...briefings].sort(
      (a, b) => a.briefingDate.getTime() - b.briefingDate.getTime()
    )
    const oldest = parseBriefingJson(sorted[0].briefingJson)
    const newest = parseBriefingJson(sorted[sorted.length - 1].briefingJson)

    if (
      oldest &&
      newest &&
      newest.growthSnapshot.totalSubscribers !==
        oldest.growthSnapshot.totalSubscribers
    ) {
      const delta =
        newest.growthSnapshot.totalSubscribers -
        oldest.growthSnapshot.totalSubscribers
      parts.push(
        `Archived briefings show subscribers moved from ${oldest.growthSnapshot.totalSubscribers} to ${newest.growthSnapshot.totalSubscribers} (${delta >= 0 ? "+" : ""}${delta})`
      )
    }
  }

  if (
    monthlyReview.briefingCount >= 2 &&
    !monthlyReview.growthMovement.includes("No archived") &&
    !monthlyReview.growthMovement.includes("Limited archived")
  ) {
    parts.push(monthlyReview.growthMovement)
  }

  return `${parts.join(". ")}.`
}

function buildRevenueForecast(
  snapshot: ExecutivePlatformSnapshot,
  monthlyReview: ExecutiveMonthlyReview
): string {
  const parts: string[] = []

  if (snapshot.openPipeline > 0) {
    parts.push(
      `${formatAud(snapshot.openPipeline)} in open sales pipeline across active lead stages`
    )
  } else {
    parts.push("Open sales pipeline is currently empty")
  }

  if (snapshot.wonRevenue > 0) {
    parts.push(`${formatAud(snapshot.wonRevenue)} in won creator revenue to date`)
  }

  if (snapshot.outstandingRevenue > 0) {
    parts.push(
      `${formatAud(snapshot.outstandingRevenue)} outstanding across sent and overdue invoices`
    )
  } else {
    parts.push("No outstanding invoice revenue currently tracked")
  }

  if (snapshot.totalPaid > 0) {
    parts.push(`${formatAud(snapshot.totalPaid)} collected in paid client invoices`)
  }

  if (
    monthlyReview.briefingCount >= 2 &&
    !monthlyReview.revenueMovement.includes("No archived") &&
    !monthlyReview.revenueMovement.includes("Limited archived")
  ) {
    parts.push(monthlyReview.revenueMovement)
  }

  return `${parts.join(". ")}.`
}

function buildDeliveryForecast(
  snapshot: ExecutivePlatformSnapshot,
  monthlyReview: ExecutiveMonthlyReview
): string {
  const parts: string[] = []
  const totalTasks = snapshot.openTasks + snapshot.doneTasks
  const completionRate =
    totalTasks > 0
      ? Math.round((snapshot.doneTasks / totalTasks) * 100)
      : 0

  parts.push(
    `${snapshot.activeProjects} active project${snapshot.activeProjects === 1 ? "" : "s"} and ${snapshot.completedProjects} completed`
  )

  if (totalTasks > 0) {
    parts.push(
      `Task completion rate is ${completionRate}% (${snapshot.doneTasks} done, ${snapshot.openTasks} open)`
    )
  }

  if (snapshot.overdueTasks > 0) {
    parts.push(
      `${snapshot.overdueTasks} overdue delivery task${snapshot.overdueTasks === 1 ? "" : "s"} require attention`
    )
  }

  if (snapshot.atRiskProjects.length > 0) {
    parts.push(
      `${snapshot.atRiskProjects.length} project${snapshot.atRiskProjects.length === 1 ? "" : "s"} flagged as at-risk due to low progress near deadline`
    )
  }

  parts.push(`Delivery health score is ${snapshot.deliveryHealthScore}/100`)

  if (
    monthlyReview.briefingCount >= 2 &&
    !monthlyReview.deliveryMovement.includes("No archived") &&
    !monthlyReview.deliveryMovement.includes("Limited archived")
  ) {
    parts.push(monthlyReview.deliveryMovement)
  }

  return `${parts.join(". ")}.`
}

function buildRiskForecast(
  snapshot: ExecutivePlatformSnapshot,
  monthlyReview: ExecutiveMonthlyReview
): string[] {
  const risks: string[] = []

  if (snapshot.openPipeline > 0 && snapshot.proposalReadyLeads.length <= 1) {
    risks.push(
      `Revenue concentration risk: ${formatAud(snapshot.openPipeline)} open pipeline with only ${snapshot.proposalReadyLeads.length} proposal-ready lead${snapshot.proposalReadyLeads.length === 1 ? "" : "s"}`
    )
  }

  if (snapshot.openPipeline === 0) {
    risks.push(
      "Revenue concentration risk: no open pipeline value — new business development needed"
    )
  }

  if (snapshot.outstandingRevenue > 0 && snapshot.overdueInvoices > 0) {
    risks.push(
      `Revenue concentration risk: ${formatAud(snapshot.outstandingRevenue)} outstanding with ${snapshot.overdueInvoices} overdue invoice${snapshot.overdueInvoices === 1 ? "" : "s"}`
    )
  }

  if (snapshot.growthRate === 0 || snapshot.monthlySubscribers === 0) {
    risks.push(
      "Growth stagnation risk: no measurable subscriber growth recorded this month"
    )
  }

  if (snapshot.totalSubscribers < 50) {
    risks.push(
      `Growth stagnation risk: subscriber base remains small (${snapshot.totalSubscribers} total)`
    )
  }

  if (snapshot.overdueTasks > 0 || snapshot.atRiskProjects.length > 0) {
    risks.push(
      `Delivery capacity risk: ${snapshot.overdueTasks} overdue task${snapshot.overdueTasks === 1 ? "" : "s"} and ${snapshot.atRiskProjects.length} at-risk project${snapshot.atRiskProjects.length === 1 ? "" : "s"}`
    )
  }

  if (snapshot.activeProjects > 0 && snapshot.overdueTasks >= 3) {
    risks.push(
      `Delivery capacity risk: ${snapshot.overdueTasks} overdue tasks across ${snapshot.activeProjects} active projects`
    )
  }

  if (snapshot.reviewRequiredCount > 0) {
    risks.push(
      `Content backlog risk: ${snapshot.reviewRequiredCount} article${snapshot.reviewRequiredCount === 1 ? "" : "s"} awaiting review`
    )
  }

  if (snapshot.draftCount > 0 && snapshot.scheduledCount === 0) {
    risks.push(
      `Content backlog risk: ${snapshot.draftCount} draft${snapshot.draftCount === 1 ? "" : "s"} with no scheduled publishing`
    )
  }

  for (const issue of monthlyReview.recurringIssues.slice(0, 3)) {
    risks.push(issue)
  }

  return uniqueStrings(risks)
}

function buildOpportunityForecast(
  snapshot: ExecutivePlatformSnapshot
): string[] {
  const opportunities: string[] = []

  if (snapshot.leadMagnetCount < 3) {
    opportunities.push(
      `Additional lead magnets: ${snapshot.leadMagnetCount} active asset${snapshot.leadMagnetCount === 1 ? "" : "s"} — expand acquisition surface area`
    )
  }

  if (snapshot.activeClients > 0 && snapshot.completedProjects > 0) {
    opportunities.push(
      `Upsell existing clients: ${snapshot.activeClients} active client${snapshot.activeClients === 1 ? "" : "s"} with ${snapshot.completedProjects} completed project${snapshot.completedProjects === 1 ? "" : "s"}`
    )
  }

  if (
    snapshot.totalSubscribers > 0 &&
    snapshot.blogCtaSubscribers < Math.max(1, snapshot.totalSubscribers * 0.2)
  ) {
    opportunities.push(
      `Improve CTA coverage: ${snapshot.blogCtaSubscribers} of ${snapshot.totalSubscribers} subscribers came from blog CTAs`
    )
  }

  if (snapshot.publishedArticles > 0 && snapshot.scheduledCount === 0) {
    opportunities.push(
      "Increase newsletter cadence: published content exists but nothing is scheduled ahead"
    )
  }

  if (snapshot.proposalReadyLeads.length > 0) {
    opportunities.push(
      `${snapshot.proposalReadyLeads.length} proposal-ready lead${snapshot.proposalReadyLeads.length === 1 ? "" : "s"} ready to advance`
    )
  }

  if (snapshot.readyToCompleteProjects.length > 0) {
    opportunities.push(
      `${snapshot.readyToCompleteProjects.length} project${snapshot.readyToCompleteProjects.length === 1 ? "" : "s"} at 100% progress and ready to complete`
    )
  }

  if (snapshot.recentlyPaidInvoiceCount > 0) {
    opportunities.push(
      `${snapshot.recentlyPaidInvoiceCount} invoice${snapshot.recentlyPaidInvoiceCount === 1 ? "" : "s"} paid in the last 30 days — follow-up upsell window`
    )
  }

  return uniqueStrings(opportunities)
}

function buildRecommendedFocusAreas(
  snapshot: ExecutivePlatformSnapshot,
  monthlyReview: ExecutiveMonthlyReview,
  risks: string[],
  opportunities: string[]
): string[] {
  const pool: string[] = [...monthlyReview.nextMonthPriorities]

  if (snapshot.overdueTasks > 0) {
    pool.push(
      `Clear ${snapshot.overdueTasks} overdue delivery task${snapshot.overdueTasks === 1 ? "" : "s"}`
    )
  }

  if (snapshot.outstandingRevenue > 0) {
    pool.push(
      `Collect ${formatAud(snapshot.outstandingRevenue)} in outstanding revenue`
    )
  }

  if (snapshot.openPipeline > 0) {
    pool.push(`Advance ${formatAud(snapshot.openPipeline)} open pipeline`)
  }

  if (snapshot.reviewRequiredCount > 0) {
    pool.push(
      `Reduce content review backlog (${snapshot.reviewRequiredCount} articles)`
    )
  }

  if (snapshot.growthRate === 0) {
    pool.push(
      "Restart subscriber growth with lead magnets and consistent publishing"
    )
  }

  pool.push(...risks.slice(0, 2))
  pool.push(...opportunities.slice(0, 2))

  const focusAreas = uniqueStrings(pool)

  if (focusAreas.length >= 3) {
    return focusAreas.slice(0, 5)
  }

  if (monthlyReview.briefingCount === 0) {
    return uniqueStrings([
      ...focusAreas,
      "Archive daily briefings to improve forecast confidence",
      "Review executive overview metrics weekly",
    ]).slice(0, 5)
  }

  return focusAreas.slice(0, 5)
}

function buildExecutiveOutlook(
  forecastHealthScore: number,
  confidence: ForecastConfidence,
  monthlyReview: ExecutiveMonthlyReview,
  risks: string[],
  opportunities: string[]
): string {
  const trendPhrase =
    monthlyReview.healthTrend === "Improving"
      ? "Archived briefing trends suggest improving conditions"
      : monthlyReview.healthTrend === "Declining"
        ? "Archived briefing trends suggest declining conditions"
        : "Archived briefing trends appear stable"

  const riskPhrase =
    risks.length > 0
      ? `Primary watch areas include ${risks[0].toLowerCase()}`
      : "No major rule-based risks are currently flagged"

  const opportunityPhrase =
    opportunities.length > 0
      ? `Near-term upside may come from ${opportunities[0].toLowerCase()}`
      : "Limited opportunity signals from current platform data"

  const briefingPhrase =
    monthlyReview.briefingCount > 0
      ? `based on ${monthlyReview.briefingCount} archived briefing${monthlyReview.briefingCount === 1 ? "" : "s"}`
      : "with limited archived briefing history"

  return `Over the next ${FORECAST_PERIOD_DAYS} days, Echoes & Visions is forecast at a ${forecastHealthScore}/100 health score (${confidence.toLowerCase()} confidence, ${briefingPhrase}). ${trendPhrase}. ${riskPhrase}. ${opportunityPhrase}.`
}

export function buildExecutiveForecast(
  inputs: ExecutiveForecastInputs
): ExecutiveForecast {
  const { snapshot, briefings, monthlyReview } = inputs
  const currentHealth = computeOverallHealthScore(snapshot)
  const adjustment = trendAdjustment(monthlyReview.healthTrend)
  const forecastHealthScore = Math.min(
    100,
    Math.max(0, currentHealth + adjustment)
  )
  const confidence = computeConfidence(briefings.length)

  const riskForecast = buildRiskForecast(snapshot, monthlyReview)
  const opportunityForecast = buildOpportunityForecast(snapshot)
  const recommendedFocusAreas = buildRecommendedFocusAreas(
    snapshot,
    monthlyReview,
    riskForecast,
    opportunityForecast
  )

  return {
    forecastDate: new Date().toLocaleDateString("en-AU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    forecastPeriodDays: FORECAST_PERIOD_DAYS,
    forecastHealthScore,
    confidence,
    growthForecast: buildGrowthForecast(snapshot, monthlyReview, briefings),
    revenueForecast: buildRevenueForecast(snapshot, monthlyReview),
    deliveryForecast: buildDeliveryForecast(snapshot, monthlyReview),
    riskForecast,
    opportunityForecast,
    executiveOutlook: buildExecutiveOutlook(
      forecastHealthScore,
      confidence,
      monthlyReview,
      riskForecast,
      opportunityForecast
    ),
    recommendedFocusAreas,
  }
}
