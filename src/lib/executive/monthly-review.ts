import {
  buildExecutiveArchiveReview,
  formatReviewDate,
  type ArchivedBriefingRecord,
  type HealthTrend,
} from "@/lib/executive/review-shared"

export type { ArchivedBriefingRecord } from "@/lib/executive/review-shared"

export type ExecutiveMonthlyReview = {
  startDate: string
  endDate: string
  briefingCount: number
  averageHealthScore: number
  bestHealthScore: number
  worstHealthScore: number
  healthTrend: HealthTrend
  healthScoreChange: number
  monthlySummary: string
  wins: string[]
  risks: string[]
  recurringIssues: string[]
  revenueMovement: string
  growthMovement: string
  deliveryMovement: string
  nextMonthPriorities: string[]
}

export function getMonthlyReviewDateCutoff(date = new Date()) {
  const cutoff = new Date(date)
  cutoff.setDate(cutoff.getDate() - 30)
  cutoff.setHours(0, 0, 0, 0)
  return cutoff
}

function buildMonthlySummary(params: {
  sorted: ArchivedBriefingRecord[]
  averageHealthScore: number
  healthTrend: HealthTrend
  healthScoreChange: number
}): string {
  const { sorted, averageHealthScore, healthTrend, healthScoreChange } = params

  if (sorted.length === 1) {
    const only = sorted[0]
    return `Limited data — only one archived briefing is available in the last 30 days (${formatReviewDate(only.briefingDate)}). Health score is ${only.healthScore}/100. ${only.openingSummary} Archive more daily briefings to unlock full monthly trend analysis.`
  }

  const startDate = formatReviewDate(sorted[0].briefingDate)
  const endDate = formatReviewDate(sorted[sorted.length - 1].briefingDate)
  const totalUrgent = sorted.reduce((sum, item) => {
    const json = item.briefingJson as { urgentCount?: number } | null
    return sum + (json?.urgentCount ?? 0)
  }, 0)

  const trendPhrase =
    healthTrend === "Improving"
      ? "Health improved over the month"
      : healthTrend === "Declining"
        ? "Health declined over the month"
        : "Health remained relatively stable"

  return `Monthly executive review covering ${sorted.length} archived briefings from ${startDate} to ${endDate}. Average health score was ${averageHealthScore}/100. ${trendPhrase} (${healthScoreChange > 0 ? "+" : ""}${healthScoreChange} points). ${totalUrgent} total urgent item${totalUrgent === 1 ? "" : "s"} flagged across the period.`
}

export function buildExecutiveMonthlyReview(
  records: ArchivedBriefingRecord[]
): ExecutiveMonthlyReview {
  const core = buildExecutiveArchiveReview(records, {
    periodLabel: "Monthly",
    emptySummary:
      "No archived daily briefings in the last 30 days. Archive briefings throughout the month to generate a monthly executive review.",
    emptyRevenueMovement: "No archived briefing data available.",
    emptyGrowthMovement: "No archived briefing data available.",
    emptyDeliveryMovement: "No archived briefing data available.",
    emptyPriorities: [
      "Archive daily briefings consistently to enable monthly trend analysis",
    ],
    buildSummary: buildMonthlySummary,
    maxPriorities: 12,
  })

  return {
    startDate: core.startDate,
    endDate: core.endDate,
    briefingCount: core.briefingCount,
    averageHealthScore: core.averageHealthScore,
    bestHealthScore: core.bestHealthScore,
    worstHealthScore: core.worstHealthScore,
    healthTrend: core.healthTrend,
    healthScoreChange: core.healthScoreChange,
    monthlySummary: core.summary,
    wins: core.wins,
    risks: core.risks,
    recurringIssues: core.recurringIssues,
    revenueMovement: core.revenueMovement,
    growthMovement: core.growthMovement,
    deliveryMovement: core.deliveryMovement,
    nextMonthPriorities: core.priorities,
  }
}
