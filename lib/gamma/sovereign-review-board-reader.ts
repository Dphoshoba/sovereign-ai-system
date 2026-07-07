import { MissionSovereignReviewBoardWorkspace } from "@/lib/sovereign-review-board/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionSovereignReviewBoard(
  slug: string
): Promise<MissionSovereignReviewBoardWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const reviewScore = clamp(
    Math.floor((core.intelligenceScore * 0.6 + core.knowledgeCapital * 0.4)),
    0,
    100
  )
  const governance = clamp(
    Math.floor((core.knowledgeCapital * 0.6 + core.intelligenceScore * 0.4)),
    0,
    100
  )
  const transparency = clamp(
    Math.floor((core.intelligenceScore * 0.7 + core.knowledgeCapital * 0.3)),
    0,
    100
  )
  const accountability = clamp(
    Math.floor((core.adaptabilityScore * 0.5 + core.intelligenceScore * 0.5)),
    0,
    100
  )
  const oversight = clamp(
    Math.floor((core.knowledgeCapital * 0.5 + core.adaptabilityScore * 0.5)),
    0,
    100
  )
  const authority = clamp(
    Math.floor((core.intelligenceScore * 0.6 + core.learningVelocity * 0.4)),
    0,
    100
  )
  const legitimacy = clamp(
    Math.floor((core.knowledgeCapital * 0.7 + core.intelligenceScore * 0.3)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    reviewScore,
    governance,
    transparency,
    accountability,
    oversight,
    authority,
    legitimacy,
    healthScore: reviewScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getSovereignReviewBoardRegistry(): Promise<{
  reviewScore: number
  governance: number
  transparency: number
  accountability: number
  oversight: number
  authority: number
  legitimacy: number
  healthScore: number
  missions: MissionSovereignReviewBoardWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionSovereignReviewBoardWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionSovereignReviewBoard(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgReviewScore = Math.floor(results.reduce((sum, r) => sum + r.reviewScore, 0) / results.length)
  const avgGovernance = Math.floor(results.reduce((sum, r) => sum + r.governance, 0) / results.length)
  const avgTransparency = Math.floor(results.reduce((sum, r) => sum + r.transparency, 0) / results.length)
  const avgAccountability = Math.floor(
    results.reduce((sum, r) => sum + r.accountability, 0) / results.length
  )
  const avgOversight = Math.floor(results.reduce((sum, r) => sum + r.oversight, 0) / results.length)
  const avgAuthority = Math.floor(results.reduce((sum, r) => sum + r.authority, 0) / results.length)
  const avgLegitimacy = Math.floor(results.reduce((sum, r) => sum + r.legitimacy, 0) / results.length)

  return {
    reviewScore: avgReviewScore,
    governance: avgGovernance,
    transparency: avgTransparency,
    accountability: avgAccountability,
    oversight: avgOversight,
    authority: avgAuthority,
    legitimacy: avgLegitimacy,
    healthScore: avgReviewScore,
    missions: results,
  }
}
