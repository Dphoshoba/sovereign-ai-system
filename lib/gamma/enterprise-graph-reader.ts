import { MissionEnterpriseGraphWorkspace } from "@/lib/enterprise-graph/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionEnterpriseGraph(
  slug: string
): Promise<MissionEnterpriseGraphWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const graphCoverage = clamp(
    Math.floor((core.intelligenceScore * 0.65 + core.adaptabilityScore * 0.35)),
    0,
    100
  )
  const relationshipDensity = clamp(
    Math.floor((core.knowledgeCapital * 0.6 + core.learningVelocity * 0.4)),
    0,
    100
  )
  const graphHealth = clamp(
    Math.floor((graphCoverage * 0.5 + relationshipDensity * 0.5)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    enterpriseNodes: 156,
    enterpriseEdges: 892,
    graphCoverage,
    relationshipDensity,
    graphHealth,
    healthScore: graphHealth,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getEnterpriseGraphRegistry(): Promise<{
  enterpriseNodes: number
  enterpriseEdges: number
  graphCoverage: number
  relationshipDensity: number
  graphHealth: number
  healthScore: number
  missions: MissionEnterpriseGraphWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionEnterpriseGraphWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionEnterpriseGraph(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgGraphCoverage = Math.floor(
    results.reduce((sum, r) => sum + r.graphCoverage, 0) / results.length
  )
  const avgRelationshipDensity = Math.floor(
    results.reduce((sum, r) => sum + r.relationshipDensity, 0) / results.length
  )
  const avgGraphHealth = Math.floor(
    results.reduce((sum, r) => sum + r.graphHealth, 0) / results.length
  )

  return {
    enterpriseNodes: results.length * 156,
    enterpriseEdges: results.length * 892,
    graphCoverage: avgGraphCoverage,
    relationshipDensity: avgRelationshipDensity,
    graphHealth: avgGraphHealth,
    healthScore: avgGraphHealth,
    missions: results,
  }
}
