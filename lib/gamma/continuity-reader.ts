import { MissionContinuityWorkspace } from "@/lib/continuity/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionContinuity(slug: string): Promise<MissionContinuityWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const continuityScore = clamp(
    Math.floor((core.adaptabilityScore * 0.7 + core.intelligenceScore * 0.3)),
    0,
    100
  )
  const resilienceScore = clamp(
    Math.floor((core.adaptabilityScore * 0.8 + core.learningVelocity * 0.2)),
    0,
    100
  )
  const adaptabilityScore = clamp(
    Math.floor((core.learningVelocity * 0.7 + core.adaptabilityScore * 0.3)),
    0,
    100
  )
  const successorReadiness = clamp(
    Math.floor((core.knowledgeCapital * 0.6 + core.intelligenceScore * 0.4)),
    0,
    100
  )
  const knowledgePreservation = clamp(
    Math.floor((core.knowledgeCapital * 0.9 + core.intelligenceScore * 0.1)),
    0,
    100
  )
  const systemIntegrity = clamp(
    Math.floor((core.intelligenceScore * 0.8 + core.adaptabilityScore * 0.2)),
    0,
    100
  )
  const recoveryCapacity = clamp(
    Math.floor((resilienceScore * 0.8 + adaptabilityScore * 0.2)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    continuityScore,
    resilienceScore,
    adaptabilityScore,
    successorReadiness,
    knowledgePreservation,
    systemIntegrity,
    recoveryCapacity,
    healthScore: continuityScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getContinuityRegistry(): Promise<{
  continuityScore: number
  resilienceScore: number
  adaptabilityScore: number
  successorReadiness: number
  knowledgePreservation: number
  systemIntegrity: number
  recoveryCapacity: number
  healthScore: number
  missions: MissionContinuityWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionContinuityWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionContinuity(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgContinuityScore = Math.floor(
    results.reduce((sum, r) => sum + r.continuityScore, 0) / results.length
  )
  const avgResilienceScore = Math.floor(
    results.reduce((sum, r) => sum + r.resilienceScore, 0) / results.length
  )
  const avgAdaptabilityScore = Math.floor(
    results.reduce((sum, r) => sum + r.adaptabilityScore, 0) / results.length
  )
  const avgSuccessorReadiness = Math.floor(
    results.reduce((sum, r) => sum + r.successorReadiness, 0) / results.length
  )
  const avgKnowledgePreservation = Math.floor(
    results.reduce((sum, r) => sum + r.knowledgePreservation, 0) / results.length
  )
  const avgSystemIntegrity = Math.floor(
    results.reduce((sum, r) => sum + r.systemIntegrity, 0) / results.length
  )
  const avgRecoveryCapacity = Math.floor(
    results.reduce((sum, r) => sum + r.recoveryCapacity, 0) / results.length
  )

  return {
    continuityScore: avgContinuityScore,
    resilienceScore: avgResilienceScore,
    adaptabilityScore: avgAdaptabilityScore,
    successorReadiness: avgSuccessorReadiness,
    knowledgePreservation: avgKnowledgePreservation,
    systemIntegrity: avgSystemIntegrity,
    recoveryCapacity: avgRecoveryCapacity,
    healthScore: avgContinuityScore,
    missions: results,
  }
}
