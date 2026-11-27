import { getGrowthRegistry } from "./growth-reader"
import { getAdvisorRegistry } from "./advisor-reader"
import { getResearchMissions } from "./research-registry"
import { buildImpactRoadmap } from "../impact/mock-data"
import type { MissionImpactWorkspace, ImpactArea } from "../impact/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionImpact(slug: string): Promise<MissionImpactWorkspace | null> {
  const growth = await getGrowthRegistry()
  const advisor = await getAdvisorRegistry()

  if (!growth || !advisor) {
    return null
  }

  const impactAreas = 4
  const peopleReached = Math.floor(growth.adoptionScore * 100)
  const missionInfluence = clamp(Math.floor((advisor.missionFocusScore * 0.6 + growth.communityScore * 0.4)), 0, 100)
  const societalValue = clamp(Math.floor((missionInfluence * 0.5 + advisor.healthScore * 0.5)), 0, 100)
  const legacyScore = clamp(Math.floor((missionInfluence * 0.4 + societalValue * 0.6)), 0, 100)
  const impactScore = clamp(Math.floor((peopleReached / 100 * 0.35 + missionInfluence * 0.35 + societalValue * 0.3)), 0, 100)
  const healthScore = clamp(Math.floor((impactScore * 0.5 + legacyScore * 0.35 + missionInfluence * 0.15)), 0, 100)

  const areas: ImpactArea[] = Array.from({ length: impactAreas }, (_, i) => ({
    areaId: `area-${i + 1}`,
    areaName: `Impact Area ${i + 1}`,
    peopleReached: Math.floor(peopleReached * (0.7 - i * 0.1)),
    influenceScore: missionInfluence - i * 5,
    legacyValue: legacyScore - i * 3,
  }))

  return {
    mission: slug,
    missionTitle: "Research Mission 001",
    impactAreas,
    peopleReached,
    missionInfluence,
    societalValue,
    legacyScore,
    impactScore,
    healthScore,
    areas,
    recommendations: ["Expand reach", "Strengthen influence", "Build legacy"],
    roadmap: buildImpactRoadmap(slug),
    readOnly: true,
    previewOnly: true,
    noAuth: true,
    noSessions: true,
    noJwt: true,
    noDatabase: true,
    noExecution: true,
    noPublishing: true,
    noOpenAI: true,
    noGraphWrites: true,
    noSocialPosting: true,
  }
}

export async function getImpactRegistry(): Promise<{
  impactAreas: number
  peopleReached: number
  missionInfluence: number
  societalValue: number
  legacyScore: number
  impactScore: number
  healthScore: number
  missions: MissionImpactWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionImpactWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionImpact(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const impactAreas = missionCount > 0 ? 4 : 0
  const peopleReached = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.peopleReached, 0) / missionCount) : 0
  const missionInfluence = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.missionInfluence, 0) / missionCount) : 0
  const societalValue = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.societalValue, 0) / missionCount) : 0
  const legacyScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.legacyScore, 0) / missionCount) : 0
  const impactScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.impactScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    impactAreas,
    peopleReached,
    missionInfluence,
    societalValue,
    legacyScore,
    impactScore,
    healthScore,
    missions: results,
  }
}
