import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"
import { getResearchMissions } from "./research-registry"
import { buildPredictionRoadmap } from "../prediction/mock-data"
import type { MissionPredictionWorkspace, PredictionItem } from "../prediction/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionPrediction(slug: string): Promise<MissionPredictionWorkspace | null> {
  const core = await getIntelligenceCoreRegistry()

  if (!core) {
    return null
  }

  const forecastCount = 5
  const confidenceScore = clamp(Math.floor((core.intelligenceScore * 0.6 + core.adaptabilityScore * 0.4)), 0, 100)
  const growthProjection = clamp(Math.floor((core.learningVelocity * 0.5 + core.innovationCapacity * 0.5)), 0, 100)
  const trajectoryScore = clamp(Math.floor((core.adaptabilityScore * 0.4 + core.learningVelocity * 0.6)), 0, 100)
  const riskProjection = clamp(Math.floor((100 - core.adaptabilityScore * 0.5 - core.intelligenceScore * 0.5)), 0, 100)
  const healthScore = clamp(Math.floor((confidenceScore * 0.4 + growthProjection * 0.35 + trajectoryScore * 0.25)), 0, 100)

  const predictions: PredictionItem[] = Array.from({ length: forecastCount }, (_, i) => ({
    predictionId: `pred-${i + 1}`,
    name: `Forecast ${i + 1}`,
    confidence: confidenceScore - i * 4,
    horizon: `${6 + i * 6} months`,
  }))

  return {
    mission: slug,
    missionTitle: "Research Mission 001",
    forecastCount,
    confidenceScore,
    growthProjection,
    trajectoryScore,
    riskProjection,
    healthScore,
    predictions,
    recommendations: ["Increase forecast accuracy", "Expand prediction horizons", "Mitigate risks"],
    roadmap: buildPredictionRoadmap(slug),
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

export async function getPredictionRegistry(): Promise<{
  forecastCount: number
  confidenceScore: number
  growthProjection: number
  trajectoryScore: number
  riskProjection: number
  healthScore: number
  missions: MissionPredictionWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionPredictionWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionPrediction(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgConfidence = results.reduce((s, w) => s + w.confidenceScore, 0) / results.length || 0
  const avgGrowth = results.reduce((s, w) => s + w.growthProjection, 0) / results.length || 0
  const avgTrajectory = results.reduce((s, w) => s + w.trajectoryScore, 0) / results.length || 0
  const avgRisk = results.reduce((s, w) => s + w.riskProjection, 0) / results.length || 0

  return {
    forecastCount: results.reduce((s, w) => s + w.forecastCount, 0),
    confidenceScore: Math.floor(avgConfidence),
    growthProjection: Math.floor(avgGrowth),
    trajectoryScore: Math.floor(avgTrajectory),
    riskProjection: Math.floor(avgRisk),
    healthScore: Math.floor((avgConfidence * 0.4 + avgGrowth * 0.35 + avgTrajectory * 0.25)),
    missions: results,
  }
}
