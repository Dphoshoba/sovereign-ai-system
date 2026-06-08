import type { DailyBriefing } from "@/lib/executive/daily-briefing"

export type HealthTrend = "Improving" | "Stable" | "Declining"

export type ArchivedBriefingRecord = {
  briefingDate: Date
  healthScore: number
  openingSummary: string
  briefingJson: unknown
}

export type ExecutiveArchiveReviewCore = {
  startDate: string
  endDate: string
  briefingCount: number
  averageHealthScore: number
  bestHealthScore: number
  worstHealthScore: number
  healthTrend: HealthTrend
  healthScoreChange: number
  wins: string[]
  risks: string[]
  recurringIssues: string[]
  revenueMovement: string
  growthMovement: string
  deliveryMovement: string
}

export type ExecutiveReviewConfig = {
  periodLabel: string
  emptySummary: string
  emptyRevenueMovement: string
  emptyGrowthMovement: string
  emptyDeliveryMovement: string
  emptyPriorities: string[]
  buildSummary: (params: {
    sorted: ArchivedBriefingRecord[]
    averageHealthScore: number
    healthTrend: HealthTrend
    healthScoreChange: number
  }) => string
  maxPriorities?: number
}

export function formatReviewDate(value: Date) {
  return value.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatAud(value: number) {
  return `AUD ${value.toLocaleString("en-AU")}`
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

export function parseBriefingJson(json: unknown): DailyBriefing | null {
  if (!json || typeof json !== "object") {
    return null
  }

  return json as DailyBriefing
}

export function computeHealthTrend(change: number): HealthTrend {
  if (change >= 5) {
    return "Improving"
  }

  if (change <= -5) {
    return "Declining"
  }

  return "Stable"
}

function normalizeRiskKey(text: string) {
  return text.toLowerCase().trim().replace(/\s+/g, " ")
}

export function detectRecurringIssues(
  briefings: ArchivedBriefingRecord[]
): string[] {
  const riskOccurrences = new Map<string, { count: number; original: string }>()

  for (const record of briefings) {
    const json = parseBriefingJson(record.briefingJson)
    if (!json?.risks) {
      continue
    }

    const seenInBriefing = new Set<string>()

    for (const risk of json.risks) {
      const key = normalizeRiskKey(risk)
      if (!key || seenInBriefing.has(key)) {
        continue
      }

      seenInBriefing.add(key)

      const existing = riskOccurrences.get(key)
      if (existing) {
        existing.count += 1
      } else {
        riskOccurrences.set(key, { count: 1, original: risk })
      }
    }
  }

  return [...riskOccurrences.values()]
    .filter((item) => item.count >= 2)
    .sort((a, b) => b.count - a.count)
    .map((item) => `${item.original} (appeared ${item.count} times)`)
}

function compareRevenue(oldest: DailyBriefing, newest: DailyBriefing) {
  const parts: string[] = []
  const oldSnapshot = oldest.revenueSnapshot
  const newSnapshot = newest.revenueSnapshot

  if (newSnapshot.totalPaid !== oldSnapshot.totalPaid) {
    const delta = newSnapshot.totalPaid - oldSnapshot.totalPaid
    parts.push(
      `Total paid moved from ${formatAud(oldSnapshot.totalPaid)} to ${formatAud(newSnapshot.totalPaid)} (${delta >= 0 ? "+" : ""}${formatAud(delta)})`
    )
  }

  if (newSnapshot.outstandingRevenue !== oldSnapshot.outstandingRevenue) {
    parts.push(
      `Outstanding revenue changed from ${formatAud(oldSnapshot.outstandingRevenue)} to ${formatAud(newSnapshot.outstandingRevenue)}`
    )
  }

  if (newSnapshot.openPipeline !== oldSnapshot.openPipeline) {
    parts.push(
      `Open pipeline changed from ${formatAud(oldSnapshot.openPipeline)} to ${formatAud(newSnapshot.openPipeline)}`
    )
  }

  if (newSnapshot.wonRevenue !== oldSnapshot.wonRevenue) {
    parts.push(
      `Won revenue changed from ${formatAud(oldSnapshot.wonRevenue)} to ${formatAud(newSnapshot.wonRevenue)}`
    )
  }

  return parts
}

function compareGrowth(oldest: DailyBriefing, newest: DailyBriefing) {
  const parts: string[] = []
  const oldSnapshot = oldest.growthSnapshot
  const newSnapshot = newest.growthSnapshot

  if (newSnapshot.totalSubscribers !== oldSnapshot.totalSubscribers) {
    const delta = newSnapshot.totalSubscribers - oldSnapshot.totalSubscribers
    parts.push(
      `Subscribers moved from ${oldSnapshot.totalSubscribers} to ${newSnapshot.totalSubscribers} (${delta >= 0 ? "+" : ""}${delta})`
    )
  }

  if (newSnapshot.growthRate !== oldSnapshot.growthRate) {
    parts.push(
      `Growth rate changed from ${oldSnapshot.growthRate}% to ${newSnapshot.growthRate}%`
    )
  }

  if (newSnapshot.leadMagnetSubscribers !== oldSnapshot.leadMagnetSubscribers) {
    parts.push(
      `Lead magnet subscribers changed from ${oldSnapshot.leadMagnetSubscribers} to ${newSnapshot.leadMagnetSubscribers}`
    )
  }

  return parts
}

function compareDelivery(oldest: DailyBriefing, newest: DailyBriefing) {
  const parts: string[] = []
  const oldSnapshot = oldest.deliverySnapshot
  const newSnapshot = newest.deliverySnapshot

  if (newSnapshot.overdueTasks !== oldSnapshot.overdueTasks) {
    parts.push(
      `Overdue tasks changed from ${oldSnapshot.overdueTasks} to ${newSnapshot.overdueTasks}`
    )
  }

  if (newSnapshot.deliveryHealthScore !== oldSnapshot.deliveryHealthScore) {
    const delta =
      newSnapshot.deliveryHealthScore - oldSnapshot.deliveryHealthScore
    parts.push(
      `Delivery health score moved from ${oldSnapshot.deliveryHealthScore} to ${newSnapshot.deliveryHealthScore} (${delta >= 0 ? "+" : ""}${delta})`
    )
  }

  if (newSnapshot.openTasks !== oldSnapshot.openTasks) {
    parts.push(
      `Open tasks changed from ${oldSnapshot.openTasks} to ${newSnapshot.openTasks}`
    )
  }

  if (newSnapshot.completedProjects !== oldSnapshot.completedProjects) {
    parts.push(
      `Completed projects changed from ${oldSnapshot.completedProjects} to ${newSnapshot.completedProjects}`
    )
  }

  return parts
}

function buildMovementSummary(
  label: string,
  oldest: DailyBriefing | null,
  newest: DailyBriefing | null,
  compare: (oldBriefing: DailyBriefing, newBriefing: DailyBriefing) => string[]
): string {
  if (!oldest || !newest) {
    return `Limited archived data — unable to calculate ${label.toLowerCase()} movement.`
  }

  const parts = compare(oldest, newest)

  if (parts.length === 0) {
    return `${label}: No measurable change across the archived period.`
  }

  return `${label}: ${parts.join(". ")}.`
}

function buildPriorities(
  briefings: ArchivedBriefingRecord[],
  maxPriorities: number
): string[] {
  const sortedNewestFirst = [...briefings].sort(
    (a, b) => b.briefingDate.getTime() - a.briefingDate.getTime()
  )
  const pool: string[] = []

  for (const record of sortedNewestFirst) {
    const json = parseBriefingJson(record.briefingJson)
    if (!json) {
      continue
    }

    pool.push(...json.recommendedActions, ...json.risks)
  }

  return uniqueStrings(pool).slice(0, maxPriorities)
}

function collectBriefingStrings(
  briefings: ArchivedBriefingRecord[],
  field: "wins" | "risks"
): string[] {
  const sortedNewestFirst = [...briefings].sort(
    (a, b) => b.briefingDate.getTime() - a.briefingDate.getTime()
  )
  const pool: string[] = []

  for (const record of sortedNewestFirst) {
    const json = parseBriefingJson(record.briefingJson)
    if (!json?.[field]) {
      continue
    }

    pool.push(...json[field])
  }

  return uniqueStrings(pool)
}

export function buildExecutiveArchiveReview(
  records: ArchivedBriefingRecord[],
  config: ExecutiveReviewConfig
): ExecutiveArchiveReviewCore & { summary: string; priorities: string[] } {
  const maxPriorities = config.maxPriorities ?? 10

  if (records.length === 0) {
    return {
      startDate: "",
      endDate: "",
      briefingCount: 0,
      averageHealthScore: 0,
      bestHealthScore: 0,
      worstHealthScore: 0,
      healthTrend: "Stable",
      healthScoreChange: 0,
      summary: config.emptySummary,
      wins: [],
      risks: [],
      recurringIssues: [],
      revenueMovement: config.emptyRevenueMovement,
      growthMovement: config.emptyGrowthMovement,
      deliveryMovement: config.emptyDeliveryMovement,
      priorities: config.emptyPriorities,
    }
  }

  const sorted = [...records].sort(
    (a, b) => a.briefingDate.getTime() - b.briefingDate.getTime()
  )

  const scores = sorted.map((item) => item.healthScore)
  const averageHealthScore = Math.round(
    scores.reduce((sum, score) => sum + score, 0) / scores.length
  )
  const bestHealthScore = Math.max(...scores)
  const worstHealthScore = Math.min(...scores)
  const healthScoreChange =
    sorted[sorted.length - 1].healthScore - sorted[0].healthScore
  const healthTrend = computeHealthTrend(healthScoreChange)

  const oldestJson = parseBriefingJson(sorted[0].briefingJson)
  const newestJson = parseBriefingJson(sorted[sorted.length - 1].briefingJson)

  return {
    startDate: formatReviewDate(sorted[0].briefingDate),
    endDate: formatReviewDate(sorted[sorted.length - 1].briefingDate),
    briefingCount: sorted.length,
    averageHealthScore,
    bestHealthScore,
    worstHealthScore,
    healthTrend,
    healthScoreChange,
    summary: config.buildSummary({
      sorted,
      averageHealthScore,
      healthTrend,
      healthScoreChange,
    }),
    wins: collectBriefingStrings(sorted, "wins"),
    risks: collectBriefingStrings(sorted, "risks"),
    recurringIssues: detectRecurringIssues(sorted),
    revenueMovement: buildMovementSummary(
      "Revenue",
      oldestJson,
      newestJson,
      compareRevenue
    ),
    growthMovement: buildMovementSummary(
      "Growth",
      oldestJson,
      newestJson,
      compareGrowth
    ),
    deliveryMovement: buildMovementSummary(
      "Delivery",
      oldestJson,
      newestJson,
      compareDelivery
    ),
    priorities: buildPriorities(sorted, maxPriorities),
  }
}
