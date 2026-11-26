import { MissionLegacyDeploymentWorkspace } from "@/lib/legacy-deployment/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionLegacyDeployment(
  slug: string
): Promise<MissionLegacyDeploymentWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const legacyScore = clamp(
    Math.floor((core.knowledgeCapital * 0.7 + core.intelligenceScore * 0.3)),
    0,
    100
  )
  const historicalConnection = clamp(
    Math.floor((core.knowledgeCapital * 0.8 + core.intelligenceScore * 0.2)),
    0,
    100
  )
  const inheritanceValue = clamp(
    Math.floor((core.intelligenceScore * 0.5 + core.knowledgeCapital * 0.5)),
    0,
    100
  )
  const continuity = clamp(
    Math.floor((core.adaptabilityScore * 0.6 + core.knowledgeCapital * 0.4)),
    0,
    100
  )
  const wisdomTransfer = clamp(
    Math.floor((core.learningVelocity * 0.6 + core.knowledgeCapital * 0.4)),
    0,
    100
  )
  const impact = clamp(
    Math.floor((core.intelligenceScore * 0.6 + core.adaptabilityScore * 0.4)),
    0,
    100
  )
  const sustainability = clamp(
    Math.floor((core.knowledgeCapital * 0.5 + core.learningVelocity * 0.5)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    legacyScore,
    historicalConnection,
    inheritanceValue,
    continuity,
    wisdomTransfer,
    impact,
    sustainability,
    healthScore: legacyScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getLegacyDeploymentRegistry(): Promise<{
  legacyScore: number
  historicalConnection: number
  inheritanceValue: number
  continuity: number
  wisdomTransfer: number
  impact: number
  sustainability: number
  healthScore: number
  missions: MissionLegacyDeploymentWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionLegacyDeploymentWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionLegacyDeployment(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgLegacyScore = Math.floor(results.reduce((sum, r) => sum + r.legacyScore, 0) / results.length)
  const avgHistoricalConnection = Math.floor(
    results.reduce((sum, r) => sum + r.historicalConnection, 0) / results.length
  )
  const avgInheritanceValue = Math.floor(
    results.reduce((sum, r) => sum + r.inheritanceValue, 0) / results.length
  )
  const avgContinuity = Math.floor(results.reduce((sum, r) => sum + r.continuity, 0) / results.length)
  const avgWisdomTransfer = Math.floor(
    results.reduce((sum, r) => sum + r.wisdomTransfer, 0) / results.length
  )
  const avgImpact = Math.floor(results.reduce((sum, r) => sum + r.impact, 0) / results.length)
  const avgSustainability = Math.floor(
    results.reduce((sum, r) => sum + r.sustainability, 0) / results.length
  )

  return {
    legacyScore: avgLegacyScore,
    historicalConnection: avgHistoricalConnection,
    inheritanceValue: avgInheritanceValue,
    continuity: avgContinuity,
    wisdomTransfer: avgWisdomTransfer,
    impact: avgImpact,
    sustainability: avgSustainability,
    healthScore: avgLegacyScore,
    missions: results,
  }
}
