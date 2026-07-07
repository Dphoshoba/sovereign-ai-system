import { MissionEnterpriseContinuityOperationsWorkspace } from "@/lib/enterprise-continuity-operations/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionEnterpriseContinuityOperations(
  slug: string
): Promise<MissionEnterpriseContinuityOperationsWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const continuityScore = clamp(
    Math.floor((core.knowledgeCapital * 0.6 + core.adaptabilityScore * 0.4)),
    0,
    100
  )
  const businessContinuity = clamp(
    Math.floor((core.intelligenceScore * 0.5 + core.knowledgeCapital * 0.5)),
    0,
    100
  )
  const disasterRecovery = clamp(
    Math.floor((core.adaptabilityScore * 0.7 + core.learningVelocity * 0.3)),
    0,
    100
  )
  const knowledgePreservation = clamp(
    Math.floor((core.knowledgeCapital * 0.8 + core.intelligenceScore * 0.2)),
    0,
    100
  )
  const systemRedundancy = clamp(
    Math.floor((core.adaptabilityScore * 0.6 + core.intelligenceScore * 0.4)),
    0,
    100
  )
  const failoverCapacity = clamp(
    Math.floor((core.learningVelocity * 0.5 + core.knowledgeCapital * 0.5)),
    0,
    100
  )
  const resilience = clamp(
    Math.floor((core.adaptabilityScore * 0.7 + core.learningVelocity * 0.3)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    continuityScore,
    businessContinuity,
    disasterRecovery,
    knowledgePreservation,
    systemRedundancy,
    failoverCapacity,
    resilience,
    healthScore: continuityScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getEnterpriseContinuityOperationsRegistry(): Promise<{
  continuityScore: number
  businessContinuity: number
  disasterRecovery: number
  knowledgePreservation: number
  systemRedundancy: number
  failoverCapacity: number
  resilience: number
  healthScore: number
  missions: MissionEnterpriseContinuityOperationsWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionEnterpriseContinuityOperationsWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionEnterpriseContinuityOperations(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgContinuityScore = Math.floor(
    results.reduce((sum, r) => sum + r.continuityScore, 0) / results.length
  )
  const avgBusinessContinuity = Math.floor(
    results.reduce((sum, r) => sum + r.businessContinuity, 0) / results.length
  )
  const avgDisasterRecovery = Math.floor(
    results.reduce((sum, r) => sum + r.disasterRecovery, 0) / results.length
  )
  const avgKnowledgePreservation = Math.floor(
    results.reduce((sum, r) => sum + r.knowledgePreservation, 0) / results.length
  )
  const avgSystemRedundancy = Math.floor(
    results.reduce((sum, r) => sum + r.systemRedundancy, 0) / results.length
  )
  const avgFailoverCapacity = Math.floor(
    results.reduce((sum, r) => sum + r.failoverCapacity, 0) / results.length
  )
  const avgResilience = Math.floor(results.reduce((sum, r) => sum + r.resilience, 0) / results.length)

  return {
    continuityScore: avgContinuityScore,
    businessContinuity: avgBusinessContinuity,
    disasterRecovery: avgDisasterRecovery,
    knowledgePreservation: avgKnowledgePreservation,
    systemRedundancy: avgSystemRedundancy,
    failoverCapacity: avgFailoverCapacity,
    resilience: avgResilience,
    healthScore: avgContinuityScore,
    missions: results,
  }
}
