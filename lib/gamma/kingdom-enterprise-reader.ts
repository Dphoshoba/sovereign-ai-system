import { MissionKingdomEnterpriseWorkspace } from "@/lib/kingdom-enterprise/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionKingdomEnterprise(slug: string): Promise<MissionKingdomEnterpriseWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const enterpriseScore = clamp(Math.floor((core.intelligenceScore * 0.5 + core.knowledgeCapital * 0.5)), 0, 100)
  const scaleScore = clamp(Math.floor((core.learningVelocity * 0.6 + core.adaptabilityScore * 0.4)), 0, 100)
  const disciplineScore = clamp(Math.floor((core.adaptabilityScore * 0.7 + core.intelligenceScore * 0.3)), 0, 100)
  const leadershipScore = clamp(Math.floor((core.intelligenceScore * 0.6 + core.knowledgeCapital * 0.4)), 0, 100)
  const operationalScore = clamp(Math.floor((disciplineScore * 0.5 + scaleScore * 0.5)), 0, 100)
  const financialScore = clamp(Math.floor((core.knowledgeCapital * 0.6 + core.intelligenceScore * 0.4)), 0, 100)
  const culturalScore = clamp(Math.floor((leadershipScore * 0.6 + enterpriseScore * 0.4)), 0, 100)

  return {
    mission: slug,
    missionTitle: mission.title,
    enterpriseScore,
    scaleScore,
    disciplineScore,
    leadershipScore,
    operationalScore,
    financialScore,
    culturalScore,
    healthScore: enterpriseScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getKingdomEnterpriseRegistry(): Promise<{
  enterpriseScore: number
  scaleScore: number
  disciplineScore: number
  leadershipScore: number
  operationalScore: number
  financialScore: number
  culturalScore: number
  healthScore: number
  missions: MissionKingdomEnterpriseWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionKingdomEnterpriseWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionKingdomEnterprise(mission.slug)
    if (workspace) results.push(workspace)
  }

  return {
    enterpriseScore: Math.floor(results.reduce((sum, r) => sum + r.enterpriseScore, 0) / results.length),
    scaleScore: Math.floor(results.reduce((sum, r) => sum + r.scaleScore, 0) / results.length),
    disciplineScore: Math.floor(results.reduce((sum, r) => sum + r.disciplineScore, 0) / results.length),
    leadershipScore: Math.floor(results.reduce((sum, r) => sum + r.leadershipScore, 0) / results.length),
    operationalScore: Math.floor(results.reduce((sum, r) => sum + r.operationalScore, 0) / results.length),
    financialScore: Math.floor(results.reduce((sum, r) => sum + r.financialScore, 0) / results.length),
    culturalScore: Math.floor(results.reduce((sum, r) => sum + r.culturalScore, 0) / results.length),
    healthScore: Math.floor(results.reduce((sum, r) => sum + r.enterpriseScore, 0) / results.length),
    missions: results,
  }
}
