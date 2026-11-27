import { MissionCivilizationIntelligenceWorkspace } from "@/lib/civilization-intelligence/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionCivilizationIntelligence(slug: string): Promise<MissionCivilizationIntelligenceWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const civilizationScore = clamp(
    Math.floor((core.intelligenceScore * 0.8 + core.knowledgeCapital * 0.2)),
    0,
    100
  )
  const culturalMaturity = clamp(
    Math.floor((core.knowledgeCapital * 0.7 + core.adaptabilityScore * 0.3)),
    0,
    100
  )
  const systemComplexity = clamp(
    Math.floor((core.intelligenceScore * 0.9 + core.learningVelocity * 0.1)),
    0,
    100
  )
  const resilienceScore = clamp(
    Math.floor((core.adaptabilityScore * 0.8 + core.learningVelocity * 0.2)),
    0,
    100
  )
  const knowledgeCapital = clamp(
    Math.floor((core.knowledgeCapital * 0.95 + core.intelligenceScore * 0.05)),
    0,
    100
  )
  const symbolicScore = clamp(
    Math.floor((culturalMaturity * 0.7 + systemComplexity * 0.3)),
    0,
    100
  )
  const evolutionScore = clamp(
    Math.floor((core.learningVelocity * 0.8 + systemComplexity * 0.2)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    civilizationScore,
    culturalMaturity,
    systemComplexity,
    resilienceScore,
    knowledgeCapital,
    symbolicScore,
    evolutionScore,
    healthScore: civilizationScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getCivilizationIntelligenceRegistry(): Promise<{
  civilizationScore: number
  culturalMaturity: number
  systemComplexity: number
  resilienceScore: number
  knowledgeCapital: number
  symbolicScore: number
  evolutionScore: number
  healthScore: number
  missions: MissionCivilizationIntelligenceWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionCivilizationIntelligenceWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionCivilizationIntelligence(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgCivilizationScore = Math.floor(
    results.reduce((sum, r) => sum + r.civilizationScore, 0) / results.length
  )
  const avgCulturalMaturity = Math.floor(
    results.reduce((sum, r) => sum + r.culturalMaturity, 0) / results.length
  )
  const avgSystemComplexity = Math.floor(
    results.reduce((sum, r) => sum + r.systemComplexity, 0) / results.length
  )
  const avgResilienceScore = Math.floor(
    results.reduce((sum, r) => sum + r.resilienceScore, 0) / results.length
  )
  const avgKnowledgeCapital = Math.floor(
    results.reduce((sum, r) => sum + r.knowledgeCapital, 0) / results.length
  )
  const avgSymbolicScore = Math.floor(
    results.reduce((sum, r) => sum + r.symbolicScore, 0) / results.length
  )
  const avgEvolutionScore = Math.floor(
    results.reduce((sum, r) => sum + r.evolutionScore, 0) / results.length
  )

  return {
    civilizationScore: avgCivilizationScore,
    culturalMaturity: avgCulturalMaturity,
    systemComplexity: avgSystemComplexity,
    resilienceScore: avgResilienceScore,
    knowledgeCapital: avgKnowledgeCapital,
    symbolicScore: avgSymbolicScore,
    evolutionScore: avgEvolutionScore,
    healthScore: avgCivilizationScore,
    missions: results,
  }
}
