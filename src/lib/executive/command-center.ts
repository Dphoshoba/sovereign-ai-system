import { serializeDecision } from "@/lib/executive/decision-memory"
import { buildDecisionOutcomeSummary } from "@/lib/executive/decision-outcomes"
import {
  buildExecutiveForecast,
} from "@/lib/executive/forecast"
import {
  calculateInitiativePerformance,
  type InitiativePerformance,
} from "@/lib/executive/initiative-performance"
import { buildKnowledgeGraphIntelligence } from "@/lib/executive/knowledge-graph-intelligence"
import {
  buildExecutiveLearning,
  serializeExecutiveLesson,
} from "@/lib/executive/learning-system"
import {
  buildExecutiveMonthlyReview,
  getMonthlyReviewDateCutoff,
} from "@/lib/executive/monthly-review"
import {
  buildPerformanceScorecard,
  getCurrentQuarter,
} from "@/lib/executive/quarterly-goals"
import type { ExecutiveQuarterlyReview } from "@/lib/executive/quarterly-review"
import { buildExecutiveRecommendations } from "@/lib/executive/recommendations"
import {
  buildStrategicPlan,
} from "@/lib/executive/strategic-plan"
import { buildExecutiveWeeklyReview } from "@/lib/executive/weekly-review"
import {
  computeOverallHealthScore,
  getExecutivePlatformSnapshot,
  type ExecutivePlatformSnapshot,
} from "@/lib/executive/platform-snapshot"
import { prisma } from "@/lib/prisma"

export type ExecutiveStatus =
  | "Excellent"
  | "Good"
  | "Needs Attention"
  | "Critical"

export type CommandCenterRevenue = {
  wonRevenue: number
  openPipeline: number
  totalInvoiced: number
  totalPaid: number
  outstandingRevenue: number
  overdueInvoices: number
  forecast: string
}

export type CommandCenterGrowth = {
  totalSubscribers: number
  activeSubscribers: number
  monthlySubscribers: number
  growthRate: number
  leadMagnetCount: number
  topLeadMagnet: string | null
  forecast: string
}

export type CommandCenterDelivery = {
  activeClients: number
  activeProjects: number
  openTasks: number
  overdueTasks: number
  deliveryHealthScore: number
  atRiskProjects: number
  forecast: string
}

export type CommandCenterContent = {
  publishedArticles: number
  drafts: number
  reviewRequired: number
  scheduled: number
}

export type CommandCenterBoardroom = {
  sessionCount: number
  latestHealthScore: number | null
  latestSummary: string | null
  topPriorities: string[]
  majorRisks: string[]
  majorOpportunities: string[]
  latestSessionAt: string | null
}

export type CommandCenterLearning = {
  totalLessons: number
  averageEffectiveness: number
  strongestImpactArea: string | null
  weakestImpactArea: string | null
  recommendedPracticeCount: number
  topPractices: string[]
}

export type CommandCenterStrategy = {
  strategicHealth: number
  planningPeriod: string
  executiveSummary: string
  quarterlyReviewQuarter: string | null
  quarterlyReviewYear: number | null
  quarterlyReviewHealth: number | null
  proposedAdjustments: number
  approvedAdjustments: number
  forecastConfidence: string
  forecastOutlook: string
  knowledgeInsights: string[]
}

export type CommandCenterExecution = {
  quarter: string
  year: number
  totalGoals: number
  completedGoals: number
  goalCompletionRate: number
  totalInitiatives: number
  completedInitiatives: number
  blockedInitiatives: number
  initiativeCompletionRate: number
  initiativeHealth: InitiativePerformance["initiativeHealth"]
  latestPlanningCycleSummary: string | null
  latestPlanningCycleHealth: number | null
}

export type CommandCenterRecentDecision = {
  id: string
  title: string
  status: string
  effectiveness: number | null
  impactArea: string | null
  createdAt: string
}

export type CommandCenterRecentAdjustment = {
  id: string
  title: string
  status: string
  priority: string
  category: string | null
  recommendation: string | null
  createdAt: string
}

export type CommandCenterRecentSimulation = {
  id: string
  title: string
  scenario: string
  status: string
  impactScore: number | null
  createdAt: string
}

export type ExecutiveCommandCenter = {
  healthScore: number
  executiveStatus: ExecutiveStatus
  alerts: string[]
  priorities: string[]
  opportunities: string[]
  revenue: CommandCenterRevenue
  growth: CommandCenterGrowth
  delivery: CommandCenterDelivery
  content: CommandCenterContent
  boardroom: CommandCenterBoardroom
  learning: CommandCenterLearning
  strategy: CommandCenterStrategy
  execution: CommandCenterExecution
  recentDecisions: CommandCenterRecentDecision[]
  recentAdjustments: CommandCenterRecentAdjustment[]
  recentSimulations: CommandCenterRecentSimulation[]
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

export function getExecutiveStatus(score: number): ExecutiveStatus {
  if (score >= 85) {
    return "Excellent"
  }

  if (score >= 70) {
    return "Good"
  }

  if (score >= 50) {
    return "Needs Attention"
  }

  return "Critical"
}

function resolveLatestHealthScore(
  candidates: { score: number; updatedAt: Date }[],
  fallback: number
) {
  if (candidates.length === 0) {
    return fallback
  }

  candidates.sort(
    (left, right) => right.updatedAt.getTime() - left.updatedAt.getTime()
  )

  return candidates[0].score
}

function buildSnapshotAlerts(snapshot: ExecutivePlatformSnapshot) {
  const alerts: string[] = []

  if (snapshot.reviewRequiredCount > 0) {
    alerts.push(
      `${snapshot.reviewRequiredCount} article${snapshot.reviewRequiredCount === 1 ? "" : "s"} require editorial review`
    )
  }

  if (snapshot.outstandingRevenue > 0) {
    alerts.push(
      `Outstanding client revenue: AUD ${snapshot.outstandingRevenue.toLocaleString("en-AU")}`
    )
  }

  if (snapshot.overdueInvoices > 0) {
    alerts.push(
      `${snapshot.overdueInvoices} overdue invoice${snapshot.overdueInvoices === 1 ? "" : "s"} need follow-up`
    )
  }

  if (snapshot.overdueTasks > 0) {
    alerts.push(
      `${snapshot.overdueTasks} client delivery task${snapshot.overdueTasks === 1 ? "" : "s"} overdue`
    )
  }

  if (snapshot.deliveryHealthScore < 70) {
    alerts.push(
      `Delivery health score is ${snapshot.deliveryHealthScore}/100 — client delivery needs attention`
    )
  }

  if (snapshot.atRiskProjects.length > 0) {
    alerts.push(
      `${snapshot.atRiskProjects.length} client project${snapshot.atRiskProjects.length === 1 ? "" : "s"} at risk`
    )
  }

  return alerts
}

function buildSnapshotOpportunities(snapshot: ExecutivePlatformSnapshot) {
  const opportunities: string[] = []

  if (snapshot.growthRate > 0) {
    opportunities.push(
      `Subscriber growth rate is ${snapshot.growthRate}% this month — promote lead magnets`
    )
  }

  if (snapshot.topLeadMagnet) {
    opportunities.push(
      `Top lead magnet "${snapshot.topLeadMagnet}" is performing — create similar offers`
    )
  }

  if (snapshot.wonLeads > 0) {
    opportunities.push(
      `${snapshot.wonLeads} won lead${snapshot.wonLeads === 1 ? "" : "s"} — convert into client delivery projects`
    )
  }

  if (snapshot.openPipeline > 0) {
    opportunities.push(
      `Open pipeline value AUD ${snapshot.openPipeline.toLocaleString("en-AU")} — advance active deals`
    )
  }

  if (snapshot.recentlyPaidInvoiceCount > 0) {
    opportunities.push(
      `${snapshot.recentlyPaidInvoiceCount} recent paid invoice${snapshot.recentlyPaidInvoiceCount === 1 ? "" : "s"} — consider upsell proposals`
    )
  }

  if (snapshot.publishedArticles > 0 && snapshot.reviewRequiredCount === 0) {
    opportunities.push(
      `${snapshot.publishedArticles} published article${snapshot.publishedArticles === 1 ? "" : "s"} — expand distribution and SEO`
    )
  }

  return opportunities
}

function buildAlerts(params: {
  snapshot: ExecutivePlatformSnapshot
  monthlyReviewRisks: string[]
  strategicPlanRisks: string[]
  boardroomRisks: string[]
  forecastRisks: string[]
  knowledgeRiskInsights: string[]
  quarterlyLosses: string[]
  blockedInitiatives: number
  decisionsNeedingFollowUp: number
}) {
  const alerts = uniqueStrings([
    ...buildSnapshotAlerts(params.snapshot),
    ...params.monthlyReviewRisks,
    ...params.strategicPlanRisks,
    ...params.boardroomRisks,
    ...params.forecastRisks,
    ...params.knowledgeRiskInsights,
    ...params.quarterlyLosses.slice(0, 3),
    ...(params.blockedInitiatives > 0
      ? [
          `${params.blockedInitiatives} strategic initiative${params.blockedInitiatives === 1 ? "" : "s"} blocked`,
        ]
      : []),
    ...(params.decisionsNeedingFollowUp > 0
      ? [
          `${params.decisionsNeedingFollowUp} executive decision${params.decisionsNeedingFollowUp === 1 ? "" : "s"} need follow-up`,
        ]
      : []),
  ])

  return alerts.slice(0, 12)
}

function buildPriorities(params: {
  boardroomPriorities: string[]
  strategicPlanPriorities: string[]
  quarterlyRecommendations: string[]
  adjustmentRecommendations: string[]
  snapshotPriorities: string[]
}) {
  return uniqueStrings([
    ...params.boardroomPriorities,
    ...params.strategicPlanPriorities,
    ...params.quarterlyRecommendations,
    ...params.adjustmentRecommendations,
    ...params.snapshotPriorities,
  ]).slice(0, 10)
}

function buildSnapshotPriorities(snapshot: ExecutivePlatformSnapshot) {
  const priorities: string[] = []

  if (snapshot.reviewRequiredCount > 0) {
    priorities.push("Clear the editorial review queue")
  }

  if (snapshot.proposalReadyLeads.length > 0) {
    priorities.push(
      `Send proposals to ${snapshot.proposalReadyLeads.length} proposal-ready lead${snapshot.proposalReadyLeads.length === 1 ? "" : "s"}`
    )
  }

  if (snapshot.hotLeads.length > 0) {
    priorities.push(
      `Follow up with ${snapshot.hotLeads.length} hot CRM lead${snapshot.hotLeads.length === 1 ? "" : "s"}`
    )
  }

  return priorities
}

function buildOpportunities(params: {
  snapshot: ExecutivePlatformSnapshot
  forecastOpportunities: string[]
  strategicPlanOpportunities: string[]
  boardroomOpportunities: string[]
  quarterlyOpportunities: string[]
  knowledgeOpportunityInsights: string[]
}) {
  return uniqueStrings([
    ...params.forecastOpportunities,
    ...params.strategicPlanOpportunities,
    ...params.boardroomOpportunities,
    ...params.quarterlyOpportunities,
    ...buildSnapshotOpportunities(params.snapshot),
    ...params.knowledgeOpportunityInsights,
  ]).slice(0, 12)
}

function parseBoardroomSession(session: {
  healthScore: number | null
  summary: string | null
  decisions: unknown
  createdAt: Date
}) {
  const decisions = (session.decisions ?? {}) as {
    topPriorities?: string[]
    majorRisks?: string[]
    majorOpportunities?: string[]
  }

  return {
    healthScore: session.healthScore,
    summary: session.summary,
    topPriorities: Array.isArray(decisions.topPriorities)
      ? decisions.topPriorities
      : [],
    majorRisks: Array.isArray(decisions.majorRisks) ? decisions.majorRisks : [],
    majorOpportunities: Array.isArray(decisions.majorOpportunities)
      ? decisions.majorOpportunities
      : [],
    createdAt: session.createdAt,
  }
}

export async function buildExecutiveCommandCenter(): Promise<ExecutiveCommandCenter> {
  const cutoff = getMonthlyReviewDateCutoff()
  const { quarter, year } = getCurrentQuarter()

  const [
    snapshot,
    briefings,
    leads,
    goals,
    initiatives,
    latestQuarterlyReviewRecord,
    latestBoardroomSession,
    latestPlanningCycle,
    boardroomSessionCount,
    allExecutiveDecisions,
    executiveLessons,
    strategyAdjustments,
    strategicScenarios,
    knowledgeIntelligence,
  ] = await Promise.all([
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
    prisma.quarterlyGoal.findMany({
      where: { quarter, year },
    }),
    prisma.strategicInitiative.findMany({
      select: {
        id: true,
        goalId: true,
        status: true,
        progress: true,
      },
    }),
    prisma.executiveQuarterlyReview.findFirst({
      orderBy: [{ year: "desc" }, { quarter: "desc" }],
    }),
    prisma.executiveBoardroomSession.findFirst({
      orderBy: { createdAt: "desc" },
    }),
    prisma.planningCycle.findFirst({
      orderBy: { createdAt: "desc" },
    }),
    prisma.executiveBoardroomSession.count(),
    prisma.executiveDecision.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.executiveLesson.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.strategyAdjustment.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.strategicScenario.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    buildKnowledgeGraphIntelligence(),
  ])

  const monthlyReview = buildExecutiveMonthlyReview(briefings)
  const weeklyReview = buildExecutiveWeeklyReview(briefings.slice(0, 7))
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

  const serializedDecisions = allExecutiveDecisions.map(serializeDecision)
  const decisionSummary = buildDecisionOutcomeSummary(serializedDecisions)
  const learning = buildExecutiveLearning(
    serializedDecisions,
    executiveLessons.map(serializeExecutiveLesson)
  )

  const goalRecords = goals.map((goal) => ({
    id: goal.id,
    title: goal.title,
    status: goal.status,
    progress: goal.progress,
    targetValue: goal.targetValue,
    currentValue: goal.currentValue,
  }))
  const goalScorecard = buildPerformanceScorecard(goals)
  const initiativePerformance = calculateInitiativePerformance(
    initiatives,
    goalRecords
  )

  const quarterlyReview =
    (latestQuarterlyReviewRecord?.reviewJson as ExecutiveQuarterlyReview | null) ??
    null

  const parsedBoardroom = latestBoardroomSession
    ? parseBoardroomSession(latestBoardroomSession)
    : null

  const healthCandidates: { score: number; updatedAt: Date }[] = []

  if (latestQuarterlyReviewRecord?.healthScore != null) {
    healthCandidates.push({
      score: latestQuarterlyReviewRecord.healthScore,
      updatedAt: latestQuarterlyReviewRecord.createdAt,
    })
  }

  if (parsedBoardroom?.healthScore != null) {
    healthCandidates.push({
      score: parsedBoardroom.healthScore,
      updatedAt: parsedBoardroom.createdAt,
    })
  }

  if (latestPlanningCycle?.healthScore != null) {
    healthCandidates.push({
      score: latestPlanningCycle.healthScore,
      updatedAt: latestPlanningCycle.updatedAt,
    })
  }

  if (briefings[0]) {
    healthCandidates.push({
      score: briefings[0].healthScore,
      updatedAt: briefings[0].briefingDate,
    })
  }

  const healthScore = resolveLatestHealthScore(
    healthCandidates,
    computeOverallHealthScore(snapshot)
  )

  const adjustmentRecommendations = await prisma.strategyAdjustment.findMany({
    where: {
      status: {
        in: ["proposed", "approved"],
      },
    },
    select: {
      recommendation: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const [proposedAdjustments, approvedAdjustments] = await Promise.all([
    prisma.strategyAdjustment.count({ where: { status: "proposed" } }),
    prisma.strategyAdjustment.count({ where: { status: "approved" } }),
  ])

  const alerts = buildAlerts({
    snapshot,
    monthlyReviewRisks: monthlyReview.risks,
    strategicPlanRisks: strategicPlan.risks,
    boardroomRisks: parsedBoardroom?.majorRisks ?? [],
    forecastRisks: forecast.riskForecast,
    knowledgeRiskInsights: knowledgeIntelligence.riskAreas.map(
      (item) => item.summary ?? `${item.title} flagged as risk area`
    ),
    quarterlyLosses: quarterlyReview?.losses ?? [],
    blockedInitiatives: initiativePerformance.blockedInitiatives,
    decisionsNeedingFollowUp: decisionSummary.decisionsNeedingFollowUp,
  })

  const priorities = buildPriorities({
    boardroomPriorities: parsedBoardroom?.topPriorities ?? [],
    strategicPlanPriorities: strategicPlan.priorities,
    quarterlyRecommendations: quarterlyReview?.recommendations ?? [],
    adjustmentRecommendations: adjustmentRecommendations
      .map((item) => item.recommendation)
      .filter((item): item is string => Boolean(item)),
    snapshotPriorities: buildSnapshotPriorities(snapshot),
  })

  const opportunities = buildOpportunities({
    snapshot,
    forecastOpportunities: forecast.opportunityForecast,
    strategicPlanOpportunities: strategicPlan.opportunities,
    boardroomOpportunities: parsedBoardroom?.majorOpportunities ?? [],
    quarterlyOpportunities: quarterlyReview?.opportunities ?? [],
    knowledgeOpportunityInsights: knowledgeIntelligence.opportunityAreas.map(
      (item) => item.summary ?? `${item.title} flagged as opportunity area`
    ),
  })

  return {
    healthScore,
    executiveStatus: getExecutiveStatus(healthScore),
    alerts,
    priorities,
    opportunities,
    revenue: {
      wonRevenue: snapshot.wonRevenue,
      openPipeline: snapshot.openPipeline,
      totalInvoiced: snapshot.totalInvoiced,
      totalPaid: snapshot.totalPaid,
      outstandingRevenue: snapshot.outstandingRevenue,
      overdueInvoices: snapshot.overdueInvoices,
      forecast: forecast.revenueForecast,
    },
    growth: {
      totalSubscribers: snapshot.totalSubscribers,
      activeSubscribers: snapshot.activeSubscribers,
      monthlySubscribers: snapshot.monthlySubscribers,
      growthRate: snapshot.growthRate,
      leadMagnetCount: snapshot.leadMagnetCount,
      topLeadMagnet: snapshot.topLeadMagnet,
      forecast: forecast.growthForecast,
    },
    delivery: {
      activeClients: snapshot.activeClients,
      activeProjects: snapshot.activeProjects,
      openTasks: snapshot.openTasks,
      overdueTasks: snapshot.overdueTasks,
      deliveryHealthScore: snapshot.deliveryHealthScore,
      atRiskProjects: snapshot.atRiskProjects.length,
      forecast: forecast.deliveryForecast,
    },
    content: {
      publishedArticles: snapshot.publishedArticles,
      drafts: snapshot.draftCount,
      reviewRequired: snapshot.reviewRequiredCount,
      scheduled: snapshot.scheduledCount,
    },
    boardroom: {
      sessionCount: boardroomSessionCount,
      latestHealthScore: parsedBoardroom?.healthScore ?? null,
      latestSummary: parsedBoardroom?.summary ?? null,
      topPriorities: parsedBoardroom?.topPriorities ?? [],
      majorRisks: parsedBoardroom?.majorRisks ?? [],
      majorOpportunities: parsedBoardroom?.majorOpportunities ?? [],
      latestSessionAt: parsedBoardroom?.createdAt.toISOString() ?? null,
    },
    learning: {
      totalLessons: learning.totalLessons,
      averageEffectiveness: decisionSummary.averageEffectiveness,
      strongestImpactArea: decisionSummary.strongestImpactArea,
      weakestImpactArea: decisionSummary.weakestImpactArea,
      recommendedPracticeCount: learning.recommendedPractices.length,
      topPractices: learning.recommendedPractices
        .slice(0, 3)
        .map((item) => item.title),
    },
    strategy: {
      strategicHealth: strategicPlan.strategicHealth,
      planningPeriod: strategicPlan.planningPeriod,
      executiveSummary: strategicPlan.executiveSummary,
      quarterlyReviewQuarter: latestQuarterlyReviewRecord?.quarter ?? null,
      quarterlyReviewYear: latestQuarterlyReviewRecord?.year ?? null,
      quarterlyReviewHealth: latestQuarterlyReviewRecord?.healthScore ?? null,
      proposedAdjustments,
      approvedAdjustments,
      forecastConfidence: forecast.confidence,
      forecastOutlook: forecast.executiveOutlook,
      knowledgeInsights: knowledgeIntelligence.insights.slice(0, 5),
    },
    execution: {
      quarter,
      year,
      totalGoals: goalScorecard.totalGoals,
      completedGoals: goalScorecard.completedGoals,
      goalCompletionRate: goalScorecard.completionRate,
      totalInitiatives: initiativePerformance.totalInitiatives,
      completedInitiatives: initiativePerformance.completedInitiatives,
      blockedInitiatives: initiativePerformance.blockedInitiatives,
      initiativeCompletionRate: initiativePerformance.completionRate,
      initiativeHealth: initiativePerformance.initiativeHealth,
      latestPlanningCycleSummary: latestPlanningCycle?.summary ?? null,
      latestPlanningCycleHealth: latestPlanningCycle?.healthScore ?? null,
    },
    recentDecisions: allExecutiveDecisions.slice(0, 5).map((decision) => ({
      id: decision.id,
      title: decision.title,
      status: decision.status,
      effectiveness: decision.effectiveness,
      impactArea: decision.impactArea,
      createdAt: decision.createdAt.toISOString(),
    })),
    recentAdjustments: strategyAdjustments.map((adjustment) => ({
      id: adjustment.id,
      title: adjustment.title,
      status: adjustment.status,
      priority: adjustment.priority,
      category: adjustment.category,
      recommendation: adjustment.recommendation,
      createdAt: adjustment.createdAt.toISOString(),
    })),
    recentSimulations: strategicScenarios.map((scenario) => ({
      id: scenario.id,
      title: scenario.title,
      scenario: scenario.scenario,
      status: scenario.status,
      impactScore: scenario.impactScore,
      createdAt: scenario.createdAt.toISOString(),
    })),
  }
}
