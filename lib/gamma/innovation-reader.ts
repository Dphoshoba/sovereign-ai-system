import { getGrowthRegistry } from "./growth-reader"
import { getMonetizationRegistry } from "./monetization-reader"
import { getResearchMissions } from "./research-registry"
import { buildInnovationRoadmap } from "../innovation/mock-data"
import type { MissionInnovationWorkspace, InnovationIdea } from "../innovation/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionInnovation(slug: string): Promise<MissionInnovationWorkspace | null> {
  const growth = await getGrowthRegistry()
  const monetization = await getMonetizationRegistry()

  if (!growth || !monetization) {
    return null
  }

  const innovationCount = 6
  const newConcepts = 4
  const prototypeCount = 3
  const ideaVelocity = clamp(Math.floor((growth.growthVelocity * 0.5 + growth.adoptionScore * 0.5)), 0, 100)
  const innovationScore = clamp(Math.floor((ideaVelocity * 0.4 + monetization.revenueScore * 0.6)), 0, 100)
  const commercialPotential = clamp(Math.floor((monetization.commercialAssets * 2.5 + innovationScore * 0.5)), 0, 100)
  const healthScore = clamp(Math.floor((innovationScore * 0.5 + commercialPotential * 0.35 + ideaVelocity * 0.15)), 0, 100)

  const ideas: InnovationIdea[] = Array.from({ length: innovationCount }, (_, i) => ({
    ideaId: `idea-${i + 1}`,
    ideaName: `Innovation ${i + 1}`,
    noveltyScore: 85 - i * 5,
    feasibilityScore: 75 - i * 3,
    commercialPotential: commercialPotential - i * 4,
  }))

  return {
    mission: slug,
    missionTitle: "Research Mission 001",
    innovationCount,
    newConcepts,
    prototypeCount,
    ideaVelocity,
    innovationScore,
    commercialPotential,
    healthScore,
    ideas,
    recommendations: ["Accelerate prototyping", "Increase idea generation", "Focus on commercialization"],
    roadmap: buildInnovationRoadmap(slug),
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

export async function getInnovationRegistry(): Promise<{
  innovationCount: number
  newConcepts: number
  prototypeCount: number
  ideaVelocity: number
  innovationScore: number
  commercialPotential: number
  healthScore: number
  missions: MissionInnovationWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionInnovationWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionInnovation(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const innovationCount = missionCount > 0 ? 6 : 0
  const newConcepts = missionCount > 0 ? 4 : 0
  const prototypeCount = missionCount > 0 ? 3 : 0
  const ideaVelocity = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.ideaVelocity, 0) / missionCount) : 0
  const innovationScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.innovationScore, 0) / missionCount) : 0
  const commercialPotential = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.commercialPotential, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    innovationCount,
    newConcepts,
    prototypeCount,
    ideaVelocity,
    innovationScore,
    commercialPotential,
    healthScore,
    missions: results,
  }
}
