import { MissionSovereignRiskWorkspace } from "@/lib/sovereign-risk/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionSovereignRisk(slug: string): Promise<MissionSovereignRiskWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const riskScore = clamp(
    Math.floor((core.intelligenceScore * 0.6 + core.adaptabilityScore * 0.4)),
    0,
    100
  )
  const threatAssessment = clamp(
    Math.floor((core.learningVelocity * 0.5 + core.adaptabilityScore * 0.5)),
    0,
    100
  )
  const mitigationScore = clamp(
    Math.floor((core.knowledgeCapital * 0.6 + core.intelligenceScore * 0.4)),
    0,
    100
  )
  const resilience = clamp(
    Math.floor((core.adaptabilityScore * 0.7 + core.learningVelocity * 0.3)),
    0,
    100
  )
  const recovery = clamp(
    Math.floor((core.knowledgeCapital * 0.5 + core.intelligenceScore * 0.5)),
    0,
    100
  )
  const contingency = clamp(
    Math.floor((core.adaptabilityScore * 0.6 + core.learningVelocity * 0.4)),
    0,
    100
  )
  const adaptability = clamp(
    Math.floor((core.learningVelocity * 0.8 + core.intelligenceScore * 0.2)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    riskScore,
    threatAssessment,
    mitigationScore,
    resilience,
    recovery,
    contingency,
    adaptability,
    healthScore: riskScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getSovereignRiskRegistry(): Promise<{
  riskScore: number
  threatAssessment: number
  mitigationScore: number
  resilience: number
  recovery: number
  contingency: number
  adaptability: number
  healthScore: number
  missions: MissionSovereignRiskWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionSovereignRiskWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionSovereignRisk(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgRiskScore = Math.floor(results.reduce((sum, r) => sum + r.riskScore, 0) / results.length)
  const avgThreatAssessment = Math.floor(
    results.reduce((sum, r) => sum + r.threatAssessment, 0) / results.length
  )
  const avgMitigationScore = Math.floor(
    results.reduce((sum, r) => sum + r.mitigationScore, 0) / results.length
  )
  const avgResilience = Math.floor(results.reduce((sum, r) => sum + r.resilience, 0) / results.length)
  const avgRecovery = Math.floor(results.reduce((sum, r) => sum + r.recovery, 0) / results.length)
  const avgContingency = Math.floor(results.reduce((sum, r) => sum + r.contingency, 0) / results.length)
  const avgAdaptability = Math.floor(
    results.reduce((sum, r) => sum + r.adaptability, 0) / results.length
  )

  return {
    riskScore: avgRiskScore,
    threatAssessment: avgThreatAssessment,
    mitigationScore: avgMitigationScore,
    resilience: avgResilience,
    recovery: avgRecovery,
    contingency: avgContingency,
    adaptability: avgAdaptability,
    healthScore: avgRiskScore,
    missions: results,
  }
}
