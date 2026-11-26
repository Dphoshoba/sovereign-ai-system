import { getAgencyWorkspace } from "./agency-reader"
import { getCreatorWorkspace } from "./creator-output-reader"
import { getExecutiveWorkspace } from "./executive-reader"
import { getMissionGapAnalysis } from "./gap-analysis-reader"
import { getMissionInference } from "./inference-reader"
import { getMissionMaturity, getMaturityRegistry } from "./maturity-reader"
import { getMinistryWorkspace } from "./ministry-reader"
import { getMission, getResearchMissions } from "./research-registry"
import { getMissionRecommendations } from "./recommendation-reader"
import { getSharedKnowledgeWorkspace } from "./shared-knowledge-reader"
import { buildAdvisorRoadmap, countPriorityActions } from "../advisor/mock-data"
import type { AdvisorAction, MissionAdvisorWorkspace } from "../advisor/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function toAction(
  id: string,
  title: string,
  category: AdvisorAction["category"],
  priority: AdvisorAction["priority"],
  rationale: string,
  workspace: string
): AdvisorAction {
  return { id, title, category, priority, rationale, workspace }
}

export async function getMissionAdvisor(slug: string): Promise<MissionAdvisorWorkspace | null> {
  const research = await getMission(slug)
  const creator = await getCreatorWorkspace(slug)
  const ministry = await getMinistryWorkspace(slug)
  const executive = await getExecutiveWorkspace(slug)
  const agency = await getAgencyWorkspace(slug)
  const shared = await getSharedKnowledgeWorkspace(slug)
  const inference = await getMissionInference(slug)
  const gapAnalysis = await getMissionGapAnalysis(slug)
  const maturity = await getMissionMaturity(slug)
  const recommendations = await getMissionRecommendations(slug)

  if (!research || !creator || !ministry || !executive || !agency || !shared || !inference || !gapAnalysis || !maturity || !recommendations) {
    return null
  }

  const highestRoiGap = gapAnalysis.missingAssets[0] ?? gapAnalysis.knowledgeGaps[0]?.suggestedAsset ?? "taxonomy.md"
  const weakestWorkspace = gapAnalysis.weakestWorkspace.workspace
  const knowledgeDebt = gapAnalysis.assetDeficit

  const creatorActionTitle = creator.articleIdeas[0] ? `Write ${creator.articleIdeas[0]}` : "Write article"
  const teachingActionTitle = "Expand discipleship.md"
  const executiveActionTitle = executive.nextRecommendedActions[0] ?? "Create decisions.md"
  const agencyActionTitle = agency.workshopPlans[0] ? `Build ${agency.workshopPlans[0]}` : "Build seminar.md"
  const recommendationActionTitle = recommendations.recommendations[0]?.title ?? "Build taxonomy.md"

  const priorityActions: AdvisorAction[] = [
    toAction(
      "advisor-knowledge-1",
      `Build ${highestRoiGap}`,
      "knowledge",
      "high",
      "Highest ROI knowledge debt should be addressed first to improve reuse and query coverage.",
      "shared-knowledge"
    ),
    toAction(
      "advisor-creator-1",
      creatorActionTitle,
      "creator",
      "high",
      "Creator output is needed to convert research into externally usable assets.",
      "creator"
    ),
    toAction(
      "advisor-teaching-1",
      teachingActionTitle,
      "teaching",
      "medium",
      "Teaching expansion closes ministry transfer gaps and strengthens mission clarity.",
      "ministry"
    ),
    toAction(
      "advisor-executive-1",
      executiveActionTitle,
      "executive",
      "high",
      "Executive readiness remains the weakest operating surface and needs overdue decisions captured.",
      "executive"
    ),
    toAction(
      "advisor-agency-1",
      agencyActionTitle,
      "agency",
      "medium",
      "Agency packaging turns mission knowledge into service delivery opportunities.",
      "agency"
    ),
    toAction(
      "advisor-recommendation-1",
      recommendationActionTitle,
      "recommendation",
      "high",
      "Top recommendation carries the highest impact across knowledge and operating layers.",
      "shared-knowledge"
    ),
  ]

  const urgencyScore = clamp(
    Math.floor((gapAnalysis.priorityScore * 0.45 + (100 - maturity.readinessScore) * 0.3 + inference.unansweredQuestions * 1.5)),
    0,
    100
  )

  const impactScore = clamp(
    Math.floor((recommendations.readinessScore * 0.2 + recommendations.coveragePercent * 0.2 + gapAnalysis.recommendationScore * 0.25 + maturity.reuseScore * 0.15 + (100 - gapAnalysis.healthScore) * 0.2)),
    0,
    100
  )

  const momentumScore = clamp(
    Math.floor((creator.progress * 0.2 + ministry.progress * 0.25 + agency.progress * 0.15 + maturity.missionScore * 0.2 + (100 - inference.unansweredQuestions * 2) * 0.2)),
    0,
    100
  )

  const executionScore = clamp(
    Math.floor((executive.readinessScore * 0.35 + agency.progress * 0.25 + maturity.readinessScore * 0.2 + recommendations.actionCount * 2)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((gapAnalysis.healthScore * 0.4 + maturity.healthScore * 0.35 + recommendations.healthScore * 0.25)),
    0,
    100
  )

  const missionFocusScore = clamp(
    Math.floor((urgencyScore * 0.35 + impactScore * 0.25 + executionScore * 0.2 + (100 - knowledgeDebt * 4) * 0.2)),
    0,
    100
  )

  const creatorSuggestions = unique([
    creatorActionTitle,
    ...creator.articleIdeas.slice(0, 2).map((item) => `Write ${item}`),
    ...creator.bookOutlines.slice(0, 1).map((item) => `Expand ${item}`),
  ]).slice(0, 6)

  const teachingSuggestions = unique([
    teachingActionTitle,
    ...ministry.sermonSeries.slice(0, 2).map((item) => `Expand ${item}`),
    ...ministry.teachingCourses.slice(0, 2).map((item) => `Develop ${item}`),
  ]).slice(0, 6)

  const executiveSuggestions = unique([
    executiveActionTitle,
    ...executive.nextRecommendedActions.slice(0, 3),
  ]).slice(0, 6)

  const agencySuggestions = unique([
    agencyActionTitle,
    ...agency.workshopPlans.slice(0, 2).map((item) => `Build ${item}`),
    ...agency.servicePackages.slice(0, 2).map((item) => `Package ${item}`),
  ]).slice(0, 6)

  const highestRoiOpportunities = unique([
    `Build ${highestRoiGap}`,
    ...gapAnalysis.recommendations.slice(0, 3),
    ...recommendations.recommendations.slice(0, 2).map((item) => item.title),
  ]).slice(0, 8)

  const weakestAreas = unique([
    weakestWorkspace,
    ...gapAnalysis.lowMaturityAreas,
  ]).slice(0, 6)

  const missionFocus = [
    `Mission needing attention: ${research.name}`,
    `Weakest area: ${weakestWorkspace}`,
    `Highest ROI gap: ${highestRoiGap}`,
    `Highest impact recommendation: ${recommendationActionTitle}`,
  ]

  const topActions = priorityActions.slice(0, 5)
  const adviceCount = priorityActions.length + creatorSuggestions.length + teachingSuggestions.length + executiveSuggestions.length + agencySuggestions.length
  const priorityActionCount = countPriorityActions(priorityActions)

  return {
    mission: slug,
    missionTitle: research.name,
    adviceCount,
    priorityActionCount,
    highestRoiGap,
    weakestWorkspace,
    urgencyScore,
    impactScore,
    momentumScore,
    executionScore,
    healthScore,
    recommendationCount: recommendations.recommendationCount,
    missionFocusScore,
    knowledgeDebt,
    priorityActions,
    topActions,
    creatorSuggestions,
    teachingSuggestions,
    executiveSuggestions,
    agencySuggestions,
    highestRoiOpportunities,
    weakestAreas,
    missionFocus,
    roadmap: buildAdvisorRoadmap(slug),
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

export async function getAdvisorRegistry(): Promise<{
  missionCount: number
  adviceCount: number
  priorityActionCount: number
  urgencyScore: number
  impactScore: number
  momentumScore: number
  executionScore: number
  healthScore: number
  knowledgeDebt: number
  missionFocusScore: number
  missions: MissionAdvisorWorkspace[]
}> {
  const missions = await getResearchMissions()
  const maturityRegistry = await getMaturityRegistry()
  const results: MissionAdvisorWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionAdvisor(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const adviceCount = results.reduce((sum, item) => sum + item.adviceCount, 0)
  const priorityActionCount = results.reduce((sum, item) => sum + item.priorityActionCount, 0)
  const urgencyScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.urgencyScore, 0) / missionCount) : 0
  const impactScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.impactScore, 0) / missionCount) : 0
  const momentumScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.momentumScore, 0) / missionCount) : 0
  const executionScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.executionScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0
  const knowledgeDebt = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.knowledgeDebt, 0) / missionCount) : 0
  const missionFocusScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.missionFocusScore, 0) / missionCount) : 0

  if (maturityRegistry.missionCount === 0) {
    return {
      missionCount,
      adviceCount,
      priorityActionCount,
      urgencyScore,
      impactScore,
      momentumScore,
      executionScore,
      healthScore,
      knowledgeDebt,
      missionFocusScore,
      missions: results,
    }
  }

  return {
    missionCount,
    adviceCount,
    priorityActionCount,
    urgencyScore,
    impactScore,
    momentumScore,
    executionScore,
    healthScore,
    knowledgeDebt,
    missionFocusScore,
    missions: results,
  }
}