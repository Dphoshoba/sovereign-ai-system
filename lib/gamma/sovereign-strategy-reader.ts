import { MissionSovereignStrategyWorkspace } from "@/lib/sovereign-strategy/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionSovereignStrategy(slug: string): Promise<MissionSovereignStrategyWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const strategyScore = clamp(
    Math.floor((core.intelligenceScore * 0.7 + core.adaptabilityScore * 0.3)),
    0,
    100
  )
  const alignmentScore = clamp(
    Math.floor((core.intelligenceScore * 0.6 + core.knowledgeCapital * 0.4)),
    0,
    100
  )
  const executionScore = clamp(
    Math.floor((core.learningVelocity * 0.5 + core.adaptabilityScore * 0.5)),
    0,
    100
  )
  const missionCohesion = clamp(
    Math.floor((alignmentScore * 0.6 + executionScore * 0.4)),
    0,
    100
  )
  const resourceAllocation = clamp(
    Math.floor((strategyScore * 0.5 + alignmentScore * 0.5)),
    0,
    100
  )
  const successProbability = clamp(
    Math.floor((executionScore * 0.6 + missionCohesion * 0.4)),
    0,
    100
  )
  const riskMitigation = clamp(
    Math.floor((core.adaptabilityScore * 0.7 + strategyScore * 0.3)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    strategyScore,
    alignmentScore,
    executionScore,
    missionCohesion,
    resourceAllocation,
    successProbability,
    riskMitigation,
    healthScore: strategyScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getSovereignStrategyRegistry(): Promise<{
  strategyScore: number
  alignmentScore: number
  executionScore: number
  missionCohesion: number
  resourceAllocation: number
  successProbability: number
  riskMitigation: number
  healthScore: number
  missions: MissionSovereignStrategyWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionSovereignStrategyWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionSovereignStrategy(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgStrategyScore = Math.floor(results.reduce((sum, r) => sum + r.strategyScore, 0) / results.length)
  const avgAlignmentScore = Math.floor(results.reduce((sum, r) => sum + r.alignmentScore, 0) / results.length)
  const avgExecutionScore = Math.floor(results.reduce((sum, r) => sum + r.executionScore, 0) / results.length)
  const avgMissionCohesion = Math.floor(results.reduce((sum, r) => sum + r.missionCohesion, 0) / results.length)
  const avgResourceAllocation = Math.floor(
    results.reduce((sum, r) => sum + r.resourceAllocation, 0) / results.length
  )
  const avgSuccessProbability = Math.floor(results.reduce((sum, r) => sum + r.successProbability, 0) / results.length)
  const avgRiskMitigation = Math.floor(results.reduce((sum, r) => sum + r.riskMitigation, 0) / results.length)

  return {
    strategyScore: avgStrategyScore,
    alignmentScore: avgAlignmentScore,
    executionScore: avgExecutionScore,
    missionCohesion: avgMissionCohesion,
    resourceAllocation: avgResourceAllocation,
    successProbability: avgSuccessProbability,
    riskMitigation: avgRiskMitigation,
    healthScore: avgStrategyScore,
    missions: results,
  }
}
