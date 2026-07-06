import { getMissionAdvisor } from "./advisor-reader"
import { getMissionMaturity } from "./maturity-reader"
import { getMissionPlanner } from "./planner-reader"
import { getResearchMissions } from "./research-registry"
import { getMissionRecommendations } from "./recommendation-reader"
import { buildOpportunityRoadmap } from "../opportunity/mock-data"
import type { MissionOpportunityWorkspace } from "../opportunity/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export async function getMissionOpportunities(slug: string): Promise<MissionOpportunityWorkspace | null> {
  const advisor = await getMissionAdvisor(slug)
  const planner = await getMissionPlanner(slug)
  const maturity = await getMissionMaturity(slug)
  const recommendations = await getMissionRecommendations(slug)

  if (!advisor || !planner || !maturity || !recommendations) {
    return null
  }

  const marketPotential = clamp(
    Math.floor((maturity.commercialScore * 0.5 + planner.deliveryScore * 0.3 + advisor.impactScore * 0.2)),
    0,
    100
  )

  const educationPotential = clamp(
    Math.floor((maturity.teachingScore * 0.55 + planner.roadmapScore * 0.25 + advisor.momentumScore * 0.2)),
    0,
    100
  )

  const ministryPotential = clamp(
    Math.floor((maturity.readinessScore * 0.35 + maturity.healthScore * 0.3 + advisor.missionFocusScore * 0.35)),
    0,
    100
  )

  const creatorPotential = clamp(
    Math.floor((planner.momentum * 0.35 + maturity.reuseScore * 0.3 + recommendations.coveragePercent * 0.35)),
    0,
    100
  )

  const roiScore = clamp(
    Math.floor((marketPotential * 0.35 + creatorPotential * 0.25 + educationPotential * 0.2 + ministryPotential * 0.2)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((planner.healthScore * 0.4 + advisor.healthScore * 0.3 + maturity.healthScore * 0.3)),
    0,
    100
  )

  const opportunities = [
    {
      title: `Market package for ${advisor.highestRoiGap}`,
      score: marketPotential,
      lane: "market" as const,
      action: "Convert top gap into agency-ready offer and pricing tier.",
    },
    {
      title: "Education module expansion",
      score: educationPotential,
      lane: "education" as const,
      action: "Build modular curriculum from mission discoveries and planner queue.",
    },
    {
      title: "Ministry teaching acceleration",
      score: ministryPotential,
      lane: "ministry" as const,
      action: "Translate high-confidence findings into weekly discipleship outputs.",
    },
    {
      title: "Creator channel activation",
      score: creatorPotential,
      lane: "creator" as const,
      action: "Sequence article, course, and seminar assets from recommendation stack.",
    },
  ]

  const recommendationsList = unique([
    ...recommendations.recommendations.slice(0, 6).map((item) => item.title),
    ...planner.recommendations.slice(0, 3),
    ...advisor.highestRoiOpportunities.slice(0, 3),
  ]).slice(0, 10)

  return {
    mission: slug,
    missionTitle: advisor.missionTitle,
    opportunityCount: opportunities.length,
    marketPotential,
    educationPotential,
    ministryPotential,
    creatorPotential,
    roiScore,
    healthScore,
    opportunities,
    recommendations: recommendationsList,
    roadmap: buildOpportunityRoadmap(slug),
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

export async function getOpportunityRegistry(): Promise<{
  missionCount: number
  opportunityCount: number
  marketPotential: number
  educationPotential: number
  ministryPotential: number
  creatorPotential: number
  roiScore: number
  healthScore: number
  missions: MissionOpportunityWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionOpportunityWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionOpportunities(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const opportunityCount = results.reduce((sum, item) => sum + item.opportunityCount, 0)

  const marketPotential = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.marketPotential, 0) / missionCount) : 0
  const educationPotential = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.educationPotential, 0) / missionCount) : 0
  const ministryPotential = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.ministryPotential, 0) / missionCount) : 0
  const creatorPotential = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.creatorPotential, 0) / missionCount) : 0
  const roiScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.roiScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    missionCount,
    opportunityCount,
    marketPotential,
    educationPotential,
    ministryPotential,
    creatorPotential,
    roiScore,
    healthScore,
    missions: results,
  }
}
