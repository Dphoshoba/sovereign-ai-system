import { MissionLegacyWorkspace } from "@/lib/legacy/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionLegacy(slug: string): Promise<MissionLegacyWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const legacyScore = clamp(
    Math.floor((core.knowledgeCapital * 0.8 + core.intelligenceScore * 0.2)),
    0,
    100
  )
  const historicalValue = clamp(
    Math.floor((core.knowledgeCapital * 0.9 + core.adaptabilityScore * 0.1)),
    0,
    100
  )
  const preservationScore = clamp(
    Math.floor((core.intelligenceScore * 0.6 + core.knowledgeCapital * 0.4)),
    0,
    100
  )
  const continuity = clamp(
    Math.floor((core.adaptabilityScore * 0.7 + core.learningVelocity * 0.3)),
    0,
    100
  )
  const inheritanceScore = clamp(
    Math.floor((core.knowledgeCapital * 0.7 + core.intelligenceScore * 0.3)),
    0,
    100
  )
  const impactScore = clamp(
    Math.floor((core.intelligenceScore * 0.5 + core.knowledgeCapital * 0.5)),
    0,
    100
  )
  const wisdomTransfer = clamp(
    Math.floor((core.learningVelocity * 0.6 + core.knowledgeCapital * 0.4)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    legacyScore,
    historicalValue,
    preservationScore,
    continuity,
    inheritanceScore,
    impactScore,
    wisdomTransfer,
    healthScore: legacyScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getLegacyRegistry(): Promise<{
  legacyScore: number
  historicalValue: number
  preservationScore: number
  continuity: number
  inheritanceScore: number
  impactScore: number
  wisdomTransfer: number
  healthScore: number
  missions: MissionLegacyWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionLegacyWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionLegacy(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgLegacyScore = Math.floor(
    results.reduce((sum, r) => sum + r.legacyScore, 0) / results.length
  )
  const avgHistoricalValue = Math.floor(
    results.reduce((sum, r) => sum + r.historicalValue, 0) / results.length
  )
  const avgPreservationScore = Math.floor(
    results.reduce((sum, r) => sum + r.preservationScore, 0) / results.length
  )
  const avgContinuity = Math.floor(
    results.reduce((sum, r) => sum + r.continuity, 0) / results.length
  )
  const avgInheritanceScore = Math.floor(
    results.reduce((sum, r) => sum + r.inheritanceScore, 0) / results.length
  )
  const avgImpactScore = Math.floor(
    results.reduce((sum, r) => sum + r.impactScore, 0) / results.length
  )
  const avgWisdomTransfer = Math.floor(
    results.reduce((sum, r) => sum + r.wisdomTransfer, 0) / results.length
  )

  return {
    legacyScore: avgLegacyScore,
    historicalValue: avgHistoricalValue,
    preservationScore: avgPreservationScore,
    continuity: avgContinuity,
    inheritanceScore: avgInheritanceScore,
    impactScore: avgImpactScore,
    wisdomTransfer: avgWisdomTransfer,
    healthScore: avgLegacyScore,
    missions: results,
  }
}
