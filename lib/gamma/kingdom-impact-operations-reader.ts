import { MissionKingdomImpactOperationsWorkspace } from "@/lib/kingdom-impact-operations/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionKingdomImpactOperations(
  slug: string
): Promise<MissionKingdomImpactOperationsWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const impactScore = clamp(
    Math.floor((core.intelligenceScore * 0.5 + core.knowledgeCapital * 0.5)),
    0,
    100
  )
  const influenceReach = clamp(
    Math.floor((core.adaptabilityScore * 0.6 + core.intelligenceScore * 0.4)),
    0,
    100
  )
  const stakeholderEngagement = clamp(
    Math.floor((core.learningVelocity * 0.5 + core.knowledgeCapital * 0.5)),
    0,
    100
  )
  const valueCreation = clamp(
    Math.floor((core.knowledgeCapital * 0.7 + core.intelligenceScore * 0.3)),
    0,
    100
  )
  const sustainability = clamp(
    Math.floor((core.adaptabilityScore * 0.5 + core.learningVelocity * 0.5)),
    0,
    100
  )
  const scalability = clamp(
    Math.floor((core.intelligenceScore * 0.6 + core.adaptabilityScore * 0.4)),
    0,
    100
  )
  const legacy = clamp(
    Math.floor((core.knowledgeCapital * 0.6 + core.intelligenceScore * 0.4)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    impactScore,
    influenceReach,
    stakeholderEngagement,
    valueCreation,
    sustainability,
    scalability,
    legacy,
    healthScore: impactScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getKingdomImpactOperationsRegistry(): Promise<{
  impactScore: number
  influenceReach: number
  stakeholderEngagement: number
  valueCreation: number
  sustainability: number
  scalability: number
  legacy: number
  healthScore: number
  missions: MissionKingdomImpactOperationsWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionKingdomImpactOperationsWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionKingdomImpactOperations(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgImpactScore = Math.floor(results.reduce((sum, r) => sum + r.impactScore, 0) / results.length)
  const avgInfluenceReach = Math.floor(
    results.reduce((sum, r) => sum + r.influenceReach, 0) / results.length
  )
  const avgStakeholderEngagement = Math.floor(
    results.reduce((sum, r) => sum + r.stakeholderEngagement, 0) / results.length
  )
  const avgValueCreation = Math.floor(
    results.reduce((sum, r) => sum + r.valueCreation, 0) / results.length
  )
  const avgSustainability = Math.floor(
    results.reduce((sum, r) => sum + r.sustainability, 0) / results.length
  )
  const avgScalability = Math.floor(results.reduce((sum, r) => sum + r.scalability, 0) / results.length)
  const avgLegacy = Math.floor(results.reduce((sum, r) => sum + r.legacy, 0) / results.length)

  return {
    impactScore: avgImpactScore,
    influenceReach: avgInfluenceReach,
    stakeholderEngagement: avgStakeholderEngagement,
    valueCreation: avgValueCreation,
    sustainability: avgSustainability,
    scalability: avgScalability,
    legacy: avgLegacy,
    healthScore: avgImpactScore,
    missions: results,
  }
}
