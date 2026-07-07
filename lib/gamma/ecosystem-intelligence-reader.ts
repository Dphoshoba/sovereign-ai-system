import { MissionEcosystemIntelligenceWorkspace } from "@/lib/ecosystem-intelligence/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionEcosystemIntelligence(
  slug: string
): Promise<MissionEcosystemIntelligenceWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const ecosystemScore = clamp(
    Math.floor((core.intelligenceScore * 0.7 + core.adaptabilityScore * 0.3)),
    0,
    100
  )
  const crossDomainReuse = clamp(
    Math.floor((core.knowledgeCapital * 0.6 + core.innovationCapacity * 0.4)),
    0,
    100
  )
  const synergyScore = clamp(
    Math.floor((ecosystemScore * 0.5 + crossDomainReuse * 0.5)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    ecosystemScore,
    ecosystemBreadth: 85,
    ecosystemDepth: 78,
    crossDomainReuse,
    synergyScore,
    healthScore: synergyScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getEcosystemIntelligenceRegistry(): Promise<{
  ecosystemScore: number
  ecosystemBreadth: number
  ecosystemDepth: number
  crossDomainReuse: number
  synergyScore: number
  healthScore: number
  missions: MissionEcosystemIntelligenceWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionEcosystemIntelligenceWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionEcosystemIntelligence(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgEcosystemScore = Math.floor(
    results.reduce((sum, r) => sum + r.ecosystemScore, 0) / results.length
  )
  const avgCrossDomainReuse = Math.floor(
    results.reduce((sum, r) => sum + r.crossDomainReuse, 0) / results.length
  )
  const avgSynergyScore = Math.floor(
    results.reduce((sum, r) => sum + r.synergyScore, 0) / results.length
  )

  return {
    ecosystemScore: avgEcosystemScore,
    ecosystemBreadth: 85,
    ecosystemDepth: 78,
    crossDomainReuse: avgCrossDomainReuse,
    synergyScore: avgSynergyScore,
    healthScore: avgSynergyScore,
    missions: results,
  }
}
