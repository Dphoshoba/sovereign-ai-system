import type { ExecutivePlatformSnapshot } from "@/lib/executive/platform-snapshot"
import {
  computeOverallHealthScore,
  getExecutivePlatformSnapshot,
} from "@/lib/executive/platform-snapshot"
import type {
  ExecutiveRecommendation,
  ExecutiveRecommendations,
} from "@/lib/executive/recommendations"
import { buildExecutiveRecommendations } from "@/lib/executive/recommendations"

export type DailyBriefing = {
  date: string
  healthScore: number
  openingSummary: string
  urgentCount: number
  todayCount: number
  revenueSnapshot: {
    totalPipelineValue: number
    wonRevenue: number
    openPipeline: number
    totalInvoiced: number
    totalPaid: number
    outstandingRevenue: number
  }
  growthSnapshot: {
    totalSubscribers: number
    activeSubscribers: number
    monthlySubscribers: number
    growthRate: number
    leadMagnetSubscribers: number
    topLeadMagnet: string | null
  }
  contentSnapshot: {
    publishedArticles: number
    drafts: number
    reviewRequired: number
    scheduled: number
  }
  deliverySnapshot: {
    activeClients: number
    activeProjects: number
    completedProjects: number
    openTasks: number
    doneTasks: number
    overdueTasks: number
    deliveryHealthScore: number
    totalProjectValue: number
  }
  topPriorities: string[]
  risks: string[]
  wins: string[]
  recommendedActions: string[]
}

function formatAud(value: number) {
  return `AUD ${value.toLocaleString("en-AU")}`
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function collectRecommendedActions(
  recommendations: ExecutiveRecommendations
): string[] {
  const pool: ExecutiveRecommendation[] = [
    ...recommendations.urgent,
    ...recommendations.today,
    ...recommendations.thisWeek,
    ...recommendations.revenue,
    ...recommendations.delivery,
    ...recommendations.content,
    ...recommendations.growth,
  ]

  const actions = uniqueStrings(pool.map((item) => item.suggestedAction))
  return actions.slice(0, 7)
}

export function buildDailyBriefing(
  snapshot: ExecutivePlatformSnapshot,
  recommendations: ExecutiveRecommendations
): DailyBriefing {
  const healthScore = computeOverallHealthScore(snapshot)
  const urgentCount = recommendations.urgent.length
  const todayCount = recommendations.today.length

  const stabilityNote =
    urgentCount > 0
      ? `Urgent attention is needed across ${urgentCount} area${urgentCount === 1 ? "" : "s"}.`
      : "Operations appear stable — focus on growth and delivery momentum."

  const openingSummary = `Today's Echoes & Visions briefing. Overall business health score is ${healthScore}/100. ${stabilityNote}`

  const topPriorities = uniqueStrings(
    [...recommendations.urgent, ...recommendations.today].map((item) => item.title)
  ).slice(0, 8)

  const risks: string[] = []

  if (snapshot.overdueTasks > 0) {
    risks.push(
      `${snapshot.overdueTasks} overdue client delivery task${snapshot.overdueTasks === 1 ? "" : "s"}`
    )
  }

  if (snapshot.overdueInvoices > 0) {
    risks.push(
      `${snapshot.overdueInvoices} overdue invoice${snapshot.overdueInvoices === 1 ? "" : "s"}`
    )
  }

  if (snapshot.reviewRequiredCount > 0) {
    risks.push(
      `${snapshot.reviewRequiredCount} article${snapshot.reviewRequiredCount === 1 ? "" : "s"} in the review backlog`
    )
  }

  if (snapshot.growthRate === 0 || snapshot.totalSubscribers < 50) {
    risks.push(
      snapshot.totalSubscribers < 50
        ? `Subscriber base is small (${snapshot.totalSubscribers} total)`
        : "No subscriber growth recorded this month"
    )
  }

  if (snapshot.openPipeline === 0) {
    risks.push("Sales pipeline is empty — no open deal value")
  }

  const wins: string[] = []

  if (snapshot.wonRevenue > 0) {
    wins.push(`Won revenue: ${formatAud(snapshot.wonRevenue)}`)
  }

  if (snapshot.activeClients > 0) {
    wins.push(`${snapshot.activeClients} active client${snapshot.activeClients === 1 ? "" : "s"}`)
  }

  if (snapshot.publishedArticles > 0) {
    wins.push(
      `${snapshot.publishedArticles} published article${snapshot.publishedArticles === 1 ? "" : "s"}`
    )
  }

  if (snapshot.totalSubscribers > 0) {
    wins.push(
      `${snapshot.totalSubscribers} subscriber${snapshot.totalSubscribers === 1 ? "" : "s"} on the list`
    )
  }

  if (snapshot.completedProjects > 0) {
    wins.push(
      `${snapshot.completedProjects} completed client project${snapshot.completedProjects === 1 ? "" : "s"}`
    )
  }

  if (wins.length === 0) {
    wins.push("Core business systems are live and tracking operational data")
  }

  let recommendedActions = collectRecommendedActions(recommendations)

  if (recommendedActions.length < 3) {
    recommendedActions = uniqueStrings([
      ...recommendedActions,
      "Review executive overview metrics",
      "Check delivery dashboard for project health",
      "Follow up on creator leads pipeline",
    ]).slice(0, 7)
  }

  return {
    date: new Date().toLocaleDateString("en-AU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    healthScore,
    openingSummary,
    urgentCount,
    todayCount,
    revenueSnapshot: {
      totalPipelineValue: snapshot.totalPipelineValue,
      wonRevenue: snapshot.wonRevenue,
      openPipeline: snapshot.openPipeline,
      totalInvoiced: snapshot.totalInvoiced,
      totalPaid: snapshot.totalPaid,
      outstandingRevenue: snapshot.outstandingRevenue,
    },
    growthSnapshot: {
      totalSubscribers: snapshot.totalSubscribers,
      activeSubscribers: snapshot.activeSubscribers,
      monthlySubscribers: snapshot.monthlySubscribers,
      growthRate: snapshot.growthRate,
      leadMagnetSubscribers: snapshot.leadMagnetSubscribers,
      topLeadMagnet: snapshot.topLeadMagnet,
    },
    contentSnapshot: {
      publishedArticles: snapshot.publishedArticles,
      drafts: snapshot.draftCount,
      reviewRequired: snapshot.reviewRequiredCount,
      scheduled: snapshot.scheduledCount,
    },
    deliverySnapshot: {
      activeClients: snapshot.activeClients,
      activeProjects: snapshot.activeProjects,
      completedProjects: snapshot.completedProjects,
      openTasks: snapshot.openTasks,
      doneTasks: snapshot.doneTasks,
      overdueTasks: snapshot.overdueTasks,
      deliveryHealthScore: snapshot.deliveryHealthScore,
      totalProjectValue: snapshot.totalProjectValue,
    },
    topPriorities,
    risks,
    wins,
    recommendedActions,
  }
}

export function getBriefingDateForToday(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export async function generateDailyBriefing(): Promise<DailyBriefing> {
  const snapshot = await getExecutivePlatformSnapshot()
  const recommendations = buildExecutiveRecommendations(snapshot)
  return buildDailyBriefing(snapshot, recommendations)
}
