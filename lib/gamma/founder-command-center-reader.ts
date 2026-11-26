import { MissionFounderCommandCenterWorkspace } from "@/lib/founder-command-center/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionFounderCommandCenter(
  slug: string
): Promise<MissionFounderCommandCenterWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const founderScore = clamp(
    Math.floor((core.intelligenceScore * 0.6 + core.knowledgeCapital * 0.4)),
    0,
    100
  )
  const leadershipScore = clamp(
    Math.floor((core.adaptabilityScore * 0.7 + core.intelligenceScore * 0.3)),
    0,
    100
  )
  const visionary = clamp(
    Math.floor((core.knowledgeCapital * 0.6 + core.learningVelocity * 0.4)),
    0,
    100
  )
  const decisionAuthority = clamp(
    Math.floor((core.intelligenceScore * 0.7 + core.adaptabilityScore * 0.3)),
    0,
    100
  )
  const strategicDirective = clamp(
    Math.floor((core.knowledgeCapital * 0.5 + core.intelligenceScore * 0.5)),
    0,
    100
  )
  const resourceCommand = clamp(
    Math.floor((core.adaptabilityScore * 0.6 + core.knowledgeCapital * 0.4)),
    0,
    100
  )
  const visionRealization = clamp(
    Math.floor((core.learningVelocity * 0.5 + core.intelligenceScore * 0.5)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    founderScore,
    leadershipScore,
    visionary,
    decisionAuthority,
    strategicDirective,
    resourceCommand,
    visionRealization,
    healthScore: founderScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getFounderCommandCenterRegistry(): Promise<{
  founderScore: number
  leadershipScore: number
  visionary: number
  decisionAuthority: number
  strategicDirective: number
  resourceCommand: number
  visionRealization: number
  healthScore: number
  missions: MissionFounderCommandCenterWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionFounderCommandCenterWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionFounderCommandCenter(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgFounderScore = Math.floor(results.reduce((sum, r) => sum + r.founderScore, 0) / results.length)
  const avgLeadershipScore = Math.floor(
    results.reduce((sum, r) => sum + r.leadershipScore, 0) / results.length
  )
  const avgVisionary = Math.floor(results.reduce((sum, r) => sum + r.visionary, 0) / results.length)
  const avgDecisionAuthority = Math.floor(
    results.reduce((sum, r) => sum + r.decisionAuthority, 0) / results.length
  )
  const avgStrategicDirective = Math.floor(
    results.reduce((sum, r) => sum + r.strategicDirective, 0) / results.length
  )
  const avgResourceCommand = Math.floor(
    results.reduce((sum, r) => sum + r.resourceCommand, 0) / results.length
  )
  const avgVisionRealization = Math.floor(
    results.reduce((sum, r) => sum + r.visionRealization, 0) / results.length
  )

  return {
    founderScore: avgFounderScore,
    leadershipScore: avgLeadershipScore,
    visionary: avgVisionary,
    decisionAuthority: avgDecisionAuthority,
    strategicDirective: avgStrategicDirective,
    resourceCommand: avgResourceCommand,
    visionRealization: avgVisionRealization,
    healthScore: avgFounderScore,
    missions: results,
  }
}
