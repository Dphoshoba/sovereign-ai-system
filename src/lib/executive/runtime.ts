import {
  buildExecutiveCommandCenter,
  getExecutiveStatus,
  type ExecutiveStatus,
} from "@/lib/executive/command-center"
import {
  buildPlanningCycle,
  loadPlanningCycleInputs,
} from "@/lib/executive/planning-cycle"
import { getCurrentQuarter } from "@/lib/executive/quarterly-goals"
import { prisma } from "@/lib/prisma"

export type SovereignRuntimeAction = {
  title: string
  description: string
  link: string
  actionType: string
}

export type SovereignRuntimeSystem = {
  id: string
  name: string
  status: "active" | "available" | "needs-attention" | "idle"
  summary: string
  link: string
  healthScore: number | null
}

export type SovereignRuntimeResult = {
  runtimeHealth: number
  executiveStatus: ExecutiveStatus
  activeRisks: string[]
  activeOpportunities: string[]
  priorities: string[]
  recommendations: string[]
  nextActions: SovereignRuntimeAction[]
  systems: SovereignRuntimeSystem[]
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function buildPriorities(params: {
  commandPriorities: string[]
  boardroomPriorities: string[]
  quarterlyRecommendations: string[]
  adjustmentRecommendations: string[]
  planningCycleActions: string[]
}) {
  return uniqueStrings([
    ...params.boardroomPriorities,
    ...params.quarterlyRecommendations,
    ...params.adjustmentRecommendations,
    ...params.planningCycleActions,
    ...params.commandPriorities,
  ]).slice(0, 12)
}

function buildRecommendations(params: {
  strategicPlanPriorities: string[]
  forecastFocusAreas: string[]
  adjustmentRecommendations: string[]
  knowledgeRecommendations: string[]
  planningCycleRecommendations: string[]
  learningPractices: string[]
}) {
  return uniqueStrings([
    ...params.strategicPlanPriorities.slice(0, 3),
    ...params.forecastFocusAreas.slice(0, 3),
    ...params.planningCycleRecommendations.slice(0, 2),
    ...params.adjustmentRecommendations.slice(0, 2),
    ...params.knowledgeRecommendations.slice(0, 2),
    ...params.learningPractices.slice(0, 2),
  ]).slice(0, 10)
}

function buildNextActions(params: {
  overdueTasks: number
  outstandingRevenue: number
  overdueInvoices: number
  reviewRequiredCount: number
  blockedInitiatives: number
  hasQuarterlyReview: boolean
  boardroomSessionCount: number
  hasRecentPlanningCycle: boolean
  proposedAdjustments: number
  decisionsNeedingFollowUp: number
}) {
  const actions: SovereignRuntimeAction[] = []

  if (params.overdueTasks > 0) {
    actions.push({
      title: "Review overdue tasks",
      description: `${params.overdueTasks} delivery task${params.overdueTasks === 1 ? "" : "s"} overdue — review in the delivery dashboard.`,
      link: "/admin/delivery",
      actionType: "review-overdue-tasks",
    })
  }

  if (params.outstandingRevenue > 0 || params.overdueInvoices > 0) {
    actions.push({
      title: "Review outstanding invoices",
      description: `Outstanding revenue AUD ${params.outstandingRevenue.toLocaleString("en-AU")}${params.overdueInvoices > 0 ? ` with ${params.overdueInvoices} overdue invoice${params.overdueInvoices === 1 ? "" : "s"}` : ""}.`,
      link: "/admin/invoices",
      actionType: "review-outstanding-invoices",
    })
  }

  if (params.reviewRequiredCount > 0) {
    actions.push({
      title: "Review editorial queue",
      description: `${params.reviewRequiredCount} article${params.reviewRequiredCount === 1 ? "" : "s"} waiting for editorial review.`,
      link: "/admin/articles",
      actionType: "review-editorial-queue",
    })
  }

  if (!params.hasQuarterlyReview) {
    actions.push({
      title: "Generate quarterly review",
      description: "No quarterly review exists for the current quarter — generate an autonomous review.",
      link: "/admin/quarterly-review",
      actionType: "generate-quarterly-review",
    })
  }

  if (params.boardroomSessionCount === 0) {
    actions.push({
      title: "Run boardroom session",
      description: "No boardroom sessions recorded — run a virtual executive boardroom session.",
      link: "/admin/boardroom",
      actionType: "run-boardroom-session",
    })
  }

  if (!params.hasRecentPlanningCycle) {
    actions.push({
      title: "Generate planning cycle",
      description: "No recent planning cycle found — generate a weekly planning cycle review.",
      link: "/admin/planning-cycles",
      actionType: "generate-planning-cycle",
    })
  }

  actions.push({
    title: "Sync quarterly goals",
    description: "Sync quarterly goal progress from linked strategic initiatives.",
    link: "/admin/goals",
    actionType: "sync-goals",
  })

  if (params.blockedInitiatives > 0) {
    actions.push({
      title: "Review blocked initiatives",
      description: `${params.blockedInitiatives} strategic initiative${params.blockedInitiatives === 1 ? "" : "s"} blocked in the execution engine.`,
      link: "/admin/execution",
      actionType: "review-blocked-initiatives",
    })
  }

  if (params.proposedAdjustments > 0) {
    actions.push({
      title: "Review strategy adjustments",
      description: `${params.proposedAdjustments} proposed strategy adjustment${params.proposedAdjustments === 1 ? "" : "s"} awaiting approval.`,
      link: "/admin/strategy-adjustments",
      actionType: "review-strategy-adjustments",
    })
  }

  if (params.decisionsNeedingFollowUp > 0) {
    actions.push({
      title: "Review decision follow-ups",
      description: `${params.decisionsNeedingFollowUp} executive decision${params.decisionsNeedingFollowUp === 1 ? "" : "s"} require follow-up.`,
      link: "/admin/decision-outcomes",
      actionType: "review-decision-follow-ups",
    })
  }

  actions.push({
    title: "Open command center",
    description: "Review the unified executive command center cockpit.",
    link: "/admin/command-center",
    actionType: "open-command-center",
  })

  const seen = new Set<string>()

  return actions.filter((action) => {
    const key = action.actionType
    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function buildConnectedSystems(params: {
  forecastConfidence: string
  forecastHealth: number
  boardroomSessionCount: number
  boardroomHealth: number | null
  learningLessons: number
  learningEffectiveness: number
  knowledgeNodes: number
  knowledgeEdges: number
  planningCycleHealth: number | null
  planningCycleSummary: string | null
  strategicHealth: number
  quarterlyReviewHealth: number | null
  proposedAdjustments: number
  goalCompletionRate: number
  initiativeHealth: string
  blockedInitiatives: number
}): SovereignRuntimeSystem[] {
  const forecastStatus =
    params.forecastConfidence === "High"
      ? "active"
      : params.forecastConfidence === "Medium"
        ? "available"
        : "needs-attention"

  const boardroomStatus =
    params.boardroomSessionCount === 0
      ? "needs-attention"
      : params.boardroomHealth !== null && params.boardroomHealth < 70
        ? "needs-attention"
        : "active"

  const learningStatus =
    params.learningLessons === 0
      ? "idle"
      : params.learningEffectiveness >= 70
        ? "active"
        : "available"

  const knowledgeStatus =
    params.knowledgeNodes === 0
      ? "idle"
      : params.knowledgeEdges > 0
        ? "active"
        : "available"

  const planningStatus = params.planningCycleHealth
    ? params.planningCycleHealth >= 70
      ? "active"
      : "needs-attention"
    : "idle"

  const strategyStatus =
    params.proposedAdjustments > 0 || params.quarterlyReviewHealth === null
      ? "needs-attention"
      : params.strategicHealth >= 70
        ? "active"
        : "available"

  const executionStatus =
    params.blockedInitiatives > 0
      ? "needs-attention"
      : params.initiativeHealth === "Excellent" || params.initiativeHealth === "Good"
        ? "active"
        : "available"

  return [
    {
      id: "forecast",
      name: "Forecast",
      status: forecastStatus,
      summary: `${params.forecastConfidence} confidence — health ${params.forecastHealth}/100`,
      link: "/admin/executive-forecast",
      healthScore: params.forecastHealth,
    },
    {
      id: "boardroom",
      name: "Boardroom",
      status: boardroomStatus,
      summary: `${params.boardroomSessionCount} session${params.boardroomSessionCount === 1 ? "" : "s"} recorded`,
      link: "/admin/boardroom",
      healthScore: params.boardroomHealth,
    },
    {
      id: "learning",
      name: "Learning",
      status: learningStatus,
      summary: `${params.learningLessons} lesson${params.learningLessons === 1 ? "" : "s"} — avg effectiveness ${params.learningEffectiveness}/100`,
      link: "/admin/executive-learning",
      healthScore: params.learningEffectiveness,
    },
    {
      id: "knowledge-graph",
      name: "Knowledge Graph",
      status: knowledgeStatus,
      summary: `${params.knowledgeNodes} nodes, ${params.knowledgeEdges} edges`,
      link: "/admin/knowledge-graph-intelligence",
      healthScore: null,
    },
    {
      id: "planning",
      name: "Planning",
      status: planningStatus,
      summary:
        params.planningCycleSummary?.split(".")[0] ??
        "No recent planning cycle generated",
      link: "/admin/planning-cycles",
      healthScore: params.planningCycleHealth,
    },
    {
      id: "strategy",
      name: "Strategy",
      status: strategyStatus,
      summary: `Strategic health ${params.strategicHealth}/100 — ${params.proposedAdjustments} proposed adjustment${params.proposedAdjustments === 1 ? "" : "s"}`,
      link: "/admin/strategic-plan",
      healthScore: params.quarterlyReviewHealth ?? params.strategicHealth,
    },
    {
      id: "execution",
      name: "Execution",
      status: executionStatus,
      summary: `${params.goalCompletionRate}% goal completion — ${params.initiativeHealth} initiative health`,
      link: "/admin/execution",
      healthScore: params.goalCompletionRate,
    },
  ]
}

export async function runSovereignRuntime(): Promise<SovereignRuntimeResult> {
  const { quarter, year } = getCurrentQuarter()

  const [
    center,
    planningInputs,
    latestPlanningCycle,
    currentQuarterlyReview,
    adjustmentRecommendations,
    knowledgeGraph,
    decisionFollowUpCount,
  ] = await Promise.all([
    buildExecutiveCommandCenter(),
    loadPlanningCycleInputs("weekly"),
    prisma.planningCycle.findFirst({
      orderBy: { createdAt: "desc" },
    }),
    prisma.executiveQuarterlyReview.findUnique({
      where: {
        quarter_year: { quarter, year },
      },
    }),
    prisma.strategyAdjustment.findMany({
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
    }),
    prisma.executiveKnowledgeNode.count().then(async (nodeCount) => {
      const edgeCount = await prisma.executiveKnowledgeEdge.count()
      return { nodeCount, edgeCount }
    }),
    prisma.executiveDecision.count({
      where: { followUpRequired: true },
    }),
  ])

  const planningCycle = buildPlanningCycle(planningInputs)
  const planningCycleActionTitles = planningCycle.actions.map(
    (action) => action.title
  )

  const hasRecentPlanningCycle = latestPlanningCycle
    ? Date.now() - latestPlanningCycle.createdAt.getTime() <
      7 * 24 * 60 * 60 * 1000
    : false

  const adjustmentRecs = adjustmentRecommendations
    .map((item) => item.recommendation)
    .filter((item): item is string => Boolean(item))

  const quarterlyRecommendations =
    center.strategy.quarterlyReviewQuarter === quarter &&
    center.strategy.quarterlyReviewYear === year
      ? center.priorities.filter((item) =>
          item.toLowerCase().includes("quarter")
        )
      : []

  const priorities = buildPriorities({
    commandPriorities: center.priorities,
    boardroomPriorities: center.boardroom.topPriorities,
    quarterlyRecommendations:
      quarterlyRecommendations.length > 0
        ? quarterlyRecommendations
        : center.priorities.slice(0, 3),
    adjustmentRecommendations: adjustmentRecs,
    planningCycleActions: planningCycleActionTitles,
  })

  const recommendations = buildRecommendations({
    strategicPlanPriorities: center.priorities.slice(0, 4),
    forecastFocusAreas: planningCycle.recommendations.slice(0, 3),
    adjustmentRecommendations: adjustmentRecs,
    knowledgeRecommendations: center.strategy.knowledgeInsights,
    planningCycleRecommendations: planningCycle.recommendations,
    learningPractices: center.learning.topPractices,
  })

  const nextActions = buildNextActions({
    overdueTasks: center.delivery.overdueTasks,
    outstandingRevenue: center.revenue.outstandingRevenue,
    overdueInvoices: center.revenue.overdueInvoices,
    reviewRequiredCount: center.content.reviewRequired,
    blockedInitiatives: center.execution.blockedInitiatives,
    hasQuarterlyReview: Boolean(currentQuarterlyReview),
    boardroomSessionCount: center.boardroom.sessionCount,
    hasRecentPlanningCycle,
    proposedAdjustments: center.strategy.proposedAdjustments,
    decisionsNeedingFollowUp: decisionFollowUpCount,
  })

  const systems = buildConnectedSystems({
    forecastConfidence: center.strategy.forecastConfidence,
    forecastHealth: planningInputs.forecast.forecastHealthScore,
    boardroomSessionCount: center.boardroom.sessionCount,
    boardroomHealth: center.boardroom.latestHealthScore,
    learningLessons: center.learning.totalLessons,
    learningEffectiveness: center.learning.averageEffectiveness,
    knowledgeNodes: knowledgeGraph.nodeCount,
    knowledgeEdges: knowledgeGraph.edgeCount,
    planningCycleHealth:
      latestPlanningCycle?.healthScore ?? planningCycle.healthScore,
    planningCycleSummary:
      latestPlanningCycle?.summary ?? planningCycle.summary,
    strategicHealth: center.strategy.strategicHealth,
    quarterlyReviewHealth: center.strategy.quarterlyReviewHealth,
    proposedAdjustments: center.strategy.proposedAdjustments,
    goalCompletionRate: center.execution.goalCompletionRate,
    initiativeHealth: center.execution.initiativeHealth,
    blockedInitiatives: center.execution.blockedInitiatives,
  })

  return {
    runtimeHealth: center.healthScore,
    executiveStatus: getExecutiveStatus(center.healthScore),
    activeRisks: center.alerts,
    activeOpportunities: center.opportunities,
    priorities,
    recommendations,
    nextActions,
    systems,
  }
}
