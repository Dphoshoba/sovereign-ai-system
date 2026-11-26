import { MissionStrategicTimingWorkspace } from "@/lib/strategic-timing/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionStrategicTiming(
  slug: string
): Promise<MissionStrategicTimingWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const timingScore = clamp(
    Math.floor((core.intelligenceScore * 0.5 + core.learningVelocity * 0.5)),
    0,
    100
  )
  const marketReadiness = clamp(
    Math.floor((core.knowledgeCapital * 0.6 + core.intelligenceScore * 0.4)),
    0,
    100
  )
  const executionWindow = clamp(
    Math.floor((core.adaptabilityScore * 0.7 + core.learningVelocity * 0.3)),
    0,
    100
  )
  const momentum = clamp(
    Math.floor((core.learningVelocity * 0.8 + core.adaptabilityScore * 0.2)),
    0,
    100
  )
  const seasonality = clamp(
    Math.floor((core.intelligenceScore * 0.5 + core.knowledgeCapital * 0.5)),
    0,
    100
  )
  const coordination = clamp(
    Math.floor((core.adaptabilityScore * 0.6 + core.intelligenceScore * 0.4)),
    0,
    100
  )
  const predictability = clamp(
    Math.floor((core.knowledgeCapital * 0.7 + core.learningVelocity * 0.3)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    timingScore,
    marketReadiness,
    executionWindow,
    momentum,
    seasonality,
    coordination,
    predictability,
    healthScore: timingScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getStrategicTimingRegistry(): Promise<{
  timingScore: number
  marketReadiness: number
  executionWindow: number
  momentum: number
  seasonality: number
  coordination: number
  predictability: number
  healthScore: number
  missions: MissionStrategicTimingWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionStrategicTimingWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionStrategicTiming(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgTimingScore = Math.floor(results.reduce((sum, r) => sum + r.timingScore, 0) / results.length)
  const avgMarketReadiness = Math.floor(
    results.reduce((sum, r) => sum + r.marketReadiness, 0) / results.length
  )
  const avgExecutionWindow = Math.floor(
    results.reduce((sum, r) => sum + r.executionWindow, 0) / results.length
  )
  const avgMomentum = Math.floor(results.reduce((sum, r) => sum + r.momentum, 0) / results.length)
  const avgSeasonality = Math.floor(results.reduce((sum, r) => sum + r.seasonality, 0) / results.length)
  const avgCoordination = Math.floor(
    results.reduce((sum, r) => sum + r.coordination, 0) / results.length
  )
  const avgPredictability = Math.floor(
    results.reduce((sum, r) => sum + r.predictability, 0) / results.length
  )

  return {
    timingScore: avgTimingScore,
    marketReadiness: avgMarketReadiness,
    executionWindow: avgExecutionWindow,
    momentum: avgMomentum,
    seasonality: avgSeasonality,
    coordination: avgCoordination,
    predictability: avgPredictability,
    healthScore: avgTimingScore,
    missions: results,
  }
}
