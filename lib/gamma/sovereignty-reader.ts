import { MissionSovereigntyWorkspace } from "@/lib/sovereignty/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionSovereignty(slug: string): Promise<MissionSovereigntyWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const ownershipScore = clamp(
    Math.floor((core.intelligenceScore * 0.7 + core.knowledgeCapital * 0.3)),
    0,
    100
  )
  const controlScore = clamp(
    Math.floor((core.adaptabilityScore * 0.6 + core.learningVelocity * 0.4)),
    0,
    100
  )
  const resilienceScore = clamp(
    Math.floor((core.intelligenceScore * 0.5 + core.adaptabilityScore * 0.5)),
    0,
    100
  )
  const sovereigntyScore = clamp(
    Math.floor((ownershipScore * 0.4 + controlScore * 0.3 + resilienceScore * 0.3)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    ownershipScore,
    controlScore,
    dependencyScore: 100 - controlScore,
    resilienceScore,
    sovereigntyScore,
    healthScore: sovereigntyScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getSovereigntyRegistry(): Promise<{
  ownershipScore: number
  controlScore: number
  dependencyScore: number
  resilienceScore: number
  sovereigntyScore: number
  healthScore: number
  missions: MissionSovereigntyWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionSovereigntyWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionSovereignty(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgOwnershipScore = Math.floor(
    results.reduce((sum, r) => sum + r.ownershipScore, 0) / results.length
  )
  const avgControlScore = Math.floor(
    results.reduce((sum, r) => sum + r.controlScore, 0) / results.length
  )
  const avgResilienceScore = Math.floor(
    results.reduce((sum, r) => sum + r.resilienceScore, 0) / results.length
  )
  const avgSovereigntyScore = Math.floor(
    results.reduce((sum, r) => sum + r.sovereigntyScore, 0) / results.length
  )

  return {
    ownershipScore: avgOwnershipScore,
    controlScore: avgControlScore,
    dependencyScore: 100 - avgControlScore,
    resilienceScore: avgResilienceScore,
    sovereigntyScore: avgSovereigntyScore,
    healthScore: avgSovereigntyScore,
    missions: results,
  }
}
