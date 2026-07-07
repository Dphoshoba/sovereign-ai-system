import { MissionGlobalExpansionWorkspace } from "@/lib/global-expansion/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionGlobalExpansion(slug: string): Promise<MissionGlobalExpansionWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const expansionScore = clamp(
    Math.floor((core.intelligenceScore * 0.6 + core.adaptabilityScore * 0.4)),
    0,
    100
  )
  const marketPenetration = clamp(
    Math.floor((core.learningVelocity * 0.7 + core.knowledgeCapital * 0.3)),
    0,
    100
  )
  const geographicReach = clamp(
    Math.floor((core.intelligenceScore * 0.5 + core.adaptabilityScore * 0.5)),
    0,
    100
  )
  const culturalAdaptation = clamp(
    Math.floor((core.adaptabilityScore * 0.8 + core.learningVelocity * 0.2)),
    0,
    100
  )
  const partnershipStrength = clamp(
    Math.floor((core.knowledgeCapital * 0.6 + core.intelligenceScore * 0.4)),
    0,
    100
  )
  const riskResilience = clamp(
    Math.floor((core.adaptabilityScore * 0.7 + core.intelligenceScore * 0.3)),
    0,
    100
  )
  const scalability = clamp(
    Math.floor((core.learningVelocity * 0.8 + core.adaptabilityScore * 0.2)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    expansionScore,
    marketPenetration,
    geographicReach,
    culturalAdaptation,
    partnershipStrength,
    riskResilience,
    scalability,
    healthScore: expansionScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getGlobalExpansionRegistry(): Promise<{
  expansionScore: number
  marketPenetration: number
  geographicReach: number
  culturalAdaptation: number
  partnershipStrength: number
  riskResilience: number
  scalability: number
  healthScore: number
  missions: MissionGlobalExpansionWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionGlobalExpansionWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionGlobalExpansion(mission.slug)
    if (workspace) results.push(workspace)
  }

  const core = await getIntelligenceCoreRegistry()

  const avgExpansionScore = Math.floor(
    results.reduce((sum, r) => sum + r.expansionScore, 0) / results.length
  )
  const avgMarketPenetration = Math.floor(
    results.reduce((sum, r) => sum + r.marketPenetration, 0) / results.length
  )
  const avgGeographicReach = Math.floor(
    results.reduce((sum, r) => sum + r.geographicReach, 0) / results.length
  )
  const avgCulturalAdaptation = Math.floor(
    results.reduce((sum, r) => sum + r.culturalAdaptation, 0) / results.length
  )
  const avgPartnershipStrength = Math.floor(
    results.reduce((sum, r) => sum + r.partnershipStrength, 0) / results.length
  )
  const avgRiskResilience = Math.floor(
    results.reduce((sum, r) => sum + r.riskResilience, 0) / results.length
  )
  const avgScalability = Math.floor(
    results.reduce((sum, r) => sum + r.scalability, 0) / results.length
  )

  return {
    expansionScore: avgExpansionScore,
    marketPenetration: avgMarketPenetration,
    geographicReach: avgGeographicReach,
    culturalAdaptation: avgCulturalAdaptation,
    partnershipStrength: avgPartnershipStrength,
    riskResilience: avgRiskResilience,
    scalability: avgScalability,
    healthScore: avgExpansionScore,
    missions: results,
  }
}
