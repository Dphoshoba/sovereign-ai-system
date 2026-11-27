import { MissionPortfolioFederationWorkspace } from "@/lib/portfolio-federation/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionPortfolioFederation(
  slug: string
): Promise<MissionPortfolioFederationWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const missionAlignment = clamp(
    Math.floor((core.intelligenceScore * 0.6 + core.knowledgeCapital * 0.4)),
    0,
    100
  )
  const assetReuse = clamp(
    Math.floor((core.knowledgeCapital * 0.7 + core.learningVelocity * 0.3)),
    0,
    100
  )
  const capitalEfficiency = clamp(
    Math.floor((missionAlignment * 0.5 + assetReuse * 0.5)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    portfolioCount: 4,
    missionAlignment,
    assetReuse,
    capitalEfficiency,
    portfolioScore: capitalEfficiency,
    healthScore: capitalEfficiency,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getPortfolioFederationRegistry(): Promise<{
  portfolioCount: number
  missionAlignment: number
  assetReuse: number
  capitalEfficiency: number
  portfolioScore: number
  healthScore: number
  missions: MissionPortfolioFederationWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionPortfolioFederationWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionPortfolioFederation(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgMissionAlignment = Math.floor(
    results.reduce((sum, r) => sum + r.missionAlignment, 0) / results.length
  )
  const avgAssetReuse = Math.floor(
    results.reduce((sum, r) => sum + r.assetReuse, 0) / results.length
  )
  const avgCapitalEfficiency = Math.floor(
    results.reduce((sum, r) => sum + r.capitalEfficiency, 0) / results.length
  )

  return {
    portfolioCount: results.length * 4,
    missionAlignment: avgMissionAlignment,
    assetReuse: avgAssetReuse,
    capitalEfficiency: avgCapitalEfficiency,
    portfolioScore: avgCapitalEfficiency,
    healthScore: avgCapitalEfficiency,
    missions: results,
  }
}
