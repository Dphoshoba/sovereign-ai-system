import { getMissionAdvisor } from "./advisor-reader"
import { getMissionGapAnalysis } from "./gap-analysis-reader"
import { getMissionMaturity } from "./maturity-reader"
import { getResearchMissions } from "./research-registry"
import { getMissionRecommendations } from "./recommendation-reader"
import { buildPlannerRoadmap, byPriorityAndWindow } from "../planner/mock-data"
import type { MissionPlannerWorkspace, PlannerTask } from "../planner/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function toTask(
  id: string,
  title: string,
  window: PlannerTask["window"],
  priority: PlannerTask["priority"],
  workspace: string,
  isBlocker: boolean,
  dependencies: string[],
  rationale: string
): PlannerTask {
  return {
    id,
    title,
    window,
    priority,
    workspace,
    isBlocker,
    dependencies,
    rationale,
  }
}

export async function getMissionPlanner(slug: string): Promise<MissionPlannerWorkspace | null> {
  const advisor = await getMissionAdvisor(slug)
  const maturity = await getMissionMaturity(slug)
  const gap = await getMissionGapAnalysis(slug)
  const recommendations = await getMissionRecommendations(slug)

  if (!advisor || !maturity || !gap || !recommendations) {
    return null
  }

  const highestGap = advisor.highestRoiGap
  const topRecommendation = recommendations.recommendations[0]?.title ?? "Build taxonomy.md"

  const tasks: PlannerTask[] = [
    toTask(
      "plan-1",
      `Build ${highestGap}`,
      "today",
      "high",
      "shared-knowledge",
      true,
      [],
      "Top ROI gap closes knowledge debt and unlocks downstream execution."
    ),
    toTask(
      "plan-2",
      "Create decisions.md",
      "today",
      "high",
      "executive",
      true,
      [`Build ${highestGap}`],
      "Executive decisions are overdue and currently limiting coordinated delivery."
    ),
    toTask(
      "plan-3",
      "Expand discipleship.md",
      "today",
      "medium",
      "ministry",
      false,
      [`Build ${highestGap}`],
      "Teaching expansion increases transfer quality and mission clarity."
    ),
    toTask(
      "plan-4",
      "Complete seminar.md",
      "week",
      "high",
      "agency",
      false,
      ["Create decisions.md", "Expand discipleship.md"],
      "Seminar packaging converts knowledge into tangible agency delivery value."
    ),
    toTask(
      "plan-5",
      "Write article",
      "week",
      "medium",
      "creator",
      false,
      [`Build ${highestGap}`],
      "Creator output activates mission narrative and audience distribution."
    ),
    toTask(
      "plan-6",
      "Link executive priorities to discoveries",
      "week",
      "medium",
      "executive",
      false,
      ["Create decisions.md"],
      "Discovery-to-decision traceability improves operational confidence."
    ),
    toTask(
      "plan-7",
      "Publish course-outline.md",
      "month",
      "medium",
      "creator",
      false,
      ["Complete seminar.md", "Write article"],
      "Course outline publication consolidates monthly creator and ministry output."
    ),
    toTask(
      "plan-8",
      topRecommendation,
      "month",
      "low",
      "shared-knowledge",
      false,
      [`Build ${highestGap}`],
      "Top recommendation from advisor should be delivered after immediate blockers clear."
    ),
  ]

  const today = tasks.filter((task) => task.window === "today")
  const week = tasks.filter((task) => task.window === "week")
  const month = tasks.filter((task) => task.window === "month")

  const dependencies = tasks.filter((task) => task.dependencies.length > 0)
  const blockers = tasks.filter((task) => task.isBlocker)

  const dependencyCount = tasks.reduce((sum, task) => sum + task.dependencies.length, 0)
  const blockerCount = blockers.length

  const executionReadiness = clamp(
    Math.floor((advisor.executionScore * 0.35 + maturity.readinessScore * 0.35 + (100 - blockerCount * 18) * 0.3)),
    0,
    100
  )

  const momentum = clamp(
    Math.floor((advisor.momentumScore * 0.55 + maturity.missionScore * 0.25 + (100 - today.length * 8) * 0.2)),
    0,
    100
  )

  const roadmapScore = clamp(
    Math.floor((executionReadiness * 0.35 + advisor.impactScore * 0.25 + maturity.coverageScore * 0.2 + (100 - dependencyCount * 5) * 0.2)),
    0,
    100
  )

  const deliveryScore = clamp(
    Math.floor((advisor.executionScore * 0.4 + maturity.commercialScore * 0.25 + maturity.teachingScore * 0.2 + (100 - blockerCount * 14) * 0.15)),
    0,
    100
  )

  const priorityScore = clamp(
    Math.floor((advisor.urgencyScore * 0.4 + advisor.impactScore * 0.35 + roadmapScore * 0.25)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((advisor.healthScore * 0.5 + maturity.healthScore * 0.3 + (100 - blockerCount * 16) * 0.2)),
    0,
    100
  )

  const roadmap = buildPlannerRoadmap(slug)
  const priorityQueue = tasks.slice().sort(byPriorityAndWindow)

  const executionPlan = [
    `Today: ${today[0]?.title ?? `Build ${highestGap}`}`,
    `Today: ${today[1]?.title ?? "Create decisions.md"}`,
    `This week: ${week[0]?.title ?? "Complete seminar.md"}`,
    `This month: ${month[0]?.title ?? "Publish course-outline.md"}`,
  ]

  const missionSchedule = [
    `Today tasks: ${today.length}`,
    `Week tasks: ${week.length}`,
    `Month tasks: ${month.length}`,
    `Dependencies tracked: ${dependencyCount}`,
    `Blockers tracked: ${blockerCount}`,
  ]

  const recommendationList = unique([
    ...recommendations.recommendations.slice(0, 5).map((item) => item.title),
    ...advisor.highestRoiOpportunities.slice(0, 3),
  ]).slice(0, 8)

  return {
    mission: slug,
    missionTitle: advisor.missionTitle,
    taskCount: tasks.length,
    todayCount: today.length,
    weekCount: week.length,
    monthCount: month.length,
    dependencyCount,
    blockerCount,
    executionReadiness,
    momentum,
    roadmapScore,
    deliveryScore,
    priorityScore,
    healthScore,
    recommendationCount: recommendationList.length,
    today,
    week,
    month,
    dependencies,
    blockers,
    roadmap,
    priorityQueue,
    executionPlan,
    missionSchedule,
    recommendations: recommendationList,
    readOnly: true,
    previewOnly: true,
    noAuth: true,
    noSessions: true,
    noJwt: true,
    noDatabase: true,
    noExecution: true,
    noPublishing: true,
    noOpenAI: true,
    noGraphWrites: true,
    noSocialPosting: true,
  }
}

export async function getPlannerRegistry(): Promise<{
  missionCount: number
  taskCount: number
  todayCount: number
  weekCount: number
  monthCount: number
  dependencyCount: number
  blockerCount: number
  executionReadiness: number
  momentum: number
  roadmapScore: number
  deliveryScore: number
  priorityScore: number
  healthScore: number
  recommendationCount: number
  missions: MissionPlannerWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionPlannerWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionPlanner(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const taskCount = results.reduce((sum, item) => sum + item.taskCount, 0)
  const todayCount = results.reduce((sum, item) => sum + item.todayCount, 0)
  const weekCount = results.reduce((sum, item) => sum + item.weekCount, 0)
  const monthCount = results.reduce((sum, item) => sum + item.monthCount, 0)
  const dependencyCount = results.reduce((sum, item) => sum + item.dependencyCount, 0)
  const blockerCount = results.reduce((sum, item) => sum + item.blockerCount, 0)
  const recommendationCount = results.reduce((sum, item) => sum + item.recommendationCount, 0)

  const executionReadiness = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.executionReadiness, 0) / missionCount) : 0
  const momentum = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.momentum, 0) / missionCount) : 0
  const roadmapScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.roadmapScore, 0) / missionCount) : 0
  const deliveryScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.deliveryScore, 0) / missionCount) : 0
  const priorityScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.priorityScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    missionCount,
    taskCount,
    todayCount,
    weekCount,
    monthCount,
    dependencyCount,
    blockerCount,
    executionReadiness,
    momentum,
    roadmapScore,
    deliveryScore,
    priorityScore,
    healthScore,
    recommendationCount,
    missions: results,
  }
}