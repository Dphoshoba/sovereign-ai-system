import type { ExecutiveForecast } from "@/lib/executive/forecast"
import type { ExecutivePlatformSnapshot } from "@/lib/executive/platform-snapshot"
import type { StrategicPlan } from "@/lib/executive/strategic-plan"

export const GOAL_STATUSES = [
  "planned",
  "active",
  "at-risk",
  "completed",
] as const

export type GoalStatus = (typeof GOAL_STATUSES)[number]

export type QuarterlyGoalProposal = {
  title: string
  description: string | null
  category: string | null
  targetValue: number | null
  currentValue: number
  progress: number
}

export type QuarterlyGoalsResult = {
  quarter: string
  year: number
  goals: QuarterlyGoalProposal[]
}

export type QuarterlyGoalsInputs = {
  plan: StrategicPlan
  forecast: ExecutiveForecast
  snapshot: ExecutivePlatformSnapshot
  initiativeStats: {
    total: number
    completed: number
  }
}

export function getCurrentQuarter(date = new Date()) {
  const quarter = `Q${Math.floor(date.getMonth() / 3) + 1}`
  return {
    quarter,
    year: date.getFullYear(),
  }
}

export function normalizeGoalTitle(title: string) {
  return title.trim().toLowerCase()
}

export function clampGoalProgress(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)))
}

export function isGoalStatus(value: string): value is GoalStatus {
  return GOAL_STATUSES.includes(value as GoalStatus)
}

function parseNumericValue(value: string) {
  const cleaned = value.replace(/aud\s?/gi, "").replace(/,/g, "").trim()
  const parsed = Number(cleaned)
  return Number.isNaN(parsed) ? null : parsed
}

function uniqueGoalProposals(goals: QuarterlyGoalProposal[]) {
  const seen = new Set<string>()
  const unique: QuarterlyGoalProposal[] = []

  for (const goal of goals) {
    const key = normalizeGoalTitle(goal.title)
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    unique.push(goal)
  }

  return unique
}

function computeProgressTowardTarget(current: number, target: number) {
  if (target <= 0) {
    return current <= 0 ? 100 : 0
  }

  if (target < current) {
    return clampGoalProgress((current / target) * 100)
  }

  return clampGoalProgress((current / target) * 100)
}

function computeReductionProgress(current: number, baseline: number) {
  if (baseline <= 0) {
    return 100
  }

  return clampGoalProgress(((baseline - current) / baseline) * 100)
}

function buildMetricGoals(
  plan: StrategicPlan,
  snapshot: ExecutivePlatformSnapshot
): QuarterlyGoalProposal[] {
  const goals: QuarterlyGoalProposal[] = []

  for (const metric of plan.successMetrics) {
    const current = parseNumericValue(metric.currentValue)
    const target = parseNumericValue(metric.targetValue)
    const label = metric.label.toLowerCase()

    if (current === null || target === null) {
      continue
    }

    if (label.includes("subscriber")) {
      goals.push({
        title: "Grow Subscribers",
        description: `Increase subscriber base from ${current} toward ${target}`,
        category: "growth",
        targetValue: target,
        currentValue: current,
        progress: computeProgressTowardTarget(current, target),
      })
      continue
    }

    if (label.includes("won revenue")) {
      goals.push({
        title: "Increase Won Revenue",
        description: `Move won revenue from AUD ${current.toLocaleString("en-AU")} toward AUD ${target.toLocaleString("en-AU")}`,
        category: "revenue",
        targetValue: target,
        currentValue: current,
        progress: computeProgressTowardTarget(current, target),
      })
      continue
    }

    if (label.includes("overdue")) {
      goals.push({
        title: "Eliminate Overdue Tasks",
        description: `Reduce overdue delivery tasks from ${current} to 0`,
        category: "delivery",
        targetValue: 0,
        currentValue: current,
        progress: computeReductionProgress(current, current),
      })
      continue
    }

    if (label.includes("outstanding revenue")) {
      goals.push({
        title: "Reduce Outstanding Revenue",
        description: `Reduce outstanding revenue from AUD ${current.toLocaleString("en-AU")} toward AUD 0`,
        category: "revenue",
        targetValue: 0,
        currentValue: current,
        progress: computeReductionProgress(current, current),
      })
      continue
    }

    if (label.includes("health score")) {
      goals.push({
        title: "Improve Health Score",
        description: `Raise health score from ${current} toward ${target}`,
        category: "health",
        targetValue: target,
        currentValue: current,
        progress: computeProgressTowardTarget(current, target),
      })
    }
  }

  if (
    snapshot.outstandingRevenue > 0 &&
    !goals.some((goal) => goal.title === "Reduce Outstanding Revenue")
  ) {
    goals.push({
      title: "Reduce Outstanding Revenue",
      description: `Collect outstanding revenue currently at AUD ${snapshot.outstandingRevenue.toLocaleString("en-AU")}`,
      category: "revenue",
      targetValue: 0,
      currentValue: snapshot.outstandingRevenue,
      progress: 0,
    })
  }

  if (
    snapshot.overdueTasks > 0 &&
    !goals.some((goal) => goal.title === "Eliminate Overdue Tasks")
  ) {
    goals.push({
      title: "Eliminate Overdue Tasks",
      description: `Clear ${snapshot.overdueTasks} overdue delivery task${snapshot.overdueTasks === 1 ? "" : "s"}`,
      category: "delivery",
      targetValue: 0,
      currentValue: snapshot.overdueTasks,
      progress: 0,
    })
  }

  if (
    snapshot.totalSubscribers >= 0 &&
    !goals.some((goal) => goal.title === "Grow Subscribers")
  ) {
    const target =
      snapshot.monthlySubscribers > 0
        ? snapshot.totalSubscribers + snapshot.monthlySubscribers
        : snapshot.totalSubscribers + 1

    if (target > snapshot.totalSubscribers) {
      goals.push({
        title: "Grow Subscribers",
        description: `Grow subscriber base from ${snapshot.totalSubscribers} toward ${target}`,
        category: "growth",
        targetValue: target,
        currentValue: snapshot.totalSubscribers,
        progress: computeProgressTowardTarget(
          snapshot.totalSubscribers,
          target
        ),
      })
    }
  }

  if (
    snapshot.wonRevenue >= 0 &&
    snapshot.openPipeline > 0 &&
    !goals.some((goal) => goal.title === "Increase Won Revenue")
  ) {
    const proposalReadyValue = snapshot.proposalReadyLeads.reduce(
      (sum, lead) => sum + (lead.projectedValue || 0),
      0
    )
    const target =
      proposalReadyValue > 0
        ? snapshot.wonRevenue + proposalReadyValue
        : snapshot.wonRevenue

    if (target > snapshot.wonRevenue) {
      goals.push({
        title: "Increase Won Revenue",
        description: `Advance won revenue from AUD ${snapshot.wonRevenue.toLocaleString("en-AU")} using open pipeline data`,
        category: "revenue",
        targetValue: target,
        currentValue: snapshot.wonRevenue,
        progress: computeProgressTowardTarget(snapshot.wonRevenue, target),
      })
    }
  }

  return goals
}

function buildObjectiveGoals(plan: StrategicPlan): QuarterlyGoalProposal[] {
  return plan.objectives.slice(0, 5).map((objective) => ({
    title: objective.length > 80 ? `${objective.slice(0, 77)}...` : objective,
    description: objective,
    category: "strategic",
    targetValue: null,
    currentValue: 0,
    progress: 0,
  }))
}

function buildFocusAreaGoals(
  forecast: ExecutiveForecast
): QuarterlyGoalProposal[] {
  return forecast.recommendedFocusAreas.slice(0, 5).map((focusArea) => ({
    title: focusArea.length > 80 ? `${focusArea.slice(0, 77)}...` : focusArea,
    description: focusArea,
    category: "focus",
    targetValue: null,
    currentValue: 0,
    progress: 0,
  }))
}

function buildInitiativeGoal(
  initiativeStats: QuarterlyGoalsInputs["initiativeStats"]
): QuarterlyGoalProposal | null {
  if (initiativeStats.total === 0) {
    return null
  }

  return {
    title: "Complete Strategic Initiatives",
    description: `Complete ${initiativeStats.total} strategic initiative${initiativeStats.total === 1 ? "" : "s"} tracked in execution`,
    category: "execution",
    targetValue: initiativeStats.total,
    currentValue: initiativeStats.completed,
    progress: computeProgressTowardTarget(
      initiativeStats.completed,
      initiativeStats.total
    ),
  }
}

export function buildQuarterlyGoals(
  inputs: QuarterlyGoalsInputs
): QuarterlyGoalsResult {
  const { quarter, year } = getCurrentQuarter()
  const initiativeGoal = buildInitiativeGoal(inputs.initiativeStats)

  const goals = uniqueGoalProposals([
    ...buildMetricGoals(inputs.plan, inputs.snapshot),
    ...(initiativeGoal ? [initiativeGoal] : []),
    ...buildObjectiveGoals(inputs.plan),
    ...buildFocusAreaGoals(inputs.forecast),
  ])

  return {
    quarter,
    year,
    goals,
  }
}

export function calculateGoalCompletionRate(
  goals: { status: string }[]
): number {
  if (goals.length === 0) {
    return 0
  }

  const completed = goals.filter((goal) => goal.status === "completed").length
  return Math.round((completed / goals.length) * 100)
}

export function getScorecardRating(
  completionRate: number
): "Excellent" | "Good" | "Needs Attention" {
  if (completionRate >= 80) {
    return "Excellent"
  }

  if (completionRate >= 60) {
    return "Good"
  }

  return "Needs Attention"
}

export function buildPerformanceScorecard(goals: { status: string }[]) {
  const completionRate = calculateGoalCompletionRate(goals)

  return {
    completionRate,
    rating: getScorecardRating(completionRate),
    totalGoals: goals.length,
    completedGoals: goals.filter((goal) => goal.status === "completed").length,
  }
}
