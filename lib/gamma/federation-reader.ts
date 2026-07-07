import { MissionFederationWorkspace } from "@/lib/federation/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionFederation(slug: string): Promise<MissionFederationWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const reuseScore = clamp(
    Math.floor((core.knowledgeCapital * 0.7 + core.learningVelocity * 0.3)),
    0,
    100
  )
  const cohesionScore = clamp(
    Math.floor((core.adaptabilityScore * 0.6 + core.intelligenceScore * 0.4)),
    0,
    100
  )
  const healthScore = clamp(
    Math.floor((reuseScore * 0.5 + cohesionScore * 0.5)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    missionCount: 5,
    federatedAssets: 34,
    federatedKnowledge: 28,
    reuseScore,
    cohesionScore,
    healthScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getFederationRegistry(): Promise<{
  missionCount: number
  federatedAssets: number
  federatedKnowledge: number
  reuseScore: number
  cohesionScore: number
  healthScore: number
  missions: MissionFederationWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionFederationWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionFederation(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgReuseScore = Math.floor(
    results.reduce((sum, r) => sum + r.reuseScore, 0) / results.length
  )
  const avgCohesionScore = Math.floor(
    results.reduce((sum, r) => sum + r.cohesionScore, 0) / results.length
  )
  const avgHealthScore = Math.floor(
    results.reduce((sum, r) => sum + r.healthScore, 0) / results.length
  )

  return {
    missionCount: results.length * 5,
    federatedAssets: results.length * 34,
    federatedKnowledge: results.length * 28,
    reuseScore: avgReuseScore,
    cohesionScore: avgCohesionScore,
    healthScore: avgHealthScore,
    missions: results,
  }
}
