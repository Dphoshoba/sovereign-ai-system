import { getMissionPlanner } from "./planner-reader"
import { getMissionMaturity } from "./maturity-reader"
import { getMissionOpportunities } from "./opportunity-reader"
import { getMissionAdvisor } from "./advisor-reader"
import { getResearchMissions } from "./research-registry"
import { buildPrioritizationRoadmap } from "../prioritization/mock-data"
import type { MissionPrioritizationWorkspace } from "../prioritization/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export async function getMissionPrioritization(slug: string): Promise<MissionPrioritizationWorkspace | null> {
  const planner = await getMissionPlanner(slug)
  const maturity = await getMissionMaturity(slug)
  const opportunities = await getMissionOpportunities(slug)
  const advisor = await getMissionAdvisor(slug)

  if (!planner || !maturity || !opportunities || !advisor) {
    return null
  }

  const priorityCount = 5

  const impactScore = clamp(
    Math.floor((opportunities.roiScore * 0.4 + advisor.impactScore * 0.35 + maturity.healthScore * 0.25)),
    0,
    100
  )

  const effortScore = clamp(
    Math.floor(Math.max(0, 100 - (planner.deliveryScore * 0.5 + maturity.readinessScore * 0.5))),
    0,
    100
  )

  const roiScore = clamp(
    Math.floor((impactScore * 0.6 - effortScore * 0.4)),
    0,
    100
  )

  const urgencyScore = clamp(
    Math.floor((advisor.momentumScore * 0.5 + opportunities.educationPotential * 0.3 + maturity.confidenceScore * 0.2)),
    0,
    100
  )

  const alignmentScore = clamp(
    Math.floor((advisor.missionFocusScore * 0.6 + planner.roadmapScore * 0.4)),
    0,
    100
  )

  const focusScore = clamp(
    Math.floor((roiScore * 0.35 + alignmentScore * 0.35 + urgencyScore * 0.3)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((planner.healthScore * 0.4 + advisor.healthScore * 0.35 + maturity.healthScore * 0.25)),
    0,
    100
  )

  const priorities = [
    {
      title: `High-impact opportunity execution`,
      impactScore,
      effortScore,
      roiScore,
      urgencyScore,
      alignmentScore,
      focusScore,
    },
    {
      title: `Strategic alignment optimization`,
      impactScore: Math.max(0, impactScore - 15),
      effortScore: Math.max(0, effortScore - 20),
      roiScore: Math.max(0, roiScore - 10),
      urgencyScore: Math.max(0, urgencyScore - 10),
      alignmentScore,
      focusScore: Math.max(0, focusScore - 5),
    },
    {
      title: `Resource bottleneck resolution`,
      impactScore: Math.max(0, impactScore - 25),
      effortScore: Math.min(100, effortScore + 15),
      roiScore: Math.max(0, roiScore - 20),
      urgencyScore: Math.min(100, urgencyScore + 10),
      alignmentScore: Math.max(0, alignmentScore - 10),
      focusScore: Math.max(0, focusScore - 15),
    },
  ]

  const recommendations = unique([
    ...advisor.creatorSuggestions.slice(0, 3),
    ...opportunities.recommendations.slice(0, 3),
    `Alignment at ${alignmentScore}: ${alignmentScore > 75 ? "locked" : "needs refinement"}`,
  ]).slice(0, 9)

  return {
    mission: slug,
    missionTitle: advisor.missionTitle,
    priorityCount,
    impactScore,
    effortScore,
    roiScore,
    urgencyScore,
    alignmentScore,
    focusScore,
    healthScore,
    priorities,
    recommendations,
    roadmap: buildPrioritizationRoadmap(slug),
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

export async function getPrioritizationRegistry() {
  const missions = await getResearchMissions()
  const workspaces = await Promise.all(missions.map((m) => getMissionPrioritization(m.slug)))
  const validWorkspaces = workspaces.filter(Boolean) as MissionPrioritizationWorkspace[]

  const priorityCount = validWorkspaces.reduce((sum, w) => sum + w.priorityCount, 0)
  const impactScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.impactScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const effortScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.effortScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const roiScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.roiScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const urgencyScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.urgencyScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const alignmentScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.alignmentScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const focusScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.focusScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const healthScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.healthScore, 0) / validWorkspaces.length),
    0,
    100
  )

  return {
    priorityCount,
    impactScore,
    effortScore,
    roiScore,
    urgencyScore,
    alignmentScore,
    focusScore,
    healthScore,
    missions: validWorkspaces,
  }
}
