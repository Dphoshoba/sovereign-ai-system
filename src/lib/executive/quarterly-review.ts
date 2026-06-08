import { serializeDecision } from "@/lib/executive/decision-memory"
import { buildDecisionOutcomeSummary } from "@/lib/executive/decision-outcomes"
import {
  buildExecutiveForecast,
  type ExecutiveForecast,
} from "@/lib/executive/forecast"
import {
  calculateInitiativePerformance,
  type InitiativePerformance,
} from "@/lib/executive/initiative-performance"
import {
  buildExecutiveLearning,
  serializeExecutiveLesson,
  type ExecutiveLearningSummary,
} from "@/lib/executive/learning-system"
import {
  buildExecutiveMonthlyReview,
  type ExecutiveMonthlyReview,
} from "@/lib/executive/monthly-review"
import {
  computeOverallHealthScore,
  getExecutivePlatformSnapshot,
  type ExecutivePlatformSnapshot,
} from "@/lib/executive/platform-snapshot"
import {
  buildPerformanceScorecard,
  getCurrentQuarter,
} from "@/lib/executive/quarterly-goals"
import { buildExecutiveRecommendations } from "@/lib/executive/recommendations"
import {
  buildStrategicPlan,
  type StrategicPlan,
} from "@/lib/executive/strategic-plan"
import { buildExecutiveWeeklyReview } from "@/lib/executive/weekly-review"
import { prisma } from "@/lib/prisma"

export type QuarterlyReviewGoalItem = {
  id: string
  title: string
  status: string
  progress: number
  category: string | null
  targetValue: number | null
  currentValue: number | null
}

export type QuarterlyReviewGoalPerformance = {
  totalGoals: number
  completedGoals: number
  activeGoals: number
  atRiskGoals: number
  completionRate: number
  rating: "Excellent" | "Good" | "Needs Attention"
  goals: QuarterlyReviewGoalItem[]
}

export type QuarterlyReviewBoardroomSummary = {
  sessionCount: number
  averageHealthScore: number
  latestSummary: string | null
}

export type ExecutiveQuarterlyReview = {
  quarter: string
  year: number
  healthScore: number
  executiveSummary: string
  goalPerformance: QuarterlyReviewGoalPerformance
  initiativePerformance: InitiativePerformance
  decisionPerformance: ReturnType<typeof buildDecisionOutcomeSummary>
  learningSummary: ExecutiveLearningSummary
  boardroomSummary: QuarterlyReviewBoardroomSummary
  wins: string[]
  losses: string[]
  opportunities: string[]
  recommendations: string[]
}

type QuarterlyReviewContext = {
  quarter: string
  year: number
  goals: QuarterlyReviewGoalItem[]
  initiatives: {
    id: string
    title: string
    goalId: string | null
    status: string
    progress: number
  }[]
  snapshot: ExecutivePlatformSnapshot
  forecast: ExecutiveForecast
  strategicPlan: StrategicPlan
  monthlyReview: ExecutiveMonthlyReview
  weeklyReview: ReturnType<typeof buildExecutiveWeeklyReview>
  decisionPerformance: ReturnType<typeof buildDecisionOutcomeSummary>
  learningSummary: ExecutiveLearningSummary
  boardroomSummary: QuarterlyReviewBoardroomSummary
}

const STRONG_EFFECTIVENESS_THRESHOLD = 75
const WEAK_EFFECTIVENESS_THRESHOLD = 50

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

export function getQuarterDateRange(quarter: string, year: number) {
  const match = quarter.match(/^Q([1-4])$/)
  const quarterNumber = match ? Number(match[1]) : 1
  const startMonth = (quarterNumber - 1) * 3
  const start = new Date(year, startMonth, 1, 0, 0, 0, 0)
  const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999)

  return { start, end }
}

function clampHealthScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function buildGoalPerformance(
  goals: QuarterlyReviewGoalItem[]
): QuarterlyReviewGoalPerformance {
  const scorecard = buildPerformanceScorecard(goals)

  return {
    totalGoals: goals.length,
    completedGoals: scorecard.completedGoals,
    activeGoals: goals.filter(
      (goal) => goal.status === "active" || goal.status === "planned"
    ).length,
    atRiskGoals: goals.filter((goal) => goal.status === "at-risk").length,
    completionRate: scorecard.completionRate,
    rating: scorecard.rating,
    goals,
  }
}

function buildBoardroomSummary(
  sessions: { healthScore: number | null; summary: string | null }[]
): QuarterlyReviewBoardroomSummary {
  if (sessions.length === 0) {
    return {
      sessionCount: 0,
      averageHealthScore: 0,
      latestSummary: null,
    }
  }

  const scored = sessions.filter((session) => session.healthScore !== null)
  const averageHealthScore =
    scored.length > 0
      ? Math.round(
          scored.reduce((sum, session) => sum + (session.healthScore ?? 0), 0) /
            scored.length
        )
      : 0

  return {
    sessionCount: sessions.length,
    averageHealthScore,
    latestSummary: sessions[0]?.summary ?? null,
  }
}

function computeQuarterlyHealthScore(context: QuarterlyReviewContext): number {
  const {
    goalPerformance,
    initiativePerformance,
    decisionPerformance,
    monthlyReview,
    boardroomSummary,
    snapshot,
  } = {
    goalPerformance: buildGoalPerformance(context.goals),
    initiativePerformance: calculateInitiativePerformance(
      context.initiatives,
      context.goals
    ),
    decisionPerformance: context.decisionPerformance,
    monthlyReview: context.monthlyReview,
    boardroomSummary: context.boardroomSummary,
    snapshot: context.snapshot,
  }

  let score = computeOverallHealthScore(snapshot)

  if (goalPerformance.totalGoals > 0) {
    score = Math.round(
      score * 0.4 + goalPerformance.completionRate * 0.25
    )
  }

  if (initiativePerformance.totalInitiatives > 0) {
    score = Math.round(
      score * 0.75 + initiativePerformance.completionRate * 0.25
    )
  }

  if (monthlyReview.briefingCount > 0) {
    score = Math.round(
      (score + monthlyReview.averageHealthScore) / 2
    )
  }

  if (decisionPerformance.averageEffectiveness > 0) {
    score = Math.round(
      score * 0.85 + decisionPerformance.averageEffectiveness * 0.15
    )
  }

  if (boardroomSummary.sessionCount > 0) {
    score = Math.round(
      (score + boardroomSummary.averageHealthScore) / 2
    )
  }

  if (goalPerformance.atRiskGoals > 0) {
    score -= Math.min(15, goalPerformance.atRiskGoals * 5)
  }

  if (initiativePerformance.blockedInitiatives > 0) {
    score -= Math.min(15, initiativePerformance.blockedInitiatives * 5)
  }

  return clampHealthScore(score)
}

function buildWins(context: QuarterlyReviewContext): string[] {
  const wins: string[] = []
  const goalPerformance = buildGoalPerformance(context.goals)
  const initiativePerformance = calculateInitiativePerformance(
    context.initiatives,
    context.goals
  )

  for (const goal of context.goals.filter((item) => item.status === "completed")) {
    wins.push(`Completed quarterly goal: ${goal.title}`)
  }

  for (const initiative of context.initiatives.filter(
    (item) => item.status === "completed"
  )) {
    wins.push(`Completed strategic initiative: ${initiative.title}`)
  }

  if (
    context.decisionPerformance.averageEffectiveness >=
    STRONG_EFFECTIVENESS_THRESHOLD
  ) {
    wins.push(
      `Strong decision effectiveness averaged ${context.decisionPerformance.averageEffectiveness}/100${context.decisionPerformance.strongestImpactArea ? ` in ${context.decisionPerformance.strongestImpactArea}` : ""}.`
    )
  }

  for (const lesson of context.learningSummary.recommendedPractices.slice(0, 3)) {
    wins.push(
      `Proven practice (${lesson.effectiveness}/100): ${lesson.title}`
    )
  }

  wins.push(...context.monthlyReview.wins.slice(0, 3))
  wins.push(...context.weeklyReview.wins.slice(0, 2))

  if (goalPerformance.completionRate >= 80 && goalPerformance.totalGoals > 0) {
    wins.push(
      `Quarterly goal completion rate reached ${goalPerformance.completionRate}%.`
    )
  }

  if (
    initiativePerformance.completionRate >= 80 &&
    initiativePerformance.totalInitiatives > 0
  ) {
    wins.push(
      `Initiative completion rate reached ${initiativePerformance.completionRate}%.`
    )
  }

  return uniqueStrings(wins).slice(0, 12)
}

function buildLosses(context: QuarterlyReviewContext): string[] {
  const losses: string[] = []

  for (const goal of context.goals.filter((item) => item.status === "at-risk")) {
    losses.push(
      `At-risk quarterly goal: ${goal.title} at ${goal.progress}% progress.`
    )
  }

  for (const goal of context.goals.filter(
    (item) => item.status !== "completed" && item.progress < 30
  )) {
    if (goal.status !== "at-risk") {
      losses.push(
        `Underperforming goal: ${goal.title} at ${goal.progress}% progress.`
      )
    }
  }

  for (const initiative of context.initiatives.filter(
    (item) => item.status === "blocked"
  )) {
    losses.push(`Blocked strategic initiative: ${initiative.title}.`)
  }

  if (
    context.decisionPerformance.weakestImpactArea &&
    context.decisionPerformance.averageEffectiveness > 0 &&
    context.decisionPerformance.averageEffectiveness <
      WEAK_EFFECTIVENESS_THRESHOLD
  ) {
    losses.push(
      `Weak decision effectiveness (${context.decisionPerformance.averageEffectiveness}/100) in ${context.decisionPerformance.weakestImpactArea}.`
    )
  }

  if (context.decisionPerformance.decisionsNeedingFollowUp > 0) {
    losses.push(
      `${context.decisionPerformance.decisionsNeedingFollowUp} decision${context.decisionPerformance.decisionsNeedingFollowUp === 1 ? "" : "s"} still require follow-up.`
    )
  }

  losses.push(...context.monthlyReview.risks.slice(0, 3))
  losses.push(...context.forecast.riskForecast.slice(0, 2))

  return uniqueStrings(losses).slice(0, 12)
}

function buildOpportunities(context: QuarterlyReviewContext): string[] {
  const { snapshot, forecast, strategicPlan } = context
  const opportunities: string[] = []

  opportunities.push(
    `Growth: ${forecast.growthForecast.split(".")[0]}.`
  )
  opportunities.push(
    `Revenue: ${forecast.revenueForecast.split(".")[0]}.`
  )
  opportunities.push(
    `Delivery: ${forecast.deliveryForecast.split(".")[0]}.`
  )

  if (snapshot.reviewRequiredCount > 0) {
    opportunities.push(
      `Content: Clear ${snapshot.reviewRequiredCount} article${snapshot.reviewRequiredCount === 1 ? "" : "s"} in editorial review to restore publishing momentum.`
    )
  } else if (snapshot.publishedArticles > 0) {
    opportunities.push(
      `Content: ${snapshot.publishedArticles} published article${snapshot.publishedArticles === 1 ? "" : "s"} provide distribution and SEO momentum.`
    )
  } else {
    opportunities.push(
      "Content: No published articles tracked — prioritize editorial throughput."
    )
  }

  opportunities.push(...forecast.opportunityForecast.slice(0, 3))
  opportunities.push(...strategicPlan.opportunities.slice(0, 2))

  for (const pattern of context.learningSummary.strongestPatterns) {
    opportunities.push(
      `Apply strong ${pattern.impactArea} decision pattern (${pattern.averageEffectiveness}/100 across ${pattern.decisionCount} decision${pattern.decisionCount === 1 ? "" : "s"}).`
    )
  }

  return uniqueStrings(opportunities).slice(0, 10)
}

function buildRecommendations(context: QuarterlyReviewContext): string[] {
  const recommendations: string[] = []
  const goalPerformance = buildGoalPerformance(context.goals)
  const initiativePerformance = calculateInitiativePerformance(
    context.initiatives,
    context.goals
  )

  const nextQuarterNumber =
    context.quarter === "Q4"
      ? 1
      : Number(context.quarter.replace("Q", "")) + 1
  const nextQuarter = `Q${nextQuarterNumber}`
  const nextYear =
    context.quarter === "Q4" ? context.year + 1 : context.year

  recommendations.push(
    `Set ${nextQuarter} ${nextYear} quarterly goals aligned to forecast focus areas and unresolved ${context.quarter} gaps.`
  )

  if (goalPerformance.atRiskGoals > 0) {
    recommendations.push(
      `Carry forward or reset ${goalPerformance.atRiskGoals} at-risk goal${goalPerformance.atRiskGoals === 1 ? "" : "s"} into ${nextQuarter}.`
    )
  }

  if (initiativePerformance.blockedInitiatives > 0) {
    recommendations.push(
      `Unblock or close ${initiativePerformance.blockedInitiatives} blocked initiative${initiativePerformance.blockedInitiatives === 1 ? "" : "s"} before ${nextQuarter} planning.`
    )
  }

  if (context.decisionPerformance.decisionsNeedingFollowUp > 0) {
    recommendations.push(
      "Close open decision follow-ups before the next boardroom cycle."
    )
  }

  recommendations.push(...context.forecast.recommendedFocusAreas.slice(0, 4))
  recommendations.push(...context.strategicPlan.priorities.slice(0, 3))
  recommendations.push(...context.monthlyReview.nextMonthPriorities.slice(0, 2))

  for (const pattern of context.learningSummary.weakestPatterns) {
    recommendations.push(
      `Improve ${pattern.impactArea} decision quality (${pattern.averageEffectiveness}/100 average).`
    )
  }

  return uniqueStrings(recommendations).slice(0, 12)
}

function buildExecutiveSummary(
  context: QuarterlyReviewContext,
  healthScore: number,
  goalPerformance: QuarterlyReviewGoalPerformance,
  initiativePerformance: InitiativePerformance
): string {
  const { quarter, year, monthlyReview, boardroomSummary, forecast } = context

  const briefingNote =
    monthlyReview.briefingCount > 0
      ? `${monthlyReview.briefingCount} archived briefing${monthlyReview.briefingCount === 1 ? "" : "s"} informed this review (avg health ${monthlyReview.averageHealthScore}/100).`
      : "No archived briefings were available for this quarter — review relies on live platform and execution data."

  const boardroomNote =
    boardroomSummary.sessionCount > 0
      ? `${boardroomSummary.sessionCount} boardroom session${boardroomSummary.sessionCount === 1 ? "" : "s"} recorded (avg health ${boardroomSummary.averageHealthScore}/100).`
      : "No boardroom sessions were recorded this quarter."

  return `${quarter} ${year} autonomous quarterly executive review. Overall health score ${healthScore}/100. ${goalPerformance.completedGoals} of ${goalPerformance.totalGoals} quarterly goal${goalPerformance.totalGoals === 1 ? "" : "s"} completed (${goalPerformance.completionRate}% completion rate). ${initiativePerformance.completedInitiatives} of ${initiativePerformance.totalInitiatives} strategic initiative${initiativePerformance.totalInitiatives === 1 ? "" : "s"} completed. ${briefingNote} ${boardroomNote} Forecast outlook: ${forecast.executiveOutlook.split(".")[0]}.`
}

function buildQuarterlyReviewFromContext(
  context: QuarterlyReviewContext
): ExecutiveQuarterlyReview {
  const goalPerformance = buildGoalPerformance(context.goals)
  const initiativePerformance = calculateInitiativePerformance(
    context.initiatives,
    context.goals
  )
  const healthScore = computeQuarterlyHealthScore(context)

  return {
    quarter: context.quarter,
    year: context.year,
    healthScore,
    executiveSummary: buildExecutiveSummary(
      context,
      healthScore,
      goalPerformance,
      initiativePerformance
    ),
    goalPerformance,
    initiativePerformance,
    decisionPerformance: context.decisionPerformance,
    learningSummary: context.learningSummary,
    boardroomSummary: context.boardroomSummary,
    wins: buildWins(context),
    losses: buildLosses(context),
    opportunities: buildOpportunities(context),
    recommendations: buildRecommendations(context),
  }
}

async function loadQuarterlyReviewContext(
  quarter: string,
  year: number
): Promise<QuarterlyReviewContext> {
  const { start, end } = getQuarterDateRange(quarter, year)

  const [
    snapshot,
    goals,
    initiatives,
    briefings,
    boardroomSessions,
    executiveDecisions,
    executiveLessons,
    leads,
  ] = await Promise.all([
    getExecutivePlatformSnapshot(),
    prisma.quarterlyGoal.findMany({
      where: { quarter, year },
      orderBy: { createdAt: "asc" },
    }),
    prisma.strategicInitiative.findMany({
      select: {
        id: true,
        title: true,
        goalId: true,
        status: true,
        progress: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.executiveBriefing.findMany({
      where: {
        briefingDate: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        briefingDate: "asc",
      },
    }),
    prisma.executiveBoardroomSession.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.executiveDecision.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.executiveLesson.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.creatorLead.findMany(),
  ])

  const serializedDecisions = executiveDecisions.map(serializeDecision)
  const serializedLessons = executiveLessons.map(serializeExecutiveLesson)
  const monthlyReview = buildExecutiveMonthlyReview(briefings)
  const weeklyReview = buildExecutiveWeeklyReview(briefings.slice(-7))
  const forecast = buildExecutiveForecast({
    snapshot,
    briefings,
    monthlyReview,
  })
  const recommendations = buildExecutiveRecommendations(snapshot)
  const proposalSentLeads = leads.filter(
    (lead) => lead.status === "proposal-sent"
  ).length
  const strategicPlan = buildStrategicPlan({
    snapshot,
    forecast,
    monthlyReview,
    weeklyReview,
    recommendations,
    proposalSentLeads,
  })

  return {
    quarter,
    year,
    goals: goals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      status: goal.status,
      progress: goal.progress,
      category: goal.category,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
    })),
    initiatives,
    snapshot,
    forecast,
    strategicPlan,
    monthlyReview,
    weeklyReview,
    decisionPerformance: buildDecisionOutcomeSummary(serializedDecisions),
    learningSummary: buildExecutiveLearning(
      serializedDecisions,
      serializedLessons
    ),
    boardroomSummary: buildBoardroomSummary(boardroomSessions),
  }
}

export async function buildQuarterlyReview(
  quarter = getCurrentQuarter().quarter,
  year = getCurrentQuarter().year
): Promise<ExecutiveQuarterlyReview> {
  const context = await loadQuarterlyReviewContext(quarter, year)
  return buildQuarterlyReviewFromContext(context)
}

export { getCurrentQuarter }
