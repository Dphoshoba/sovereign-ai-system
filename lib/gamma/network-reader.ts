import { MissionNetworkWorkspace } from "@/lib/network/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionNetwork(slug: string): Promise<MissionNetworkWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const networkDensity = clamp(
    Math.floor((core.intelligenceScore * 0.6 + core.adaptabilityScore * 0.4)),
    0,
    100
  )
  const collaborationScore = clamp(
    Math.floor((core.learningVelocity * 0.5 + core.knowledgeCapital * 0.5)),
    0,
    100
  )
  const networkHealth = clamp(
    Math.floor((networkDensity * 0.6 + collaborationScore * 0.4)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    networkCount: 8,
    connectedMissions: 6,
    connectedAssets: 42,
    networkDensity,
    networkHealth,
    collaborationScore,
    healthScore: networkHealth,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getNetworkRegistry(): Promise<{
  networkCount: number
  connectedMissions: number
  connectedAssets: number
  networkDensity: number
  networkHealth: number
  collaborationScore: number
  healthScore: number
  missions: MissionNetworkWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionNetworkWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionNetwork(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgNetworkDensity = Math.floor(
    results.reduce((sum, r) => sum + r.networkDensity, 0) / results.length
  )
  const avgNetworkHealth = Math.floor(
    results.reduce((sum, r) => sum + r.networkHealth, 0) / results.length
  )
  const avgCollaborationScore = Math.floor(
    results.reduce((sum, r) => sum + r.collaborationScore, 0) / results.length
  )

  return {
    networkCount: results.length * 8,
    connectedMissions: results.length * 6,
    connectedAssets: results.length * 42,
    networkDensity: avgNetworkDensity,
    networkHealth: avgNetworkHealth,
    collaborationScore: avgCollaborationScore,
    healthScore: avgNetworkHealth,
    missions: results,
  }
}
