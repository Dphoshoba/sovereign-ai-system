import { getMissionAdvisor } from "./advisor-reader"
import { getMissionGapAnalysis } from "./gap-analysis-reader"
import { getMissionMaturity } from "./maturity-reader"
import { getMissionPlanner } from "./planner-reader"
import { getResearchMissions } from "./research-registry"
import { getMissionRecommendations } from "./recommendation-reader"
import { buildReviewRoadmap } from "../review/mock-data"
import type { MissionReviewWorkspace, ReviewTaskItem } from "../review/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function toTask(
  id: string,
  title: string,
  status: ReviewTaskItem["status"],
  workspace: string,
  priority: ReviewTaskItem["priority"],
  rationale: string
): ReviewTaskItem {
  return { id, title, status, workspace, priority, rationale }
}

export async function getMissionReview(slug: string): Promise<MissionReviewWorkspace | null> {
  const planner = await getMissionPlanner(slug)
  const advisor = await getMissionAdvisor(slug)
  const maturity = await getMissionMaturity(slug)
  const gap = await getMissionGapAnalysis(slug)
  const recommendations = await getMissionRecommendations(slug)

  if (!planner || !advisor || !maturity || !gap || !recommendations) {
    return null
  }

  const completed: ReviewTaskItem[] = [
    toTask("rev-c1", `Build ${advisor.highestRoiGap}`, "completed", "shared-knowledge", "high", "Primary knowledge debt item received immediate execution focus."),
    toTask("rev-c2", "Create decisions.md", "completed", "executive", "high", "Executive decision flow initialized this week."),
    toTask("rev-c3", "Expand discipleship.md", "completed", "ministry", "medium", "Teaching transfer plan expanded in ministry layer."),
    toTask("rev-c4", "Write article", "completed", "creator", "medium", "Creator narrative output started from mission insights."),
    toTask("rev-c5", "Link executive priorities to discoveries", "completed", "executive", "medium", "Decision traceability improved in operating layer."),
  ]

  const pending: ReviewTaskItem[] = [
    toTask("rev-p1", "Complete seminar.md", "pending", "agency", "high", "Agency packaging is queued after executive and teaching dependencies."),
    toTask("rev-p2", "Publish course-outline.md", "pending", "creator", "medium", "Course output is dependent on seminar and article completion."),
    toTask("rev-p3", recommendations.recommendations[0]?.title ?? "Build taxonomy.md", "pending", "shared-knowledge", "medium", "Top recommendation remains in queue for next cycle."),
    toTask("rev-p4", "Develop next teaching module", "pending", "ministry", "medium", "Teaching backlog still has one high-value module pending."),
  ]

  const overdue: ReviewTaskItem[] = [
    toTask("rev-o1", "Close unresolved research questions", "overdue", "research", "high", "Unanswered questions remain above expected weekly threshold."),
    toTask("rev-o2", "Stabilize executive scorecard", "overdue", "executive", "high", "Executive readiness has not reached target threshold."),
  ]

  const completedCount = completed.length
  const pendingCount = pending.length
  const overdueCount = overdue.length

  const improvementScore = clamp(
    Math.floor((completedCount * 8 + planner.momentum * 0.35 + maturity.missionScore * 0.25)),
    0,
    100
  )

  const regressionScore = clamp(
    Math.floor((overdueCount * 12 + gap.unansweredQuestions * 1.5 + (100 - maturity.readinessScore) * 0.15)),
    0,
    100
  )

  const momentumScore = clamp(
    Math.floor((planner.momentum * 0.55 + advisor.momentumScore * 0.25 + (100 - overdueCount * 10) * 0.2)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((planner.healthScore * 0.45 + advisor.healthScore * 0.25 + maturity.healthScore * 0.2 + (100 - overdueCount * 12) * 0.1)),
    0,
    100
  )

  const reviewScore = clamp(
    Math.floor((improvementScore * 0.35 + momentumScore * 0.25 + healthScore * 0.2 + (100 - regressionScore) * 0.2)),
    0,
    100
  )

  const knowledgeDebt = gap.assetDeficit

  const attentionScore = clamp(
    Math.floor((advisor.urgencyScore * 0.45 + gap.priorityScore * 0.2 + overdueCount * 8 + (100 - healthScore) * 0.25)),
    0,
    100
  )

  const nextWeekActions = unique([
    ...planner.week.slice(0, 3).map((task) => task.title),
    ...overdue.slice(0, 2).map((task) => task.title),
    ...advisor.topActions.slice(0, 2).map((action) => action.title),
  ]).slice(0, 6)

  const improvements = [
    `Completed ${completedCount} high-value tasks this cycle.`,
    `Momentum improved to ${momentumScore} with consistent planner execution.`,
    `Priority queue throughput improved across creator and ministry layers.`,
  ]

  const regressions = [
    `${overdueCount} tasks remain overdue entering next week.`,
    `Executive readiness remains below expected threshold at ${maturity.readinessScore}.`,
    `Unanswered research questions remain at ${gap.unansweredQuestions}.`,
  ]

  const attentionNeeded = unique([
    `Mission needing attention: ${planner.missionTitle}`,
    `Weakest area: ${advisor.weakestWorkspace}`,
    `Knowledge debt accumulating at ${knowledgeDebt}`,
    `Highest overdue pressure: executive and research`,
  ])

  const recommendationList = unique([
    ...recommendations.recommendations.slice(0, 5).map((item) => item.title),
    ...planner.recommendations.slice(0, 3),
  ]).slice(0, 8)

  const missionOutlook = [
    `Greatest value produced: Build ${advisor.highestRoiGap}.`,
    `Primary unfinished work is concentrated in agency packaging and executive stabilization.`,
    `Next week should prioritize overdue research and executive tasks before new month tasks.`,
  ]

  return {
    mission: slug,
    missionTitle: planner.missionTitle,
    completedCount,
    pendingCount,
    overdueCount,
    improvementScore,
    regressionScore,
    reviewScore,
    momentumScore,
    healthScore,
    knowledgeDebt,
    attentionScore,
    nextWeekActions,
    recommendationCount: recommendationList.length,
    completed,
    pending,
    overdue,
    improvements,
    regressions,
    attentionNeeded,
    recommendations: recommendationList,
    missionOutlook,
    roadmap: buildReviewRoadmap(slug),
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

export async function getReviewRegistry(): Promise<{
  missionCount: number
  completedCount: number
  pendingCount: number
  overdueCount: number
  improvementScore: number
  regressionScore: number
  reviewScore: number
  momentumScore: number
  healthScore: number
  knowledgeDebt: number
  attentionScore: number
  nextWeekActions: number
  recommendationCount: number
  missions: MissionReviewWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionReviewWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionReview(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const completedCount = results.reduce((sum, item) => sum + item.completedCount, 0)
  const pendingCount = results.reduce((sum, item) => sum + item.pendingCount, 0)
  const overdueCount = results.reduce((sum, item) => sum + item.overdueCount, 0)
  const nextWeekActions = results.reduce((sum, item) => sum + item.nextWeekActions.length, 0)
  const recommendationCount = results.reduce((sum, item) => sum + item.recommendationCount, 0)

  const improvementScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.improvementScore, 0) / missionCount) : 0
  const regressionScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.regressionScore, 0) / missionCount) : 0
  const reviewScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.reviewScore, 0) / missionCount) : 0
  const momentumScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.momentumScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0
  const knowledgeDebt = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.knowledgeDebt, 0) / missionCount) : 0
  const attentionScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.attentionScore, 0) / missionCount) : 0

  return {
    missionCount,
    completedCount,
    pendingCount,
    overdueCount,
    improvementScore,
    regressionScore,
    reviewScore,
    momentumScore,
    healthScore,
    knowledgeDebt,
    attentionScore,
    nextWeekActions,
    recommendationCount,
    missions: results,
  }
}