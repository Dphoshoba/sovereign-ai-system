import { getOpportunityRegistry } from "./opportunity-reader"
import { getExecutionRegistry } from "./execution-reader"
import { getPrioritizationRegistry } from "./prioritization-reader"
import { getResearchMissions } from "./research-registry"
import { buildGrowthRoadmap } from "../growth/mock-data"
import type { MissionGrowthWorkspace, GrowthVector } from "../growth/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export async function getMissionGrowth(slug: string): Promise<MissionGrowthWorkspace | null> {
  const opportunities = await getOpportunityRegistry()
  const execution = await getExecutionRegistry()
  const prioritization = await getPrioritizationRegistry()

  if (!opportunities || !execution || !prioritization) {
    return null
  }

  const growthPotential = clamp(
    Math.floor((opportunities.roiScore * 0.4 + prioritization.focusScore * 0.35 + execution.deliveryScore * 0.25)),
    0,
    100
  )

  const growthVelocity = clamp(
    Math.floor((execution.executionVelocity * 0.5 + prioritization.roiScore * 0.35 + opportunities.educationPotential * 0.15)),
    0,
    100
  )

  const expansionScore = clamp(
    Math.floor((opportunities.marketPotential * 0.4 + prioritization.impactScore * 0.35 + growthPotential * 0.25)),
    0,
    100
  )

  const adoptionScore = clamp(
    Math.floor((opportunities.creatorPotential * 0.5 + prioritization.urgencyScore * 0.35 + execution.focusScore * 0.15)),
    0,
    100
  )

  const communityScore = clamp(
    Math.floor((opportunities.ministryPotential * 0.4 + adoptionScore * 0.35 + prioritization.focusScore * 0.25)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((growthPotential * 0.25 + growthVelocity * 0.25 + expansionScore * 0.2 + adoptionScore * 0.15 + communityScore * 0.15)),
    0,
    100
  )

  const vectors: GrowthVector[] = [
    { vectorId: "market", vectorName: "Market Expansion", potential: growthPotential, velocity: growthVelocity, status: "active" },
    { vectorId: "product", vectorName: "Product Growth", potential: expansionScore, velocity: growthVelocity * 0.9, status: "active" },
    { vectorId: "community", vectorName: "Community Building", potential: communityScore, velocity: growthVelocity * 0.8, status: "emerging" },
  ]

  const recommendations = unique([
    growthPotential > 80 ? "Strong growth potential: scale aggressively" : "Increase growth initiatives",
    adoptionScore > 75 ? "High adoption rate: leverage momentum" : "Improve adoption strategy",
  ]).slice(0, 9)

  return {
    mission: slug,
    missionTitle: opportunities.missions[0]?.missionTitle || "Research Mission 001",
    growthPotential,
    growthVelocity,
    expansionScore,
    adoptionScore,
    communityScore,
    healthScore,
    vectors,
    recommendations,
    roadmap: buildGrowthRoadmap(slug),
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

export async function getGrowthRegistry() {
  const missions = await getResearchMissions()
  const workspaces = await Promise.all(missions.map((m) => getMissionGrowth(m.slug)))
  const validWorkspaces = workspaces.filter(Boolean) as MissionGrowthWorkspace[]

  const growthPotential = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.growthPotential, 0) / validWorkspaces.length),
    0,
    100
  )
  const growthVelocity = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.growthVelocity, 0) / validWorkspaces.length),
    0,
    100
  )
  const expansionScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.expansionScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const adoptionScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.adoptionScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const communityScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.communityScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const healthScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.healthScore, 0) / validWorkspaces.length),
    0,
    100
  )

  return {
    growthPotential,
    growthVelocity,
    expansionScore,
    adoptionScore,
    communityScore,
    healthScore,
    missions: validWorkspaces,
  }
}
