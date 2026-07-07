import { getMaturityRegistry } from "./maturity-reader"
import { getExecutionRegistry } from "./execution-reader"
import { getAdvisorRegistry } from "./advisor-reader"
import { getResearchMissions } from "./research-registry"
import { buildLearningRoadmap } from "../learning/mock-data"
import type { MissionLearningWorkspace, LearningAsset } from "../learning/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionLearning(slug: string): Promise<MissionLearningWorkspace | null> {
  const maturity = await getMaturityRegistry()
  const execution = await getExecutionRegistry()
  const advisor = await getAdvisorRegistry()

  if (!maturity || !execution || !advisor) {
    return null
  }

  const learningAssets = 8
  const growthRate = clamp(Math.floor((maturity.readinessScore + advisor.momentumScore) / 2), 0, 100)
  const knowledgeGain = clamp(Math.floor((execution.focusScore * 0.4 + advisor.executionScore * 0.6)), 0, 100)
  const improvementScore = clamp(Math.floor((growthRate * 0.5 + knowledgeGain * 0.5)), 0, 100)
  const feedbackLoops = 5
  const retentionScore = clamp(Math.floor((improvementScore * 0.6 + advisor.momentumScore * 0.4)), 0, 100)
  const healthScore = clamp(Math.floor((growthRate * 0.3 + improvementScore * 0.35 + retentionScore * 0.35)), 0, 100)

  const assets: LearningAsset[] = Array.from({ length: learningAssets }, (_, i) => ({
    assetId: `asset-${i + 1}`,
    assetName: `Learning Asset ${i + 1}`,
    knowledgeGain: knowledgeGain - i * 3,
    retentionRate: retentionScore - i * 2,
    applicationValue: 80 + i * 2,
  }))

  return {
    mission: slug,
    missionTitle: "Research Mission 001",
    learningAssets,
    growthRate,
    knowledgeGain,
    improvementScore,
    feedbackLoops,
    retentionScore,
    healthScore,
    assets,
    recommendations: ["Increase feedback frequency", "Strengthen knowledge retention", "Accelerate learning loops"],
    roadmap: buildLearningRoadmap(slug),
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

export async function getLearningRegistry(): Promise<{
  learningAssets: number
  growthRate: number
  knowledgeGain: number
  improvementScore: number
  feedbackLoops: number
  retentionScore: number
  healthScore: number
  missions: MissionLearningWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionLearningWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionLearning(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const learningAssets = missionCount > 0 ? 8 : 0
  const growthRate = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.growthRate, 0) / missionCount) : 0
  const knowledgeGain = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.knowledgeGain, 0) / missionCount) : 0
  const improvementScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.improvementScore, 0) / missionCount) : 0
  const feedbackLoops = missionCount > 0 ? 5 : 0
  const retentionScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.retentionScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    learningAssets,
    growthRate,
    knowledgeGain,
    improvementScore,
    feedbackLoops,
    retentionScore,
    healthScore,
    missions: results,
  }
}
