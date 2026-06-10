import { generateMonthlyExecutiveReview } from "@/lib/executive/autonomous-review"
import { serializeDecision } from "@/lib/executive/decision-memory"
import {
  buildExecutiveForecast,
  type ExecutiveForecast,
} from "@/lib/executive/forecast"
import { buildExecutiveMemory } from "@/lib/executive/memory"
import { generateExecutiveOpportunities } from "@/lib/executive/opportunities"
import { generateExecutiveRisks } from "@/lib/executive/risks"
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

// ===========================================================================
// Phase 23 — Executive Strategy Adjustment Engine.
// Deterministic, rule-based strategic adjustments generated from executive
// memory, autonomous reviews, risks, opportunities, decisions, lessons, and
// revenue/growth/delivery trends. No OpenAI. Read-only — proposals are
// returned, never persisted automatically.
// ===========================================================================

export type StrategicAdjustmentCategory =
  | "Revenue"
  | "Growth"
  | "Delivery"
  | "Operations"
  | "Governance"
  | "Strategy"

export type StrategicAdjustmentStatus =
  | "Proposed"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Implemented"

export type StrategicAdjustmentPriorityLevel =
  | "low"
  | "medium"
  | "high"
  | "critical"

export type StrategicAdjustment = {
  id: string
  title: string
  category: StrategicAdjustmentCategory
  priority: StrategicAdjustmentPriorityLevel
  rationale: string
  evidence: string[]
  proposedAction: string
  expectedImpact: string
  confidence: number
  status: StrategicAdjustmentStatus
}

export type StrategicAdjustmentSummary = {
  total: number
  byPriority: Record<StrategicAdjustmentPriorityLevel, number>
  byCategory: Record<StrategicAdjustmentCategory, number>
  byStatus: Record<StrategicAdjustmentStatus, number>
  averageConfidence: number
}

const BOARDROOM_CADENCE_LAPSE_DAYS = 14
const GOAL_INTERVENTION_PROGRESS_THRESHOLD = 25
const STRONG_LESSON_EFFECTIVENESS_THRESHOLD = 4

function clampConfidence(value: number) {
  return Math.round(Math.max(0.3, Math.min(0.95, value)) * 100) / 100
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

function formatAudAmount(value: number) {
  return `AUD ${Math.round(value).toLocaleString("en-AU")}`
}

export async function generateStrategicAdjustments(): Promise<
  StrategicAdjustment[]
> {
  const [memory, review, risks, opportunities, snapshot, goals, proposals, decisions] =
    await Promise.all([
      buildExecutiveMemory(),
      generateMonthlyExecutiveReview(),
      generateExecutiveRisks(),
      generateExecutiveOpportunities(),
      getExecutivePlatformSnapshot(),
      prisma.quarterlyGoal.findMany(),
      prisma.creatorProposal.findMany(),
      prisma.executiveDecision.findMany(),
    ])

  const adjustments: StrategicAdjustment[] = []

  // Rule 1 — Recurring high-risk pattern → mitigation initiative.
  for (const risk of memory.strategicMemory.recurringRisks) {
    if (risk.occurrences < 2) {
      continue
    }

    const matchingEngineRisk = risks.find((item) =>
      item.title.toLowerCase().includes(risk.text.slice(0, 24).toLowerCase())
    )

    adjustments.push({
      id: `adj-risk-mitigation-${slugify(risk.text)}`,
      title: `Mitigation Initiative: ${risk.text}`,
      category: "Operations",
      priority: risk.occurrences >= 3 ? "critical" : "high",
      rationale: `This risk has recurred across ${risk.occurrences} planning cycles and boardroom sessions without a dedicated mitigation initiative.`,
      evidence: [
        `Recurring risk recorded ${risk.occurrences} times in executive memory.`,
        ...(matchingEngineRisk
          ? [`Active risk engine signal: [${matchingEngineRisk.severity}] ${matchingEngineRisk.impact}`]
          : []),
        ...review.recurringPatterns
          .filter((pattern) => pattern.type === "risk")
          .slice(0, 1)
          .map((pattern) => pattern.pattern),
      ],
      proposedAction:
        matchingEngineRisk?.mitigation ??
        `Stand up a mitigation initiative for "${risk.text}" with a named owner and weekly check-in.`,
      expectedImpact:
        "Removes a recurring drag on execution and prevents the risk from compounding across future cycles.",
      confidence: clampConfidence(0.5 + risk.occurrences * 0.1),
      status: "Proposed",
    })
  }

  // Rule 2 — Recurring opportunity → growth initiative.
  for (const opportunity of memory.strategicMemory.recurringOpportunities) {
    if (opportunity.occurrences < 2) {
      continue
    }

    const topEngineOpportunity = opportunities[0]

    adjustments.push({
      id: `adj-growth-${slugify(opportunity.text)}`,
      title: `Growth Initiative: ${opportunity.text}`,
      category: "Growth",
      priority: opportunity.occurrences >= 3 ? "high" : "medium",
      rationale: `This opportunity has surfaced ${opportunity.occurrences} times across planning cycles and boardroom sessions but has not been converted into a dedicated initiative.`,
      evidence: [
        `Recurring opportunity recorded ${opportunity.occurrences} times in executive memory.`,
        ...(topEngineOpportunity
          ? [`Top opportunity engine signal: ${topEngineOpportunity.title} (score ${topEngineOpportunity.score}/100).`]
          : []),
      ],
      proposedAction: `Launch a growth initiative around "${opportunity.text}" with a measurable target and owner.`,
      expectedImpact:
        "Converts a repeatedly identified opportunity into pipeline and revenue instead of leaving it on the table.",
      confidence: clampConfidence(0.45 + opportunity.occurrences * 0.1),
      status: "Proposed",
    })
  }

  // Rule 3 — Goal below 25% progress → goal intervention.
  const stalledGoals = goals.filter(
    (goal) =>
      goal.status !== "completed" &&
      goal.progress < GOAL_INTERVENTION_PROGRESS_THRESHOLD
  )

  if (stalledGoals.length > 0) {
    adjustments.push({
      id: "adj-goal-intervention",
      title: `Goal Intervention: ${stalledGoals.length} goal${stalledGoals.length === 1 ? "" : "s"} below 25% progress`,
      category: "Strategy",
      priority: stalledGoals.length >= 3 ? "high" : "medium",
      rationale:
        "Quarterly goals below 25% progress are unlikely to complete without intervention — they need realigned targets, linked initiatives, or explicit deprioritization.",
      evidence: stalledGoals
        .slice(0, 5)
        .map(
          (goal) =>
            `"${goal.title}" at ${goal.progress}% progress (${goal.quarter} ${goal.year}, status: ${goal.status}).`
        ),
      proposedAction:
        "Run a goal intervention review: link each stalled goal to an active initiative, reset its target, or formally deprioritize it.",
      expectedImpact:
        "Restores quarterly goal completion trajectory and prevents end-of-quarter surprises.",
      confidence: clampConfidence(0.55 + stalledGoals.length * 0.05),
      status: "Proposed",
    })
  }

  // Rule 4 — Proposal pipeline > revenue collected → sales acceleration.
  const openProposalValue = proposals
    .filter((proposal) => proposal.status !== "rejected")
    .reduce((sum, proposal) => sum + (proposal.estimatedValue ?? 0), 0)

  if (openProposalValue > snapshot.totalPaid) {
    adjustments.push({
      id: "adj-sales-acceleration",
      title: "Sales Acceleration Initiative",
      category: "Revenue",
      priority: snapshot.totalPaid === 0 ? "critical" : "high",
      rationale:
        "Proposal pipeline value exceeds collected revenue — conversion, not lead generation, is the current revenue bottleneck.",
      evidence: [
        `Proposal pipeline: ${formatAudAmount(openProposalValue)} across ${proposals.length} proposal${proposals.length === 1 ? "" : "s"}.`,
        `Revenue collected to date: ${formatAudAmount(snapshot.totalPaid)}.`,
        `${snapshot.wonLeads} lead${snapshot.wonLeads === 1 ? "" : "s"} won so far.`,
      ],
      proposedAction:
        "Run a sales acceleration sprint: follow up every open proposal this week, set close dates, and remove pricing or scope blockers.",
      expectedImpact: `Converting the open pipeline would add up to ${formatAudAmount(openProposalValue)} in collected revenue.`,
      confidence: clampConfidence(
        0.6 + Math.min(proposals.length, 5) * 0.05
      ),
      status: "Proposed",
    })
  }

  // Rule 5 — Unpaid invoices → collections initiative.
  if (snapshot.outstandingRevenue > 0) {
    adjustments.push({
      id: "adj-collections",
      title: "Collections Initiative",
      category: "Revenue",
      priority: snapshot.overdueInvoices > 0 ? "high" : "medium",
      rationale:
        "Outstanding invoice revenue is earned but uncollected — collections is the fastest available revenue lever.",
      evidence: [
        `Outstanding revenue: ${formatAudAmount(snapshot.outstandingRevenue)}.`,
        `${snapshot.overdueInvoices} overdue invoice${snapshot.overdueInvoices === 1 ? "" : "s"}.`,
        `Total invoiced: ${formatAudAmount(snapshot.totalInvoiced)}, collected: ${formatAudAmount(snapshot.totalPaid)}.`,
      ],
      proposedAction:
        "Run a structured collections pass: send reminders for all unpaid invoices, escalate overdue items, and agree on payment dates.",
      expectedImpact: `Recovers up to ${formatAudAmount(snapshot.outstandingRevenue)} without any new sales effort.`,
      confidence: clampConfidence(0.7 + snapshot.overdueInvoices * 0.05),
      status: "Proposed",
    })
  }

  // Rule 6 — Repeated decision failures → governance review.
  const failuresByCategory = new Map<string, number>()

  for (const decision of decisions) {
    const effectiveness =
      decision.effectiveness === null
        ? null
        : decision.effectiveness <= 5
          ? decision.effectiveness * 20
          : decision.effectiveness

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
    if (count < 2) {
      continue
    }

    adjustments.push({
      id: `adj-governance-${slugify(category)}`,
      title: `Governance Review: repeated decision failures in ${category}`,
      category: "Governance",
      priority: count >= 3 ? "high" : "medium",
      rationale: `${count} decisions in the "${category}" category were rejected or scored low on effectiveness — the decision-making process in this area needs review.`,
      evidence: [
        `${count} rejected or low-effectiveness decision${count === 1 ? "" : "s"} in "${category}".`,
        ...review.recurringPatterns
          .filter((pattern) => pattern.type === "decision_failure")
          .slice(0, 1)
          .map((pattern) => pattern.pattern),
      ],
      proposedAction: `Hold a governance review of ${category} decisions: examine why they failed and add a pre-approval checklist for similar future decisions.`,
      expectedImpact:
        "Raises decision effectiveness and avoids repeating known failure modes.",
      confidence: clampConfidence(0.5 + count * 0.08),
      status: "Proposed",
    })
  }

  // Rule 7 — Boardroom cadence lapse → executive review.
  const latestBoardroom = memory.history.boardroomSessions[0]
  const daysSinceBoardroom = latestBoardroom
    ? Math.floor(
        (Date.now() - new Date(latestBoardroom.createdAt).getTime()) /
          (24 * 60 * 60 * 1000)
      )
    : null

  if (daysSinceBoardroom === null || daysSinceBoardroom > BOARDROOM_CADENCE_LAPSE_DAYS) {
    adjustments.push({
      id: "adj-executive-review-cadence",
      title: "Executive Review: boardroom cadence lapse",
      category: "Governance",
      priority: daysSinceBoardroom === null || daysSinceBoardroom > 30 ? "high" : "medium",
      rationale:
        "The executive operating rhythm depends on regular boardroom sessions — the cadence has lapsed beyond the expected interval.",
      evidence: [
        daysSinceBoardroom === null
          ? "No boardroom session found in executive history."
          : `Last boardroom session was ${daysSinceBoardroom} days ago (expected within ${BOARDROOM_CADENCE_LAPSE_DAYS} days).`,
        `Current platform health score: ${review.healthScore}/100.`,
      ],
      proposedAction:
        "Schedule an executive boardroom session this week to review risks, opportunities, and the current quarter trajectory.",
      expectedImpact:
        "Restores the executive operating rhythm and keeps strategy synchronized with execution.",
      confidence: clampConfidence(
        daysSinceBoardroom === null ? 0.85 : 0.55 + daysSinceBoardroom * 0.01
      ),
      status: "Proposed",
    })
  }

  // Rule 8 — Strongest lessons recurring → standardization.
  const strongLessons = memory.strategicMemory.mostEffectiveLessons.filter(
    (lesson) =>
      lesson.effectiveness !== null &&
      lesson.effectiveness >= STRONG_LESSON_EFFECTIVENESS_THRESHOLD
  )

  if (strongLessons.length >= 2) {
    adjustments.push({
      id: "adj-lesson-standardization",
      title: `Standardization: codify ${strongLessons.length} proven executive lessons`,
      category: "Operations",
      priority: "medium",
      rationale:
        "Multiple high-effectiveness lessons have been validated repeatedly — codifying them as standard operating practice locks in the gains.",
      evidence: strongLessons
        .slice(0, 5)
        .map(
          (lesson) =>
            `"${lesson.title}" (effectiveness ${lesson.effectiveness}/5${lesson.impactArea ? `, ${lesson.impactArea}` : ""}).`
        ),
      proposedAction:
        "Convert the strongest lessons into documented standard practices and apply them as default checks in planning cycles.",
      expectedImpact:
        "Makes proven behaviors repeatable by default instead of relying on memory.",
      confidence: clampConfidence(0.55 + strongLessons.length * 0.07),
      status: "Proposed",
    })
  }

  const priorityRank: Record<StrategicAdjustmentPriorityLevel, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }

  return adjustments.sort(
    (a, b) =>
      priorityRank[a.priority] - priorityRank[b.priority] ||
      b.confidence - a.confidence ||
      a.title.localeCompare(b.title)
  )
}

export function summarizeStrategicAdjustments(
  adjustments: StrategicAdjustment[]
): StrategicAdjustmentSummary {
  const byPriority: StrategicAdjustmentSummary["byPriority"] = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  }
  const byCategory: StrategicAdjustmentSummary["byCategory"] = {
    Revenue: 0,
    Growth: 0,
    Delivery: 0,
    Operations: 0,
    Governance: 0,
    Strategy: 0,
  }
  const byStatus: StrategicAdjustmentSummary["byStatus"] = {
    Proposed: 0,
    "Under Review": 0,
    Approved: 0,
    Rejected: 0,
    Implemented: 0,
  }

  for (const adjustment of adjustments) {
    byPriority[adjustment.priority] += 1
    byCategory[adjustment.category] += 1
    byStatus[adjustment.status] += 1
  }

  const averageConfidence =
    adjustments.length > 0
      ? Math.round(
          (adjustments.reduce((sum, item) => sum + item.confidence, 0) /
            adjustments.length) *
            100
        ) / 100
      : 0

  return {
    total: adjustments.length,
    byPriority,
    byCategory,
    byStatus,
    averageConfidence,
  }
}
