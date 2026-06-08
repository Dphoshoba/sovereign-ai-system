import type { ExecutiveForecast } from "@/lib/executive/forecast"
import type { ExecutiveMonthlyReview } from "@/lib/executive/monthly-review"
import {
  computeOverallHealthScore,
  type ExecutivePlatformSnapshot,
} from "@/lib/executive/platform-snapshot"
import type {
  ExecutiveRecommendation,
  ExecutiveRecommendations,
} from "@/lib/executive/recommendations"
import type { ExecutiveWeeklyReview } from "@/lib/executive/weekly-review"

export type StrategicInitiative = {
  title: string
  reason: string
  actions: string[]
}

export type SuccessMetric = {
  label: string
  currentValue: string
  targetValue: string
}

export type StrategicPlan = {
  generatedAt: string
  planningPeriod: string
  strategicHealth: number
  executiveSummary: string
  objectives: string[]
  priorities: string[]
  initiatives: StrategicInitiative[]
  risks: string[]
  opportunities: string[]
  stopDoing: string[]
  successMetrics: SuccessMetric[]
}

export type StrategicPlanInputs = {
  snapshot: ExecutivePlatformSnapshot
  forecast: ExecutiveForecast
  monthlyReview: ExecutiveMonthlyReview
  weeklyReview: ExecutiveWeeklyReview
  recommendations: ExecutiveRecommendations
  proposalSentLeads: number
}

const PLANNING_PERIOD = "Next 30 days"

function formatAud(value: number) {
  return `AUD ${value.toLocaleString("en-AU")}`
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function collectRecommendations(
  recommendations: ExecutiveRecommendations
): ExecutiveRecommendation[] {
  return [
    ...recommendations.urgent,
    ...recommendations.today,
    ...recommendations.thisWeek,
    ...recommendations.revenue,
    ...recommendations.delivery,
    ...recommendations.growth,
    ...recommendations.content,
  ]
}

function buildObjectives(
  snapshot: ExecutivePlatformSnapshot,
  forecast: ExecutiveForecast
): string[] {
  const objectives: string[] = []

  if (snapshot.growthRate === 0 || snapshot.monthlySubscribers === 0) {
    objectives.push(
      "Rebuild subscriber growth through lead magnets, publishing, and newsletter promotion"
    )
  }

  if (snapshot.openPipeline > 0) {
    objectives.push(
      `Advance ${formatAud(snapshot.openPipeline)} in open sales pipeline toward won revenue`
    )
  }

  if (snapshot.overdueTasks > 0 || snapshot.atRiskProjects.length > 0) {
    objectives.push(
      "Restore delivery reliability by clearing overdue tasks and at-risk projects"
    )
  }

  if (snapshot.reviewRequiredCount > 0 || snapshot.draftCount > snapshot.scheduledCount) {
    objectives.push(
      "Reduce content backlog and restore a predictable publishing cadence"
    )
  }

  if (snapshot.outstandingRevenue > 0) {
    objectives.push(
      `Improve cash collection on ${formatAud(snapshot.outstandingRevenue)} in outstanding invoices`
    )
  }

  if (forecast.confidence === "Low") {
    objectives.push(
      "Increase archived briefing coverage to improve executive forecasting confidence"
    )
  }

  if (objectives.length === 0) {
    objectives.push(
      "Maintain operational stability while scaling growth, revenue, and delivery capacity"
    )
  }

  return objectives.slice(0, 5)
}

function buildPriorities(
  forecast: ExecutiveForecast,
  recommendations: ExecutiveRecommendations
): string[] {
  const pool: string[] = [...forecast.recommendedFocusAreas]

  for (const recommendation of collectRecommendations(recommendations)) {
    if (recommendation.priority === "urgent" || recommendation.priority === "high") {
      pool.push(recommendation.suggestedAction)
    }
  }

  pool.push(...recommendations.urgent.map((item) => item.title))
  pool.push(...recommendations.today.slice(0, 3).map((item) => item.suggestedAction))

  return uniqueStrings(pool).slice(0, 7)
}

function buildInitiatives(
  snapshot: ExecutivePlatformSnapshot,
  recommendations: ExecutiveRecommendations,
  forecast: ExecutiveForecast
): StrategicInitiative[] {
  const initiatives: StrategicInitiative[] = []

  if (
    snapshot.growthRate === 0 ||
    snapshot.leadMagnetCount <= 1 ||
    forecast.opportunityForecast.some((item) =>
      item.toLowerCase().includes("lead magnet")
    )
  ) {
    const growthActions = recommendations.growth
      .slice(0, 3)
      .map((item) => item.suggestedAction)

    if (growthActions.length === 0 && snapshot.leadMagnetCount <= 1) {
      growthActions.push("Create or expand lead magnet offers")
    }

    initiatives.push({
      title: "Growth acceleration",
      reason:
        snapshot.monthlySubscribers > 0
          ? `${snapshot.monthlySubscribers} new subscriber${snapshot.monthlySubscribers === 1 ? "" : "s"} this month with ${snapshot.growthRate}% growth rate`
          : "No measurable subscriber growth recorded this month",
      actions: uniqueStrings(growthActions).slice(0, 4),
    })
  }

  if (snapshot.openPipeline > 0 || snapshot.outstandingRevenue > 0) {
    const revenueActions = recommendations.revenue
      .slice(0, 3)
      .map((item) => item.suggestedAction)

    if (snapshot.proposalReadyLeads.length > 0) {
      revenueActions.unshift(
        `Send proposals for ${snapshot.proposalReadyLeads.length} proposal-ready lead${snapshot.proposalReadyLeads.length === 1 ? "" : "s"}`
      )
    }

    if (snapshot.overdueInvoices > 0) {
      revenueActions.unshift(
        `Follow up on ${snapshot.overdueInvoices} overdue invoice${snapshot.overdueInvoices === 1 ? "" : "s"}`
      )
    }

    initiatives.push({
      title: "Revenue execution",
      reason:
        snapshot.openPipeline > 0
          ? `${formatAud(snapshot.openPipeline)} open pipeline and ${formatAud(snapshot.outstandingRevenue)} outstanding revenue`
          : `${formatAud(snapshot.outstandingRevenue)} outstanding revenue requires collection focus`,
      actions: uniqueStrings(revenueActions).slice(0, 4),
    })
  }

  if (
    snapshot.overdueTasks > 0 ||
    snapshot.atRiskProjects.length > 0 ||
    snapshot.openTasks > 0
  ) {
    const deliveryActions = recommendations.delivery
      .slice(0, 3)
      .map((item) => item.suggestedAction)

    if (snapshot.overdueTasks > 0) {
      deliveryActions.unshift(
        `Clear ${snapshot.overdueTasks} overdue delivery task${snapshot.overdueTasks === 1 ? "" : "s"}`
      )
    }

    initiatives.push({
      title: "Delivery stabilization",
      reason: `${snapshot.activeProjects} active project${snapshot.activeProjects === 1 ? "" : "s"}, ${snapshot.overdueTasks} overdue task${snapshot.overdueTasks === 1 ? "" : "s"}, delivery health ${snapshot.deliveryHealthScore}/100`,
      actions: uniqueStrings(deliveryActions).slice(0, 4),
    })
  }

  if (snapshot.reviewRequiredCount > 0 || snapshot.scheduledCount === 0) {
    const contentActions = recommendations.content
      .slice(0, 3)
      .map((item) => item.suggestedAction)

    if (snapshot.reviewRequiredCount > 0) {
      contentActions.unshift(
        `Review ${snapshot.reviewRequiredCount} article${snapshot.reviewRequiredCount === 1 ? "" : "s"} in the editorial backlog`
      )
    }

    initiatives.push({
      title: "Content operations",
      reason:
        snapshot.reviewRequiredCount > 0 && snapshot.scheduledCount === 0
          ? `${snapshot.reviewRequiredCount} review-required article${snapshot.reviewRequiredCount === 1 ? "" : "s"} and nothing scheduled to publish`
          : snapshot.reviewRequiredCount > 0
            ? `${snapshot.reviewRequiredCount} article${snapshot.reviewRequiredCount === 1 ? "" : "s"} awaiting editorial review`
            : "Nothing scheduled to publish",
      actions: uniqueStrings(contentActions).slice(0, 4),
    })
  }

  if (initiatives.length === 0) {
    initiatives.push({
      title: "Operational continuity",
      reason: forecast.executiveOutlook,
      actions: forecast.recommendedFocusAreas.slice(0, 4),
    })
  }

  return initiatives.slice(0, 5)
}

function buildStopDoing(
  snapshot: ExecutivePlatformSnapshot,
  proposalSentLeads: number
): string[] {
  const items: string[] = []

  if (snapshot.reviewRequiredCount >= 3) {
    items.push(
      `Adding new content before clearing ${snapshot.reviewRequiredCount} review-required articles`
    )
  }

  if (proposalSentLeads > 0) {
    items.push(
      `Leaving ${proposalSentLeads} proposal${proposalSentLeads === 1 ? "" : "s"} in proposal-sent without follow-up`
    )
  }

  if (snapshot.overdueInvoices > 0) {
    items.push(
      `Deferring collection on ${snapshot.overdueInvoices} overdue invoice${snapshot.overdueInvoices === 1 ? "" : "s"}`
    )
  }

  if (snapshot.draftCount > 0 && snapshot.scheduledCount === 0) {
    items.push(
      `Accumulating ${snapshot.draftCount} draft${snapshot.draftCount === 1 ? "" : "s"} without scheduling anything to publish`
    )
  }

  if (snapshot.readyToCompleteProjects.length > 0) {
    items.push(
      `Leaving ${snapshot.readyToCompleteProjects.length} project${snapshot.readyToCompleteProjects.length === 1 ? "" : "s"} at 100% progress unmarked as complete`
    )
  }

  if (snapshot.atRiskProjects.length > 0 && snapshot.activeProjects > snapshot.atRiskProjects.length) {
    items.push(
      `Starting additional client work while ${snapshot.atRiskProjects.length} project${snapshot.atRiskProjects.length === 1 ? "" : "s"} remain at-risk`
    )
  }

  return uniqueStrings(items)
}

function buildSuccessMetrics(
  snapshot: ExecutivePlatformSnapshot,
  forecast: ExecutiveForecast
): SuccessMetric[] {
  const metrics: SuccessMetric[] = []

  const currentHealth = computeOverallHealthScore(snapshot)
  const healthTarget = Math.min(100, forecast.forecastHealthScore + 5)

  metrics.push({
    label: "Health score",
    currentValue: `${currentHealth}`,
    targetValue: `${healthTarget}`,
  })

  metrics.push({
    label: "Subscriber base",
    currentValue: `${snapshot.totalSubscribers}`,
    targetValue:
      snapshot.monthlySubscribers > 0
        ? `${snapshot.totalSubscribers + snapshot.monthlySubscribers}`
        : `${snapshot.totalSubscribers + 1}`,
  })

  if (snapshot.openPipeline > 0) {
    const proposalReadyValue = snapshot.proposalReadyLeads.reduce(
      (sum, lead) => sum + (lead.projectedValue || 0),
      0
    )

    metrics.push({
      label: "Won revenue",
      currentValue: formatAud(snapshot.wonRevenue),
      targetValue:
        proposalReadyValue > 0
          ? formatAud(snapshot.wonRevenue + proposalReadyValue)
          : formatAud(snapshot.wonRevenue),
    })
  }

  if (snapshot.overdueTasks > 0) {
    metrics.push({
      label: "Overdue delivery tasks",
      currentValue: `${snapshot.overdueTasks}`,
      targetValue: "0",
    })
  }

  if (snapshot.outstandingRevenue > 0) {
    metrics.push({
      label: "Outstanding revenue",
      currentValue: formatAud(snapshot.outstandingRevenue),
      targetValue: formatAud(0),
    })
  }

  return metrics.slice(0, 6)
}

function buildExecutiveSummary(
  snapshot: ExecutivePlatformSnapshot,
  forecast: ExecutiveForecast,
  monthlyReview: ExecutiveMonthlyReview,
  weeklyReview: ExecutiveWeeklyReview
): string {
  const weeklyNote =
    weeklyReview.briefingCount > 0
      ? `Weekly review shows ${weeklyReview.healthTrend.toLowerCase()} health (${weeklyReview.averageHealthScore}/100 average).`
      : "Weekly review data is limited."

  const monthlyNote =
    monthlyReview.briefingCount > 0
      ? `Monthly review covers ${monthlyReview.briefingCount} archived briefing${monthlyReview.briefingCount === 1 ? "" : "s"} with ${monthlyReview.recurringIssues.length} recurring issue${monthlyReview.recurringIssues.length === 1 ? "" : "s"} detected.`
      : "Monthly review has limited archived briefing coverage."

  return `${forecast.executiveOutlook} ${weeklyNote} ${monthlyNote} Strategic health is projected at ${forecast.forecastHealthScore}/100 over ${PLANNING_PERIOD.toLowerCase()} with ${forecast.confidence.toLowerCase()} confidence. Current platform health is ${computeOverallHealthScore(snapshot)}/100 across ${snapshot.activeClients} active client${snapshot.activeClients === 1 ? "" : "s"} and ${snapshot.totalSubscribers} subscriber${snapshot.totalSubscribers === 1 ? "" : "s"}.`
}

export function buildStrategicPlan(inputs: StrategicPlanInputs): StrategicPlan {
  const {
    snapshot,
    forecast,
    monthlyReview,
    weeklyReview,
    recommendations,
    proposalSentLeads,
  } = inputs

  return {
    generatedAt: new Date().toLocaleDateString("en-AU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    planningPeriod: PLANNING_PERIOD,
    strategicHealth: forecast.forecastHealthScore,
    executiveSummary: buildExecutiveSummary(
      snapshot,
      forecast,
      monthlyReview,
      weeklyReview
    ),
    objectives: buildObjectives(snapshot, forecast),
    priorities: buildPriorities(forecast, recommendations),
    initiatives: buildInitiatives(snapshot, recommendations, forecast),
    risks: [...forecast.riskForecast],
    opportunities: [...forecast.opportunityForecast],
    stopDoing: buildStopDoing(snapshot, proposalSentLeads),
    successMetrics: buildSuccessMetrics(snapshot, forecast),
  }
}
