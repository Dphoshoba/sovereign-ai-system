import { getMissionExecutiveDashboard } from "./executive-dashboard-reader"
import { getMissionMaturity } from "./maturity-reader"
import { getMissionOpportunities } from "./opportunity-reader"
import { getMissionPlanner } from "./planner-reader"
import { getResearchMissions } from "./research-registry"
import { getMissionRecommendations } from "./recommendation-reader"
import { buildCapitalRoadmap } from "../capital/mock-data"
import type { MissionCapitalWorkspace } from "../capital/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export async function getMissionCapital(slug: string): Promise<MissionCapitalWorkspace | null> {
  const maturity = await getMissionMaturity(slug)
  const planner = await getMissionPlanner(slug)
  const recommendations = await getMissionRecommendations(slug)
  const executive = await getMissionExecutiveDashboard(slug)
  const opportunities = await getMissionOpportunities(slug)

  if (!maturity || !planner || !recommendations || !executive || !opportunities) {
    return null
  }

  const reuseScore = clamp(
    Math.floor((maturity.reuseScore * 0.6 + recommendations.coveragePercent * 0.4)),
    0,
    100
  )

  const commercializationScore = clamp(
    Math.floor((maturity.commercialScore * 0.45 + planner.deliveryScore * 0.25 + opportunities.marketPotential * 0.3)),
    0,
    100
  )

  const licensingScore = clamp(
    Math.floor((reuseScore * 0.45 + executive.capitalizationScore * 0.35 + opportunities.educationPotential * 0.2)),
    0,
    100
  )

  const contentScore = clamp(
    Math.floor((planner.momentum * 0.35 + opportunities.creatorPotential * 0.35 + recommendations.readinessScore * 0.3)),
    0,
    100
  )

  const knowledgeCapital = clamp(
    Math.floor((reuseScore * 0.35 + commercializationScore * 0.3 + licensingScore * 0.15 + contentScore * 0.2)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((planner.healthScore * 0.4 + maturity.healthScore * 0.35 + executive.healthScore * 0.25)),
    0,
    100
  )

  const assetValue = clamp(
    Math.floor((knowledgeCapital * 0.55 + executive.opportunityIndex * 0.25 + opportunities.roiScore * 0.2)),
    0,
    100
  )

  const assets = [
    {
      title: "Knowledge frameworks",
      value: reuseScore,
      category: "knowledge" as const,
    },
    {
      title: "Content pipeline",
      value: contentScore,
      category: "content" as const,
    },
    {
      title: "Commercial package stack",
      value: commercializationScore,
      category: "commercial" as const,
    },
    {
      title: "Licensing surface",
      value: licensingScore,
      category: "licensing" as const,
    },
  ]

  const recommendationList = unique([
    ...recommendations.recommendations.slice(0, 6).map((item) => item.title),
    ...planner.recommendations.slice(0, 2),
    ...opportunities.recommendations.slice(0, 2),
  ]).slice(0, 10)

  return {
    mission: slug,
    missionTitle: maturity.missionTitle,
    assetValue,
    knowledgeCapital,
    reuseScore,
    commercializationScore,
    licensingScore,
    contentScore,
    healthScore,
    assets,
    recommendations: recommendationList,
    roadmap: buildCapitalRoadmap(slug),
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

export async function getCapitalRegistry(): Promise<{
  missionCount: number
  assetValue: number
  knowledgeCapital: number
  reuseScore: number
  commercializationScore: number
  licensingScore: number
  contentScore: number
  healthScore: number
  missions: MissionCapitalWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionCapitalWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionCapital(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const assetValue = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.assetValue, 0) / missionCount) : 0
  const knowledgeCapital = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.knowledgeCapital, 0) / missionCount) : 0
  const reuseScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.reuseScore, 0) / missionCount) : 0
  const commercializationScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.commercializationScore, 0) / missionCount) : 0
  const licensingScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.licensingScore, 0) / missionCount) : 0
  const contentScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.contentScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    missionCount,
    assetValue,
    knowledgeCapital,
    reuseScore,
    commercializationScore,
    licensingScore,
    contentScore,
    healthScore,
    missions: results,
  }
}
