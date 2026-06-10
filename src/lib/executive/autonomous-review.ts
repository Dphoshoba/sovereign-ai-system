import { prisma } from "@/lib/prisma"
import { buildExecutiveMemory } from "@/lib/executive/memory"
import { buildExecutiveTimeline } from "@/lib/executive/timeline"
import { trackDecisionImpacts } from "@/lib/executive/decision-impact"
import { generateExecutiveRisks } from "@/lib/executive/risks"
import { generateExecutiveOpportunities } from "@/lib/executive/opportunities"
import { generateExecutiveRecommendations } from "@/lib/executive/recommendations"
import { getExecutivePlatformSnapshot } from "@/lib/executive/platform-snapshot"

// Phase 22 — Autonomous Executive Review System.
// Deterministic, rule-based reviews generated from accumulated executive
// memory: timeline, knowledge graph, boardroom history, planning cycles,
// decisions, lessons, and revenue/growth/delivery metrics. No OpenAI.

export type ExecutiveReviewPeriod = "weekly" | "monthly" | "quarterly"

export type RecurringPattern = {
  pattern: string
  type: "risk" | "opportunity" | "decision_failure" | "lesson" | "decision"
  occurrences: number
}

export type AutonomousExecutiveReview = {
  period: ExecutiveReviewPeriod
  windowDays: number
  generatedAt: string
  healthScore: number
  majorWins: string[]
  majorRisks: string[]
  majorOpportunities: string[]
  recurringPatterns: RecurringPattern[]
  recommendedActions: string[]
  confidence: number
}

const PERIOD_WINDOW_DAYS: Record<ExecutiveReviewPeriod, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
}

const TOP_LIMIT = 5

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function formatAud(value: number) {
  return `AUD ${Math.round(value).toLocaleString("en-AU")}`
}

/** Normalize effectiveness to a 0-100 scale (seed data uses 1-5). */
function normalizeEffectiveness(value: number | null) {
  if (value === null) {
    return null
  }

  return clamp(value <= 5 ? value * 20 : value, 0, 100)
}

async function generateExecutiveReview(
  period: ExecutiveReviewPeriod
): Promise<AutonomousExecutiveReview> {
  const windowDays = PERIOD_WINDOW_DAYS[period]
  const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)

  const [
    memory,
    timeline,
    decisionImpacts,
    risks,
    opportunities,
    recommendations,
    snapshot,
    decisions,
    goals,
  ] = await Promise.all([
    buildExecutiveMemory(),
    buildExecutiveTimeline(),
    trackDecisionImpacts(),
    generateExecutiveRisks(),
    generateExecutiveOpportunities(),
    generateExecutiveRecommendations(),
    getExecutivePlatformSnapshot(),
    prisma.executiveDecision.findMany(),
    prisma.quarterlyGoal.findMany(),
  ])

  const windowItems = timeline.filter(
    (item) => new Date(item.createdAt) >= windowStart
  )

  // -------------------------------------------------------------------------
  // Major wins — concrete positives from revenue, growth, delivery, and the
  // executive operating rhythm inside the review window.
  // -------------------------------------------------------------------------
  const majorWins: string[] = []

  if (snapshot.totalPaid > 0) {
    majorWins.push(
      `${formatAud(snapshot.totalPaid)} in client revenue collected to date.`
    )
  }

  if (snapshot.wonLeads > 0) {
    majorWins.push(
      `${snapshot.wonLeads} lead${snapshot.wonLeads === 1 ? "" : "s"} won into client work.`
    )
  }

  if (snapshot.growthRate > 0) {
    majorWins.push(
      `Subscriber growth running at ${snapshot.growthRate}% this month.`
    )
  }

  const completedGoals = goals.filter((goal) => goal.status === "completed")
  if (completedGoals.length > 0) {
    majorWins.push(
      `${completedGoals.length} quarterly goal${completedGoals.length === 1 ? "" : "s"} completed.`
    )
  }

  const advancedGoals = goals.filter(
    (goal) => goal.status !== "completed" && goal.progress >= 60
  )
  if (advancedGoals.length > 0) {
    majorWins.push(
      `${advancedGoals.length} goal${advancedGoals.length === 1 ? "" : "s"} past 60% progress.`
    )
  }

  const implementedInWindow = windowItems.filter(
    (item) => item.type === "decision" && item.status === "implemented"
  )
  if (implementedInWindow.length > 0) {
    majorWins.push(
      `${implementedInWindow.length} decision${implementedInWindow.length === 1 ? "" : "s"} implemented this ${period === "weekly" ? "week" : period === "monthly" ? "month" : "quarter"}.`
    )
  }

  const sessionsInWindow = windowItems.filter(
    (item) =>
      item.type === "boardroom_session" || item.type === "planning_cycle"
  )
  if (sessionsInWindow.length > 0) {
    majorWins.push(
      `Operating rhythm active — ${sessionsInWindow.length} boardroom/planning session${sessionsInWindow.length === 1 ? "" : "s"} in the last ${windowDays} days.`
    )
  }

  if (snapshot.deliveryHealthScore >= 80) {
    majorWins.push(
      `Delivery health is strong at ${snapshot.deliveryHealthScore}/100.`
    )
  }

  // -------------------------------------------------------------------------
  // Major risks and opportunities — from the rule-based engines.
  // -------------------------------------------------------------------------
  const majorRisks = risks
    .slice(0, TOP_LIMIT)
    .map((risk) => `[${risk.severity}] ${risk.title} — ${risk.impact}`)

  const majorOpportunities = opportunities
    .slice(0, TOP_LIMIT)
    .map(
      (opportunity) =>
        `${opportunity.title} (score ${opportunity.score}/100${opportunity.potentialValue > 0 ? `, ${formatAud(opportunity.potentialValue)}` : ""})`
    )

  // -------------------------------------------------------------------------
  // Pattern detection.
  // -------------------------------------------------------------------------
  const recurringPatterns: RecurringPattern[] = []

  // Recurring risks and opportunities (seen 2+ times across cycles/sessions).
  for (const item of memory.strategicMemory.recurringRisks) {
    if (item.occurrences >= 2) {
      recurringPatterns.push({
        pattern: `Recurring risk: ${item.text}`,
        type: "risk",
        occurrences: item.occurrences,
      })
    }
  }

  for (const item of memory.strategicMemory.recurringOpportunities) {
    if (item.occurrences >= 2) {
      recurringPatterns.push({
        pattern: `Recurring opportunity: ${item.text}`,
        type: "opportunity",
        occurrences: item.occurrences,
      })
    }
  }

  // Repeated decision failures — rejected or low-effectiveness decisions,
  // grouped by category.
  const failuresByCategory = new Map<string, number>()

  for (const decision of decisions) {
    const effectiveness = normalizeEffectiveness(decision.effectiveness)
    const failed =
      decision.status === "rejected" ||
      (effectiveness !== null && effectiveness < 40)

    if (failed) {
      const category = decision.category?.trim() || "uncategorized"
      failuresByCategory.set(
        category,
        (failuresByCategory.get(category) ?? 0) + 1
      )
    }
  }

  for (const [category, count] of [...failuresByCategory.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  )) {
    if (count >= 2) {
      recurringPatterns.push({
        pattern: `Repeated decision failures in ${category} (${count} low-effectiveness or rejected decisions)`,
        type: "decision_failure",
        occurrences: count,
      })
    }
  }

  // Strongest decisions — highest tracked impact.
  for (const impact of decisionImpacts.slice(0, 3)) {
    if (impact.impactScore >= 60) {
      recurringPatterns.push({
        pattern: `Strong decision: ${impact.decision} (${impact.impactArea}, impact ${impact.impactScore}/100)`,
        type: "decision",
        occurrences: 1,
      })
    }
  }

  // Strongest lessons — highest recorded effectiveness.
  for (const lesson of memory.strategicMemory.mostEffectiveLessons.slice(0, 3)) {
    recurringPatterns.push({
      pattern: `Strong lesson: ${lesson.title}${lesson.impactArea ? ` (${lesson.impactArea})` : ""}`,
      type: "lesson",
      occurrences: 1,
    })
  }

  // -------------------------------------------------------------------------
  // Recommended actions — top rule-based recommendations plus mitigations
  // for the most severe risks.
  // -------------------------------------------------------------------------
  const recommendedActions: string[] = []

  for (const recommendation of recommendations.slice(0, TOP_LIMIT)) {
    recommendedActions.push(recommendation.action)
  }

  for (const risk of risks.slice(0, 3)) {
    if (
      (risk.severity === "critical" || risk.severity === "high") &&
      !recommendedActions.includes(risk.mitigation)
    ) {
      recommendedActions.push(risk.mitigation)
    }
  }

  // -------------------------------------------------------------------------
  // Health score — deterministic blend of delivery, revenue collection,
  // growth, and decision effectiveness, minus risk pressure.
  // -------------------------------------------------------------------------
  const deliveryComponent = snapshot.deliveryHealthScore

  const revenueComponent =
    snapshot.totalInvoiced > 0
      ? (snapshot.totalPaid / snapshot.totalInvoiced) * 100
      : 50

  const growthComponent = clamp(50 + snapshot.growthRate * 5, 0, 100)

  const decisionComponent =
    decisionImpacts.length > 0
      ? decisionImpacts.reduce((sum, item) => sum + item.impactScore, 0) /
        decisionImpacts.length
      : 50

  const riskPenalty = risks.reduce((total, risk) => {
    if (risk.severity === "critical") return total + 8
    if (risk.severity === "high") return total + 5
    if (risk.severity === "medium") return total + 3
    return total + 1
  }, 0)

  const healthScore = Math.round(
    clamp(
      deliveryComponent * 0.3 +
        revenueComponent * 0.25 +
        growthComponent * 0.2 +
        decisionComponent * 0.25 -
        riskPenalty,
      0,
      100
    )
  )

  // -------------------------------------------------------------------------
  // Confidence — rises with the volume of memory available for the period.
  // -------------------------------------------------------------------------
  const confidence =
    Math.round(
      clamp(
        0.3 +
          windowItems.length * 0.02 +
          memory.graph.totalEdges * 0.002 +
          decisions.length * 0.01,
        0.3,
        0.95
      ) * 100
    ) / 100

  return {
    period,
    windowDays,
    generatedAt: new Date().toISOString(),
    healthScore,
    majorWins: majorWins.slice(0, 7),
    majorRisks,
    majorOpportunities,
    recurringPatterns: recurringPatterns.slice(0, 10),
    recommendedActions: recommendedActions.slice(0, 7),
    confidence,
  }
}

export async function generateWeeklyExecutiveReview() {
  return generateExecutiveReview("weekly")
}

export async function generateMonthlyExecutiveReview() {
  return generateExecutiveReview("monthly")
}

export async function generateQuarterlyExecutiveReview() {
  return generateExecutiveReview("quarterly")
}

export function isExecutiveReviewPeriod(
  value: string
): value is ExecutiveReviewPeriod {
  return value === "weekly" || value === "monthly" || value === "quarterly"
}
