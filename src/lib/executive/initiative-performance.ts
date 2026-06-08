export type InitiativePerformanceRecord = {
  id: string
  goalId: string | null
  status: string
  progress: number
}

export type GoalPerformanceRecord = {
  id: string
  title: string
  targetValue: number | null
  currentValue: number | null
  progress: number
  status: string
}

export type GoalAlignmentItem = {
  goalId: string
  goalTitle: string
  linkedInitiatives: number
  averageProgress: number
  status: "On Track" | "At Risk" | "Off Track"
}

export type InitiativePerformance = {
  totalInitiatives: number
  activeInitiatives: number
  blockedInitiatives: number
  completedInitiatives: number
  completionRate: number
  initiativeHealth: "Excellent" | "Good" | "Needs Attention"
  goalAlignment: GoalAlignmentItem[]
}

export type GoalSyncUpdate = {
  goalId: string
  progress: number
  currentValue: number
  linkedInitiativeCount: number
}

export function getInitiativeHealthRating(
  completionRate: number
): InitiativePerformance["initiativeHealth"] {
  if (completionRate >= 80) {
    return "Excellent"
  }

  if (completionRate >= 60) {
    return "Good"
  }

  return "Needs Attention"
}

export function getGoalAlignmentStatus(
  averageProgress: number,
  linkedInitiatives: number,
  hasBlockedInitiative: boolean
): GoalAlignmentItem["status"] {
  if (linkedInitiatives === 0) {
    return "Off Track"
  }

  if (hasBlockedInitiative || averageProgress < 30) {
    return "Off Track"
  }

  if (averageProgress >= 60) {
    return "On Track"
  }

  return "At Risk"
}

function averageProgress(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length
  )
}

export function buildGoalAlignment(
  goals: GoalPerformanceRecord[],
  initiatives: InitiativePerformanceRecord[]
): GoalAlignmentItem[] {
  return goals.map((goal) => {
    const linked = initiatives.filter((item) => item.goalId === goal.id)
    const avgProgress = averageProgress(linked.map((item) => item.progress))
    const hasBlockedInitiative = linked.some((item) => item.status === "blocked")

    return {
      goalId: goal.id,
      goalTitle: goal.title,
      linkedInitiatives: linked.length,
      averageProgress: avgProgress,
      status: getGoalAlignmentStatus(
        avgProgress,
        linked.length,
        hasBlockedInitiative
      ),
    }
  })
}

export function calculateInitiativePerformance(
  initiatives: InitiativePerformanceRecord[],
  goals: GoalPerformanceRecord[]
): InitiativePerformance {
  const totalInitiatives = initiatives.length
  const activeInitiatives = initiatives.filter(
    (item) => item.status === "active" || item.status === "planned"
  ).length
  const blockedInitiatives = initiatives.filter(
    (item) => item.status === "blocked"
  ).length
  const completedInitiatives = initiatives.filter(
    (item) => item.status === "completed"
  ).length

  const completionRate =
    totalInitiatives > 0
      ? Math.round((completedInitiatives / totalInitiatives) * 100)
      : 0

  return {
    totalInitiatives,
    activeInitiatives,
    blockedInitiatives,
    completedInitiatives,
    completionRate,
    initiativeHealth: getInitiativeHealthRating(completionRate),
    goalAlignment: buildGoalAlignment(goals, initiatives),
  }
}

export function calculateGoalSyncUpdate(
  goal: GoalPerformanceRecord,
  linkedInitiatives: InitiativePerformanceRecord[]
): GoalSyncUpdate {
  const progress = averageProgress(linkedInitiatives.map((item) => item.progress))
  const completedCount = linkedInitiatives.filter(
    (item) => item.status === "completed"
  ).length

  let currentValue = completedCount

  if (goal.targetValue !== null && goal.targetValue > 0) {
    currentValue = Math.round((progress / 100) * goal.targetValue)
  } else if (goal.targetValue === 0) {
    currentValue = linkedInitiatives.filter(
      (item) => item.status !== "completed"
    ).length
  }

  return {
    goalId: goal.id,
    progress,
    currentValue,
    linkedInitiativeCount: linkedInitiatives.length,
  }
}

export function buildGoalSyncUpdates(
  goals: GoalPerformanceRecord[],
  initiatives: InitiativePerformanceRecord[]
): GoalSyncUpdate[] {
  return goals
    .map((goal) => {
      const linked = initiatives.filter((item) => item.goalId === goal.id)

      if (linked.length === 0) {
        return null
      }

      return calculateGoalSyncUpdate(goal, linked)
    })
    .filter((item): item is GoalSyncUpdate => item !== null)
}
