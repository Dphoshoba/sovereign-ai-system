import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"
import { getResearchMissions } from "./research-registry"
import { buildMetaIntelligenceRoadmap } from "../meta-intelligence/mock-data"
import type { MissionMetaIntelligenceWorkspace, MetaCapability } from "../meta-intelligence/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionMetaIntelligence(slug: string): Promise<MissionMetaIntelligenceWorkspace | null> {
  const core = await getIntelligenceCoreRegistry()

  if (!core) {
    return null
  }

  const metaScore = clamp(Math.floor((core.intelligenceScore * 0.7 + core.adaptabilityScore * 0.3)), 0, 100)
  const systemAwareness = clamp(Math.floor((core.ecosystemStrength * 0.5 + core.knowledgeCapital * 0.5)), 0, 100)
  const crossDomainReasoning = clamp(Math.floor((core.intelligenceScore * 0.4 + core.knowledgeCapital * 0.6)), 0, 100)
  const optimizationDepth = clamp(Math.floor((core.learningVelocity * 0.5 + core.adaptabilityScore * 0.5)), 0, 100)
  const healthScore = clamp(Math.floor((metaScore * 0.35 + systemAwareness * 0.25 + crossDomainReasoning * 0.25 + optimizationDepth * 0.15)), 0, 100)

  const capabilities: MetaCapability[] = Array.from({ length: 4 }, (_, i) => ({
    capabilityId: `meta-${i + 1}`,
    name: `Meta-Intelligence Capability ${i + 1}`,
    score: metaScore - i * 6,
    sophistication: 60 + i * 10,
  }))

  return {
    mission: slug,
    missionTitle: "Research Mission 001",
    metaScore,
    systemAwareness,
    crossDomainReasoning,
    optimizationDepth,
    healthScore,
    capabilities,
    recommendations: ["Deepen optimization", "Expand reasoning", "Increase system awareness"],
    roadmap: buildMetaIntelligenceRoadmap(slug),
    readOnly: true,
    previewOnly: true,
    noAuth: true,
    noSessions: true,
    noJwt: true,
    noDatabase: true,
    noExecution: true,
    noPublishing: true,
    noOpenAI: true,
    noGraphWrites: true,
    noSocialPosting: true,
  }
}

export async function getMetaIntelligenceRegistry(): Promise<{
  metaScore: number
  systemAwareness: number
  crossDomainReasoning: number
  optimizationDepth: number
  healthScore: number
  missions: MissionMetaIntelligenceWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionMetaIntelligenceWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionMetaIntelligence(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgMeta = results.reduce((s, w) => s + w.metaScore, 0) / results.length || 0
  const avgSystem = results.reduce((s, w) => s + w.systemAwareness, 0) / results.length || 0
  const avgCross = results.reduce((s, w) => s + w.crossDomainReasoning, 0) / results.length || 0
  const avgOptimization = results.reduce((s, w) => s + w.optimizationDepth, 0) / results.length || 0

  return {
    metaScore: Math.floor(avgMeta),
    systemAwareness: Math.floor(avgSystem),
    crossDomainReasoning: Math.floor(avgCross),
    optimizationDepth: Math.floor(avgOptimization),
    healthScore: Math.floor((avgMeta * 0.35 + avgSystem * 0.25 + avgCross * 0.25 + avgOptimization * 0.15)),
    missions: results,
  }
}
