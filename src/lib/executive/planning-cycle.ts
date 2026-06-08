import { buildDailyBriefing, type DailyBriefing } from "@/lib/executive/daily-briefing"
import {
  buildExecutiveForecast,
  type ExecutiveForecast,
} from "@/lib/executive/forecast"
import {
  calculateInitiativePerformance,
  type InitiativePerformance,
} from "@/lib/executive/initiative-performance"
import {
  buildExecutiveMonthlyReview,
  getMonthlyReviewDateCutoff,
} from "@/lib/executive/monthly-review"
import {
  getExecutivePlatformSnapshot,
  type ExecutivePlatformSnapshot,
} from "@/lib/executive/platform-snapshot"
import {
  buildExecutiveRecommendations,
  type ExecutiveRecommendations,
} from "@/lib/executive/recommendations"
import {
  buildStrategicPlan,
  type StrategicPlan,
} from "@/lib/executive/strategic-plan"
import { buildExecutiveWeeklyReview } from "@/lib/executive/weekly-review"
import { prisma } from "@/lib/prisma"

export type PlanningCycleAction = {
  title: string
  description: string
  link?: string
  actionType?: string
}

export type PlanningCycleResult = {
  cycleType: string
  healthScore: number
  summary: string
  recommendations: string[]
  risks: string[]
  opportunities: string[]
  actions: PlanningCycleAction[]
}

export type PlanningCycleInputs = {
  cycleType?: string
  snapshot: ExecutivePlatformSnapshot
  forecast: ExecutiveForecast
  strategicPlan: StrategicPlan
  goals: {
    id: string
    title: string
    status: string
    progress: number
    targetValue: number | null
    currentValue: number | null
  }[]
  initiativePerformance: InitiativePerformance
  recommendations: ExecutiveRecommendations
  briefing: DailyBriefing
}

const DELIVERY_HEALTH_THRESHOLD = 70
const GROWTH_WEAK_SUBSCRIBER_THRESHOLD = 50

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function computePlanningHealthScore(inputs: PlanningCycleInputs): number {
  const { briefing, forecast, initiativePerformance, goals } = inputs

  let score = Math.round((briefing.healthScore + forecast.forecastHealthScore) / 2)

  const atRiskGoals = goals.filter((goal) => goal.status === "at-risk").length
  if (atRiskGoals > 0) {
    score -= Math.min(20, atRiskGoals * 5)
  }

  if (initiativePerformance.blockedInitiatives > 0) {
    score -= Math.min(15, initiativePerformance.blockedInitiatives * 5)
  }

  if (initiativePerformance.initiativeHealth === "Needs Attention") {
    score -= 10
  }

  return Math.max(0, Math.min(100, score))
}

function buildRecommendations(inputs: PlanningCycleInputs): string[] {
  const { snapshot, goals, initiativePerformance, forecast, strategicPlan } =
    inputs

  const recommendations: string[] = []

  const atRiskGoals = goals.filter((goal) => goal.status === "at-risk")
  if (atRiskGoals.length > 0) {
    recommendations.push(
      `Review ${atRiskGoals.length} quarterly goal${atRiskGoals.length === 1 ? "" : "s"} marked at-risk and adjust targets or linked initiatives.`
    )
  }

  if (initiativePerformance.blockedInitiatives > 0) {
    recommendations.push(
      `Conduct unblock review for ${initiativePerformance.blockedInitiatives} blocked strategic initiative${initiativePerformance.blockedInitiatives === 1 ? "" : "s"}.`
    )
  }

  if (snapshot.deliveryHealthScore < DELIVERY_HEALTH_THRESHOLD) {
    recommendations.push(
      `Run delivery cleanup — delivery health score is ${snapshot.deliveryHealthScore}/100.`
    )
  }

  if (
    snapshot.growthRate === 0 ||
    snapshot.totalSubscribers < GROWTH_WEAK_SUBSCRIBER_THRESHOLD
  ) {
    recommendations.push(
      "Push subscriber acquisition through lead magnets, content distribution, and newsletter growth."
    )
  }

  if (snapshot.outstandingRevenue > 0) {
    recommendations.push(
      `Follow up on outstanding revenue (${snapshot.outstandingRevenue.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 })}).`
    )
  }

  if (snapshot.reviewRequiredCount > 0) {
    recommendations.push(
      `Clear editorial review backlog (${snapshot.reviewRequiredCount} article${snapshot.reviewRequiredCount === 1 ? "" : "s"} waiting).`
    )
  }

  recommendations.push(...forecast.recommendedFocusAreas.slice(0, 3))
  recommendations.push(...strategicPlan.priorities.slice(0, 2))

  return uniqueStrings(recommendations).slice(0, 10)
}

function buildRisks(inputs: PlanningCycleInputs): string[] {
  const { briefing, forecast, strategicPlan, initiativePerformance, goals } =
    inputs

  const offTrackGoals = initiativePerformance.goalAlignment.filter(
    (item) => item.status === "Off Track"
  ).length

  const risks = [
    ...briefing.risks,
    ...forecast.riskForecast,
    ...strategicPlan.risks,
  ]

  if (offTrackGoals > 0) {
    risks.push(
      `${offTrackGoals} quarterly goal${offTrackGoals === 1 ? "" : "s"} off track against linked initiatives`
    )
  }

  const lowProgressGoals = goals.filter(
    (goal) => goal.status !== "completed" && goal.progress < 30
  ).length

  if (lowProgressGoals > 0) {
    risks.push(
      `${lowProgressGoals} goal${lowProgressGoals === 1 ? "" : "s"} below 30% progress`
    )
  }

  return uniqueStrings(risks).slice(0, 12)
}

function buildOpportunities(inputs: PlanningCycleInputs): string[] {
  const { briefing, forecast, strategicPlan, initiativePerformance } = inputs

  const opportunities = [
    ...briefing.wins,
    ...forecast.opportunityForecast,
    ...strategicPlan.opportunities,
  ]

  if (initiativePerformance.completedInitiatives > 0) {
    opportunities.push(
      `${initiativePerformance.completedInitiatives} strategic initiative${initiativePerformance.completedInitiatives === 1 ? "" : "s"} completed — momentum to build on`
    )
  }

  if (initiativePerformance.initiativeHealth === "Excellent") {
    opportunities.push(
      "Initiative completion rate is strong — consider raising quarterly goal targets"
    )
  }

  return uniqueStrings(opportunities).slice(0, 12)
}

function buildActions(inputs: PlanningCycleInputs): PlanningCycleAction[] {
  const { snapshot, goals, initiativePerformance } = inputs
  const actions: PlanningCycleAction[] = []

  if (snapshot.overdueTasks > 0) {
    actions.push({
      title: "Review overdue tasks",
      description: `${snapshot.overdueTasks} client delivery task${snapshot.overdueTasks === 1 ? "" : "s"} are past due.`,
      link: "/admin/client-projects",
      actionType: "open-page",
    })
  }

  const linkedGoals = initiativePerformance.goalAlignment.some(
    (item) => item.linkedInitiatives > 0
  )

  if (linkedGoals || goals.length > 0) {
    actions.push({
      title: "Sync goal progress",
      description:
        "Update quarterly goal progress from linked strategic initiatives.",
      link: "/admin/initiative-performance",
      actionType: "open-page",
    })
  }

  if (snapshot.atRiskProjects.length > 0 || snapshot.deliveryHealthScore < 70) {
    actions.push({
      title: "Archive stale projects",
      description:
        "Review delivery dashboard for stalled or at-risk client projects.",
      link: "/admin/delivery",
      actionType: "open-page",
    })
  }

  if (snapshot.outstandingRevenue > 0 || snapshot.overdueInvoices > 0) {
    actions.push({
      title: "Follow up outstanding invoices",
      description: `Outstanding revenue and ${snapshot.overdueInvoices} overdue invoice${snapshot.overdueInvoices === 1 ? "" : "s"} need follow-up.`,
      link: "/admin/invoices",
      actionType: "open-page",
    })
  }

  if (
    snapshot.growthRate === 0 ||
    snapshot.totalSubscribers < GROWTH_WEAK_SUBSCRIBER_THRESHOLD
  ) {
    actions.push({
      title: "Generate new lead magnet",
      description:
        "Create or refresh a lead magnet to drive subscriber acquisition.",
      link: "/admin/lead-magnets",
      actionType: "open-page",
    })
  }

  if (snapshot.proposalReadyLeads.length > 0) {
    actions.push({
      title: "Review proposal-ready leads",
      description: `${snapshot.proposalReadyLeads.length} lead${snapshot.proposalReadyLeads.length === 1 ? "" : "s"} ready for proposal follow-up.`,
      link: "/admin/creator-leads",
      actionType: "open-page",
    })
  }

  if (initiativePerformance.blockedInitiatives > 0) {
    actions.push({
      title: "Review blocked initiatives",
      description: `${initiativePerformance.blockedInitiatives} initiative${initiativePerformance.blockedInitiatives === 1 ? "" : "s"} blocked — assess unblock path.`,
      link: "/admin/execution",
      actionType: "open-page",
    })
  }

  if (snapshot.reviewRequiredCount > 0) {
    actions.push({
      title: "Clear editorial review backlog",
      description: `${snapshot.reviewRequiredCount} article${snapshot.reviewRequiredCount === 1 ? "" : "s"} waiting for editorial review.`,
      link: "/admin/articles",
      actionType: "open-page",
    })
  }

  return actions.slice(0, 8)
}

function buildSummary(inputs: PlanningCycleInputs, healthScore: number): string {
  const { briefing, forecast, initiativePerformance, goals, cycleType } = inputs

  const atRiskGoals = goals.filter((goal) => goal.status === "at-risk").length
  const cycleLabel = cycleType === "weekly" ? "Weekly" : cycleType

  const focus =
    atRiskGoals > 0 || initiativePerformance.blockedInitiatives > 0
      ? "Goal and initiative alignment need attention this cycle."
      : "Operations are tracking — focus on forecast priorities and execution momentum."

  return `${cycleLabel} planning cycle review. Health score ${healthScore}/100. ${briefing.openingSummary.split(".")[0]}. Forecast outlook: ${forecast.executiveOutlook.split(".")[0]}. ${initiativePerformance.totalInitiatives} initiative${initiativePerformance.totalInitiatives === 1 ? "" : "s"} tracked across ${goals.length} quarterly goal${goals.length === 1 ? "" : "s"}. ${focus}`
}

export function buildPlanningCycle(
  inputs: PlanningCycleInputs
): PlanningCycleResult {
  const cycleType = inputs.cycleType ?? "weekly"
  const healthScore = computePlanningHealthScore({ ...inputs, cycleType })

  return {
    cycleType,
    healthScore,
    summary: buildSummary({ ...inputs, cycleType }, healthScore),
    recommendations: buildRecommendations({ ...inputs, cycleType }),
    risks: buildRisks({ ...inputs, cycleType }),
    opportunities: buildOpportunities({ ...inputs, cycleType }),
    actions: buildActions({ ...inputs, cycleType }),
  }
}

export async function loadPlanningCycleInputs(
  cycleType = "weekly"
): Promise<PlanningCycleInputs> {
  const cutoff = getMonthlyReviewDateCutoff()

  const [snapshot, briefings, leads, goals, initiatives] = await Promise.all([
    getExecutivePlatformSnapshot(),
    prisma.executiveBriefing.findMany({
      where: {
        briefingDate: {
          gte: cutoff,
        },
      },
      orderBy: {
        briefingDate: "desc",
      },
    }),
    prisma.creatorLead.findMany(),
    prisma.quarterlyGoal.findMany(),
    prisma.strategicInitiative.findMany({
      select: {
        id: true,
        goalId: true,
        status: true,
        progress: true,
      },
    }),
  ])

  const monthlyReview = buildExecutiveMonthlyReview(briefings)
  const weeklyReview = buildExecutiveWeeklyReview(briefings.slice(0, 7))
  const forecast = buildExecutiveForecast({
    snapshot,
    briefings,
    monthlyReview,
  })
  const recommendations = buildExecutiveRecommendations(snapshot)
  const briefing = buildDailyBriefing(snapshot, recommendations)
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
  const initiativePerformance = calculateInitiativePerformance(
    initiatives,
    goals
  )

  return {
    cycleType,
    snapshot,
    forecast,
    strategicPlan,
    goals,
    initiativePerformance,
    recommendations,
    briefing,
  }
}

export const PLANNING_CYCLE_STATUSES = [
  "draft",
  "reviewed",
  "approved",
  "archived",
] as const

export type PlanningCycleStatus = (typeof PLANNING_CYCLE_STATUSES)[number]

export function isPlanningCycleStatus(value: string): value is PlanningCycleStatus {
  return PLANNING_CYCLE_STATUSES.includes(value as PlanningCycleStatus)
}
