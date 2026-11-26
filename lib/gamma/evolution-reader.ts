import { getGammaNexusRegistry } from "./gamma-nexus-reader"
import { getGrowthRegistry } from "./growth-reader"
import { getResearchMissions } from "./research-registry"
import { buildEvolutionRoadmap } from "../evolution/mock-data"
import type { MissionEvolutionWorkspace, EvolutionPhase } from "../evolution/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionEvolution(slug: string): Promise<MissionEvolutionWorkspace | null> {
  const gammaNexus = await getGammaNexusRegistry()
  const growth = await getGrowthRegistry()

  if (!gammaNexus || !growth) {
    return null
  }

  const phaseCount = 3
  const buildCount = 50
  const capabilityScore = clamp(gammaNexus.enterpriseScore, 0, 100)
  const autonomyScore = clamp(gammaNexus.autonomyScore, 0, 100)
  const growthVelocity = clamp(growth.growthVelocity, 0, 100)
  const evolutionScore = clamp(Math.floor((capabilityScore * 0.4 + autonomyScore * 0.35 + growthVelocity * 0.25)), 0, 100)
  const healthScore = clamp(Math.floor((evolutionScore * 0.5 + capabilityScore * 0.25 + autonomyScore * 0.25)), 0, 100)

  const phases: EvolutionPhase[] = Array.from({ length: phaseCount }, (_, i) => ({
    phaseId: `phase-${i + 1}`,
    phaseName: `Evolution Phase ${i + 1}`,
    capabilityGain: (capabilityScore * (i + 1)) / phaseCount,
    autonomyGain: (autonomyScore * (i + 1)) / phaseCount,
    growthAcceleration: growthVelocity * (1 + i * 0.2),
  }))

  return {
    mission: slug,
    missionTitle: "Research Mission 001",
    phaseCount,
    buildCount,
    capabilityScore,
    autonomyScore,
    growthVelocity,
    evolutionScore,
    healthScore,
    phases,
    recommendations: ["Accelerate evolution", "Expand autonomy", "Increase capability"],
    roadmap: buildEvolutionRoadmap(slug),
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

export async function getEvolutionRegistry(): Promise<{
  phaseCount: number
  buildCount: number
  capabilityScore: number
  autonomyScore: number
  growthVelocity: number
  evolutionScore: number
  healthScore: number
  missions: MissionEvolutionWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionEvolutionWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionEvolution(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const phaseCount = missionCount > 0 ? 3 : 0
  const buildCount = missionCount > 0 ? 50 : 0
  const capabilityScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.capabilityScore, 0) / missionCount) : 0
  const autonomyScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.autonomyScore, 0) / missionCount) : 0
  const growthVelocity = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.growthVelocity, 0) / missionCount) : 0
  const evolutionScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.evolutionScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    phaseCount,
    buildCount,
    capabilityScore,
    autonomyScore,
    growthVelocity,
    evolutionScore,
    healthScore,
    missions: results,
  }
}
