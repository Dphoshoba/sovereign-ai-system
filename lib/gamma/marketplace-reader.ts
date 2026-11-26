import { MissionMarketplaceWorkspace } from "@/lib/marketplace/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionMarketplace(slug: string): Promise<MissionMarketplaceWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const marketValue = clamp(
    Math.floor((core.intelligenceScore * 0.6 + core.knowledgeCapital * 0.4)),
    0,
    100
  )
  const healthScore = clamp(
    Math.floor((marketValue * 0.8 + core.adaptabilityScore * 0.2)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    assetCount: 24,
    courseCount: 8,
    frameworkCount: 6,
    bookCount: 4,
    seriesCount: 3,
    marketValue,
    healthScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getMarketplaceRegistry(): Promise<{
  assetCount: number
  courseCount: number
  frameworkCount: number
  bookCount: number
  seriesCount: number
  marketValue: number
  healthScore: number
  missions: MissionMarketplaceWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionMarketplaceWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionMarketplace(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgMarketValue = Math.floor(
    results.reduce((sum, r) => sum + r.marketValue, 0) / results.length
  )
  const avgHealthScore = Math.floor(
    results.reduce((sum, r) => sum + r.healthScore, 0) / results.length
  )

  return {
    assetCount: results.length * 24,
    courseCount: results.length * 8,
    frameworkCount: results.length * 6,
    bookCount: results.length * 4,
    seriesCount: results.length * 3,
    marketValue: avgMarketValue,
    healthScore: avgHealthScore,
    missions: results,
  }
}
