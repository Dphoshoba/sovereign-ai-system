import { serializeDecision } from "@/lib/executive/decision-memory"
import {
  buildExecutiveForecast,
  type ExecutiveForecast,
} from "@/lib/executive/forecast"
import {
  buildExecutiveLearning,
  serializeExecutiveLesson,
  type ImpactPattern,
} from "@/lib/executive/learning-system"
import {
  buildExecutiveMonthlyReview,
  getMonthlyReviewDateCutoff,
} from "@/lib/executive/monthly-review"
import {
  computeOverallHealthScore,
  getExecutivePlatformSnapshot,
  type ExecutivePlatformSnapshot,
} from "@/lib/executive/platform-snapshot"
import {
  getCurrentQuarter,
} from "@/lib/executive/quarterly-goals"
import type { ExecutiveQuarterlyReview } from "@/lib/executive/quarterly-review"
import { buildExecutiveRecommendations } from "@/lib/executive/recommendations"
import {
  buildStrategicPlan,
  type StrategicPlan,
} from "@/lib/executive/strategic-plan"
import { buildExecutiveWeeklyReview } from "@/lib/executive/weekly-review"
import { prisma } from "@/lib/prisma"

export type StrategyAdjustmentPriority = "high" | "medium" | "low"

export type StrategyAdjustmentGoalProposal = {
  title: string
  description: string | null
  category: string | null
  targetValue: number | null
}

export type StrategyAdjustmentInitiativeProposal = {
  title: string
  description: string
  priority: StrategyAdjustmentPriority
  actions: string[]
}

export type StrategyAdjustmentProposal = {
  title: string
  description: string
  category: string
  priority: StrategyAdjustmentPriority
  recommendation: string
  sourceReasoning: string
  goals: StrategyAdjustmentGoalProposal[]
  initiatives: StrategyAdjustmentInitiativeProposal[]
}

export type StrategyAdjustmentsResult = {
  healthScore: number
  adjustments: StrategyAdjustmentProposal[]
  sourceReviewId: string | null
  quarter: string | null
  year: number | null
}

type AdjustmentContext = {
  snapshot: ExecutivePlatformSnapshot
  forecast: ExecutiveForecast
  strategicPlan: StrategicPlan
  quarterlyReview: ExecutiveQuarterlyReview | null
  sourceReviewId: string | null
  boardroomPriorities: string[]
  learningWeakPatterns: ImpactPattern[]
}

const GOAL_COMPLETION_THRESHOLD = 60
const WEAK_SUBSCRIBER_THRESHOLD = 50

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function normalizePriority(value: string): StrategyAdjustmentPriority {
  if (value === "high" || value === "low") {
    return value
  }

  return "medium"
}

function buildGoalOptimizationProposal(context: AdjustmentContext) {
  const review = context.quarterlyReview
  if (!review) {
    return null
  }

  const { goalPerformance } = review
  const needsAttention =
    goalPerformance.completionRate < GOAL_COMPLETION_THRESHOLD ||
    goalPerformance.atRiskGoals > 0 ||
    goalPerformance.rating === "Needs Attention"

  if (!needsAttention) {
    return null
  }

  const atRiskTitles = goalPerformance.goals
    .filter((goal) => goal.status === "at-risk")
    .map((goal) => goal.title)

  const goals: StrategyAdjustmentGoalProposal[] = goalPerformance.goals
    .filter((goal) => goal.status === "at-risk" || goal.progress < 50)
    .slice(0, 3)
    .map((goal) => ({
      title: `Realign: ${goal.title}`,
      description: `Reset targets and execution path for underperforming goal currently at ${goal.progress}% progress.`,
      category: goal.category,
      targetValue: goal.targetValue,
    }))

  return {
    title: "Quarterly Goal Optimization Proposal",
    description:
      "Quarterly goal completion is below target. Propose realigning at-risk goals and linking initiatives before the next planning cycle.",
    category: "execution",
    priority: goalPerformance.atRiskGoals > 0 ? "high" : "medium",
    recommendation:
      review.recommendations[0] ??
      "Review at-risk quarterly goals, adjust targets, and sync linked initiative progress.",
    sourceReasoning: `Quarterly review shows ${goalPerformance.completedGoals}/${goalPerformance.totalGoals} goals completed (${goalPerformance.completionRate}% completion rate). ${goalPerformance.atRiskGoals} goal(s) at risk${atRiskTitles.length > 0 ? `: ${atRiskTitles.join(", ")}` : ""}.`,
    goals,
    initiatives: [
      {
        title: "Quarterly Goal Realignment Initiative",
        description:
          "Review underperforming quarterly goals and reset execution paths without modifying existing records until approved.",
        priority: goalPerformance.atRiskGoals > 0 ? "high" : "medium",
        actions: uniqueStrings([
          "Review quarterly goals dashboard for at-risk and low-progress items.",
          "Sync initiative progress to goal performance metrics.",
          ...review.recommendations.slice(0, 2),
        ]),
      },
    ],
  } satisfies StrategyAdjustmentProposal
}

function buildExecutionImprovementProposal(context: AdjustmentContext) {
  const blockedCount =
    context.quarterlyReview?.initiativePerformance.blockedInitiatives ?? 0

  if (blockedCount === 0) {
    return null
  }

  const completionRate =
    context.quarterlyReview?.initiativePerformance.completionRate ?? 0

  return {
    title: "Execution Improvement Proposal",
    description:
      "Blocked strategic initiatives are limiting quarterly execution velocity.",
    category: "execution",
    priority: "high",
    recommendation:
      "Conduct an initiative unblock review and reassign owners before the next boardroom session.",
    sourceReasoning: `${blockedCount} blocked initiative(s) detected with ${completionRate}% initiative completion rate in the latest quarterly review.`,
    goals: [],
    initiatives: [
      {
        title: "Initiative Unblock Sprint",
        description:
          "Resolve blocked strategic initiatives and restore execution momentum.",
        priority: "high",
        actions: uniqueStrings([
          "Review blocked initiatives in the execution engine.",
          "Assign owners and reset delivery timelines for blocked work.",
          ...(context.quarterlyReview?.losses.filter((item) =>
            item.toLowerCase().includes("blocked")
          ) ?? []),
        ]).slice(0, 4),
      },
    ],
  } satisfies StrategyAdjustmentProposal
}

function buildAudienceGrowthProposal(context: AdjustmentContext) {
  const { snapshot, forecast } = context
  const weakGrowth =
    snapshot.growthRate === 0 ||
    snapshot.monthlySubscribers === 0 ||
    snapshot.totalSubscribers < WEAK_SUBSCRIBER_THRESHOLD

  if (!weakGrowth) {
    return null
  }

  const targetSubscribers =
    snapshot.totalSubscribers > 0
      ? snapshot.totalSubscribers + Math.max(snapshot.monthlySubscribers, 1)
      : WEAK_SUBSCRIBER_THRESHOLD

  return {
    title: "Audience Growth Proposal",
    description:
      "Subscriber growth signals are weak — propose an audience acquisition adjustment.",
    category: "growth",
    priority: snapshot.growthRate === 0 ? "high" : "medium",
    recommendation:
      forecast.recommendedFocusAreas.find((item) =>
        item.toLowerCase().includes("growth")
      ) ??
      forecast.recommendedFocusAreas[0] ??
      "Launch lead magnets and newsletter CTAs to accelerate subscriber acquisition.",
    sourceReasoning: `Platform snapshot: ${snapshot.totalSubscribers} total subscribers, ${snapshot.monthlySubscribers} new this month, ${snapshot.growthRate}% growth rate. Forecast: ${forecast.growthForecast.split(".")[0]}.`,
    goals: [
      {
        title: "Accelerate subscriber growth",
        description: `Increase subscribers from ${snapshot.totalSubscribers} toward ${targetSubscribers}.`,
        category: "growth",
        targetValue: targetSubscribers,
      },
    ],
    initiatives: [
      {
        title: "Audience Growth Initiative",
        description:
          "Expand subscriber acquisition through lead magnets, newsletter promotion, and content CTAs.",
        priority: snapshot.growthRate === 0 ? "high" : "medium",
        actions: uniqueStrings([
          "Review growth dashboard and top-performing acquisition channels.",
          "Promote lead magnets through newsletter and blog CTAs.",
          ...context.strategicPlan.priorities.filter((item) =>
            item.toLowerCase().includes("growth")
          ),
        ]).slice(0, 4),
      },
    ],
  } satisfies StrategyAdjustmentProposal
}

function buildRevenueCollectionProposal(context: AdjustmentContext) {
  const { snapshot, forecast } = context

  if (snapshot.outstandingRevenue <= 0) {
    return null
  }

  return {
    title: "Revenue Collection Proposal",
    description:
      "Outstanding client revenue requires a collections-focused strategy adjustment.",
    category: "revenue",
    priority: snapshot.overdueInvoices > 0 ? "high" : "medium",
    recommendation:
      forecast.recommendedFocusAreas.find((item) =>
        item.toLowerCase().includes("revenue")
      ) ??
      `Follow up on outstanding revenue (AUD ${snapshot.outstandingRevenue.toLocaleString("en-AU")}).`,
    sourceReasoning: `Outstanding revenue is AUD ${snapshot.outstandingRevenue.toLocaleString("en-AU")} with ${snapshot.overdueInvoices} overdue invoice${snapshot.overdueInvoices === 1 ? "" : "s"}.`,
    goals: [
      {
        title: "Collect outstanding revenue",
        description: `Reduce outstanding revenue from AUD ${snapshot.outstandingRevenue.toLocaleString("en-AU")} toward AUD 0.`,
        category: "revenue",
        targetValue: 0,
      },
    ],
    initiatives: [
      {
        title: "Collections Initiative",
        description:
          "Collect outstanding and overdue invoice revenue through structured follow-up.",
        priority: snapshot.overdueInvoices > 0 ? "high" : "medium",
        actions: uniqueStrings([
          "Follow up on outstanding and overdue invoices this week.",
          "Convert proposal-ready leads to reduce future outstanding revenue risk.",
          ...context.strategicPlan.priorities.filter((item) =>
            item.toLowerCase().includes("revenue")
          ),
        ]).slice(0, 4),
      },
    ],
  } satisfies StrategyAdjustmentProposal
}

function buildContentOperationsProposal(context: AdjustmentContext) {
  const { snapshot } = context

  if (snapshot.reviewRequiredCount <= 0) {
    return null
  }

  return {
    title: "Content Operations Proposal",
    description:
      "Editorial review backlog is limiting publishing momentum — propose a content operations adjustment.",
    category: "content",
    priority: snapshot.reviewRequiredCount >= 5 ? "high" : "medium",
    recommendation:
      "Clear the editorial review queue and schedule approved content to maintain publishing momentum.",
    sourceReasoning: `${snapshot.reviewRequiredCount} article${snapshot.reviewRequiredCount === 1 ? "" : "s"} waiting in editorial review. ${snapshot.publishedArticles} published article${snapshot.publishedArticles === 1 ? "" : "s"} currently tracked.`,
    goals: [
      {
        title: "Clear editorial review backlog",
        description: `Reduce review-required articles from ${snapshot.reviewRequiredCount} to 0.`,
        category: "content",
        targetValue: 0,
      },
    ],
    initiatives: [
      {
        title: "Content Operations Initiative",
        description:
          "Clear the editorial review backlog and restore publishing momentum.",
        priority: snapshot.reviewRequiredCount >= 5 ? "high" : "medium",
        actions: [
          "Clear the editorial review queue in the articles admin.",
          "Schedule approved content to maintain publishing momentum.",
        ],
      },
    ],
  } satisfies StrategyAdjustmentProposal
}

function buildLearningAdjustmentProposal(
  context: AdjustmentContext,
  impactArea: string,
  averageEffectiveness: number
): StrategyAdjustmentProposal {
  return {
    title: `${impactArea.charAt(0).toUpperCase()}${impactArea.slice(1)} Decision Quality Proposal`,
    description:
      "Executive learning indicates weak decision effectiveness in this impact area.",
    category: impactArea,
    priority: averageEffectiveness < 40 ? "high" : "medium",
    recommendation: `Improve ${impactArea} decision quality through structured review before approving similar initiatives.`,
    sourceReasoning: `Executive learning shows ${impactArea} decisions averaging ${averageEffectiveness}/100 effectiveness.`,
    goals: [],
    initiatives: [
      {
        title: `${impactArea.charAt(0).toUpperCase()}${impactArea.slice(1)} Decision Review Initiative`,
        description: `Review completed ${impactArea} decisions and apply lessons before next quarter planning.`,
        priority: averageEffectiveness < 40 ? "high" : "medium",
        actions: [
          `Review decision outcomes in the ${impactArea} impact area.`,
          "Apply recommended practices from executive learning before new commitments.",
        ],
      },
    ],
  }
}

function buildBoardroomPriorityProposal(
  context: AdjustmentContext,
  priority: string,
  index: number
): StrategyAdjustmentProposal {
  return {
    title: `Boardroom Priority: ${priority}`,
    description:
      "Boardroom session surfaced this priority for strategic adjustment consideration.",
    category: "strategy",
    priority: index === 0 ? "high" : "medium",
    recommendation: priority,
    sourceReasoning: `Latest boardroom session listed "${priority}" among top priorities.`,
    goals: [],
    initiatives: [
      {
        title: `Boardroom Action: ${priority}`,
        description: priority,
        priority: index === 0 ? "high" : "medium",
        actions: [priority],
      },
    ],
  }
}

function buildAdjustmentsFromContext(
  context: AdjustmentContext
): StrategyAdjustmentProposal[] {
  const adjustments: StrategyAdjustmentProposal[] = []

  const candidates = [
    buildGoalOptimizationProposal(context),
    buildExecutionImprovementProposal(context),
    buildAudienceGrowthProposal(context),
    buildRevenueCollectionProposal(context),
    buildContentOperationsProposal(context),
  ]

  for (const candidate of candidates) {
    if (candidate) {
      adjustments.push({
        ...candidate,
        priority: normalizePriority(candidate.priority),
      })
    }
  }

  for (const pattern of context.learningWeakPatterns.slice(0, 2)) {
    adjustments.push(
      buildLearningAdjustmentProposal(
        context,
        pattern.impactArea,
        pattern.averageEffectiveness
      )
    )
  }

  context.boardroomPriorities.slice(0, 2).forEach((priority, index) => {
    adjustments.push(buildBoardroomPriorityProposal(context, priority, index))
  })

  const seenTitles = new Set<string>()

  return adjustments.filter((adjustment) => {
    const key = adjustment.title.trim().toLowerCase()
    if (seenTitles.has(key)) {
      return false
    }

    seenTitles.add(key)
    return true
  })
}

async function loadAdjustmentContext(): Promise<AdjustmentContext> {
  const cutoff = getMonthlyReviewDateCutoff()

  const [
    snapshot,
    briefings,
    leads,
    latestReviewRecord,
    latestBoardroom,
    executiveDecisions,
    executiveLessons,
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
    prisma.executiveQuarterlyReview.findFirst({
      orderBy: [{ year: "desc" }, { quarter: "desc" }],
    }),
    prisma.executiveBoardroomSession.findFirst({
      orderBy: { createdAt: "desc" },
    }),
    prisma.executiveDecision.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.executiveLesson.findMany({
      orderBy: { createdAt: "desc" },
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

  const learningSummary = buildExecutiveLearning(
    executiveDecisions.map(serializeDecision),
    executiveLessons.map(serializeExecutiveLesson)
  )

  const boardroomDecisions = (latestBoardroom?.decisions ?? {}) as {
    topPriorities?: string[]
  }

  const quarterlyReview =
    (latestReviewRecord?.reviewJson as ExecutiveQuarterlyReview | null) ?? null

  return {
    snapshot,
    forecast,
    strategicPlan,
    quarterlyReview,
    sourceReviewId: latestReviewRecord?.id ?? null,
    boardroomPriorities: Array.isArray(boardroomDecisions.topPriorities)
      ? boardroomDecisions.topPriorities
      : [],
    learningWeakPatterns: learningSummary.weakestPatterns,
  }
}

export async function buildStrategyAdjustments(): Promise<StrategyAdjustmentsResult> {
  const context = await loadAdjustmentContext()
  const adjustments = buildAdjustmentsFromContext(context)

  const healthScore =
    context.quarterlyReview?.healthScore ??
    computeOverallHealthScore(context.snapshot)

  return {
    healthScore,
    adjustments,
    sourceReviewId: context.sourceReviewId,
    quarter: context.quarterlyReview?.quarter ?? getCurrentQuarter().quarter,
    year: context.quarterlyReview?.year ?? getCurrentQuarter().year,
  }
}
