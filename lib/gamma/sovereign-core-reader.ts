import { MissionSovereignCoreWorkspace } from "@/lib/sovereign-core/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"
import { getNetworkRegistry } from "./network-reader"
import { getEcosystemIntelligenceRegistry } from "./ecosystem-intelligence-reader"
import { getCollectiveIntelligenceRegistry } from "./collective-intelligence-reader"
import { getEnterpriseGraphRegistry } from "./enterprise-graph-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionSovereignCore(slug: string): Promise<MissionSovereignCoreWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const sovereignScore = clamp(
    Math.floor((core.intelligenceScore * 0.7 + core.adaptabilityScore * 0.3)),
    0,
    100
  )
  const missionCapital = clamp(
    Math.floor((core.knowledgeCapital * 0.6 + core.learningVelocity * 0.4)),
    0,
    100
  )
  const knowledgeCapital = clamp(
    Math.floor((core.intelligenceScore * 0.5 + core.knowledgeCapital * 0.5)),
    0,
    100
  )
  const resilienceScore = clamp(
    Math.floor((core.adaptabilityScore * 0.8 + core.learningVelocity * 0.2)),
    0,
    100
  )
  const autonomyScore = clamp(
    Math.floor((sovereignScore * 0.5 + resilienceScore * 0.5)),
    0,
    100
  )
  const ecosystemStrength = clamp(
    Math.floor((missionCapital * 0.4 + knowledgeCapital * 0.4 + autonomyScore * 0.2)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    sovereignScore,
    ecosystemStrength,
    networkStrength: 81,
    missionCapital,
    knowledgeCapital,
    resilienceScore,
    autonomyScore,
    healthScore: sovereignScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getSovereignCoreRegistry(): Promise<{
  sovereignScore: number
  ecosystemStrength: number
  networkStrength: number
  missionCapital: number
  knowledgeCapital: number
  resilienceScore: number
  autonomyScore: number
  healthScore: number
  missions: MissionSovereignCoreWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionSovereignCoreWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionSovereignCore(mission.slug)
    if (workspace) results.push(workspace)
  }

  const network = await getNetworkRegistry()
  const ecosystem = await getEcosystemIntelligenceRegistry()
  const collective = await getCollectiveIntelligenceRegistry()
  const enterprise = await getEnterpriseGraphRegistry()

  const avgSovereignScore = Math.floor(
    results.reduce((sum, r) => sum + r.sovereignScore, 0) / results.length
  )
  const avgMissionCapital = Math.floor(
    results.reduce((sum, r) => sum + r.missionCapital, 0) / results.length
  )
  const avgKnowledgeCapital = Math.floor(
    results.reduce((sum, r) => sum + r.knowledgeCapital, 0) / results.length
  )
  const avgResilienceScore = Math.floor(
    results.reduce((sum, r) => sum + r.resilienceScore, 0) / results.length
  )
  const avgAutonomyScore = Math.floor(
    results.reduce((sum, r) => sum + r.autonomyScore, 0) / results.length
  )

  const aggregatedEcosystemStrength = clamp(
    Math.floor(
      (ecosystem.ecosystemScore * 0.25 +
        network.networkHealth * 0.25 +
        collective.collectiveScore * 0.25 +
        enterprise.graphHealth * 0.25) /
        1
    ),
    0,
    100
  )

  return {
    sovereignScore: avgSovereignScore,
    ecosystemStrength: aggregatedEcosystemStrength,
    networkStrength: network.networkHealth,
    missionCapital: avgMissionCapital,
    knowledgeCapital: avgKnowledgeCapital,
    resilienceScore: avgResilienceScore,
    autonomyScore: avgAutonomyScore,
    healthScore: avgSovereignScore,
    missions: results,
  }
}
