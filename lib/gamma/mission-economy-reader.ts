import { MissionMissionEconomyWorkspace } from "@/lib/mission-economy/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionMissionEconomy(slug: string): Promise<MissionMissionEconomyWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const economyScore = clamp(Math.floor((core.knowledgeCapital * 0.6 + core.intelligenceScore * 0.4)), 0, 100)
  const valueGeneration = clamp(Math.floor((core.intelligenceScore * 0.5 + core.learningVelocity * 0.5)), 0, 100)
  const revenuePotential = clamp(Math.floor((core.knowledgeCapital * 0.7 + core.adaptabilityScore * 0.3)), 0, 100)
  const costOptimization = clamp(Math.floor((core.adaptabilityScore * 0.6 + core.learningVelocity * 0.4)), 0, 100)
  const profitMargin = clamp(Math.floor((revenuePotential * 0.5 + costOptimization * 0.5)), 0, 100)
  const capitalEfficiency = clamp(Math.floor((economyScore * 0.4 + valueGeneration * 0.6)), 0, 100)
  const growthRate = clamp(Math.floor((core.learningVelocity * 0.6 + core.intelligenceScore * 0.4)), 0, 100)

  return {
    mission: slug,
    missionTitle: mission.title,
    economyScore,
    valueGeneration,
    revenuePotential,
    costOptimization,
    profitMargin,
    capitalEfficiency,
    growthRate,
    healthScore: economyScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getMissionEconomyRegistry(): Promise<{
  economyScore: number
  valueGeneration: number
  revenuePotential: number
  costOptimization: number
  profitMargin: number
  capitalEfficiency: number
  growthRate: number
  healthScore: number
  missions: MissionMissionEconomyWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionMissionEconomyWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionMissionEconomy(mission.slug)
    if (workspace) results.push(workspace)
  }

  return {
    economyScore: Math.floor(results.reduce((sum, r) => sum + r.economyScore, 0) / results.length),
    valueGeneration: Math.floor(results.reduce((sum, r) => sum + r.valueGeneration, 0) / results.length),
    revenuePotential: Math.floor(results.reduce((sum, r) => sum + r.revenuePotential, 0) / results.length),
    costOptimization: Math.floor(results.reduce((sum, r) => sum + r.costOptimization, 0) / results.length),
    profitMargin: Math.floor(results.reduce((sum, r) => sum + r.profitMargin, 0) / results.length),
    capitalEfficiency: Math.floor(results.reduce((sum, r) => sum + r.capitalEfficiency, 0) / results.length),
    growthRate: Math.floor(results.reduce((sum, r) => sum + r.growthRate, 0) / results.length),
    healthScore: Math.floor(results.reduce((sum, r) => sum + r.economyScore, 0) / results.length),
    missions: results,
  }
}
