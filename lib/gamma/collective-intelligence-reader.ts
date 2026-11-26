import { MissionCollectiveIntelligenceWorkspace } from "@/lib/collective-intelligence/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionCollectiveIntelligence(
  slug: string
): Promise<MissionCollectiveIntelligenceWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const crossMissionLearning = clamp(
    Math.floor((core.learningVelocity * 0.7 + core.intelligenceScore * 0.3)),
    0,
    100
  )
  const knowledgeReuse = clamp(
    Math.floor((core.knowledgeCapital * 0.6 + core.innovationCapacity * 0.4)),
    0,
    100
  )
  const adaptationCapacity = clamp(
    Math.floor((core.adaptabilityScore * 0.7 + core.learningVelocity * 0.3)),
    0,
    100
  )
  const collectiveScore = clamp(
    Math.floor(
      (crossMissionLearning * 0.3 + knowledgeReuse * 0.3 + adaptationCapacity * 0.4)
    ),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    collectiveScore,
    crossMissionLearning,
    knowledgeReuse,
    adaptationCapacity,
    coordinationScore: 79,
    healthScore: collectiveScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getCollectiveIntelligenceRegistry(): Promise<{
  collectiveScore: number
  crossMissionLearning: number
  knowledgeReuse: number
  adaptationCapacity: number
  coordinationScore: number
  healthScore: number
  missions: MissionCollectiveIntelligenceWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionCollectiveIntelligenceWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionCollectiveIntelligence(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgCollectiveScore = Math.floor(
    results.reduce((sum, r) => sum + r.collectiveScore, 0) / results.length
  )
  const avgCrossMissionLearning = Math.floor(
    results.reduce((sum, r) => sum + r.crossMissionLearning, 0) / results.length
  )
  const avgKnowledgeReuse = Math.floor(
    results.reduce((sum, r) => sum + r.knowledgeReuse, 0) / results.length
  )
  const avgAdaptationCapacity = Math.floor(
    results.reduce((sum, r) => sum + r.adaptationCapacity, 0) / results.length
  )

  return {
    collectiveScore: avgCollectiveScore,
    crossMissionLearning: avgCrossMissionLearning,
    knowledgeReuse: avgKnowledgeReuse,
    adaptationCapacity: avgAdaptationCapacity,
    coordinationScore: 79,
    healthScore: avgCollectiveScore,
    missions: results,
  }
}
