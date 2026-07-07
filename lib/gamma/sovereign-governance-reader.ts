import { MissionSovereignGovernanceWorkspace } from "@/lib/sovereign-governance/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionSovereignGovernance(slug: string): Promise<MissionSovereignGovernanceWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const governanceScore = clamp(
    Math.floor((core.intelligenceScore * 0.7 + core.adaptabilityScore * 0.3)),
    0,
    100
  )
  const decisionQuality = clamp(
    Math.floor((core.intelligenceScore * 0.8 + core.knowledgeCapital * 0.2)),
    0,
    100
  )
  const transparencyScore = clamp(
    Math.floor((core.intelligenceScore * 0.6 + core.adaptabilityScore * 0.4)),
    0,
    100
  )
  const accountabilityScore = clamp(
    Math.floor((core.adaptabilityScore * 0.7 + core.learningVelocity * 0.3)),
    0,
    100
  )
  const participationScore = clamp(
    Math.floor((core.learningVelocity * 0.6 + core.intelligenceScore * 0.4)),
    0,
    100
  )
  const legitimacy = clamp(
    Math.floor((governanceScore * 0.7 + transparencyScore * 0.3)),
    0,
    100
  )
  const effectivenessScore = clamp(
    Math.floor((governanceScore * 0.8 + decisionQuality * 0.2)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    governanceScore,
    decisionQuality,
    transparencyScore,
    accountabilityScore,
    participationScore,
    legitimacy,
    effectivenessScore,
    healthScore: governanceScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getSovereignGovernanceRegistry(): Promise<{
  governanceScore: number
  decisionQuality: number
  transparencyScore: number
  accountabilityScore: number
  participationScore: number
  legitimacy: number
  effectivenessScore: number
  healthScore: number
  missions: MissionSovereignGovernanceWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionSovereignGovernanceWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionSovereignGovernance(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgGovernanceScore = Math.floor(
    results.reduce((sum, r) => sum + r.governanceScore, 0) / results.length
  )
  const avgDecisionQuality = Math.floor(
    results.reduce((sum, r) => sum + r.decisionQuality, 0) / results.length
  )
  const avgTransparencyScore = Math.floor(
    results.reduce((sum, r) => sum + r.transparencyScore, 0) / results.length
  )
  const avgAccountabilityScore = Math.floor(
    results.reduce((sum, r) => sum + r.accountabilityScore, 0) / results.length
  )
  const avgParticipationScore = Math.floor(
    results.reduce((sum, r) => sum + r.participationScore, 0) / results.length
  )
  const avgLegitimacy = Math.floor(
    results.reduce((sum, r) => sum + r.legitimacy, 0) / results.length
  )
  const avgEffectivenessScore = Math.floor(
    results.reduce((sum, r) => sum + r.effectivenessScore, 0) / results.length
  )

  return {
    governanceScore: avgGovernanceScore,
    decisionQuality: avgDecisionQuality,
    transparencyScore: avgTransparencyScore,
    accountabilityScore: avgAccountabilityScore,
    participationScore: avgParticipationScore,
    legitimacy: avgLegitimacy,
    effectivenessScore: avgEffectivenessScore,
    healthScore: avgGovernanceScore,
    missions: results,
  }
}
