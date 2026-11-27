import { getMissionMaturity } from "./maturity-reader"
import { getExecutionRegistry } from "./execution-reader"
import { getGrowthRegistry } from "./growth-reader"
import { getResearchMissions } from "./research-registry"
import { buildPredictiveRoadmap } from "../predictive/mock-data"
import type { MissionPredictiveWorkspace, Forecast } from "../predictive/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionPredictive(slug: string): Promise<MissionPredictiveWorkspace | null> {
  const maturity = await getMissionMaturity(slug)
  const execution = await getExecutionRegistry()
  const growth = await getGrowthRegistry()

  if (!maturity || !execution || !growth) {
    return null
  }

  const forecastCount = 4
  const trendScore = clamp(
    Math.floor((execution.executionVelocity * 0.5 + growth.growthVelocity * 0.35 + maturity.confidenceScore * 0.15)),
    0,
    100
  )

  const opportunityForecast = clamp(
    Math.floor((growth.growthPotential * 0.5 + growth.expansionScore * 0.35 + trendScore * 0.15)),
    0,
    100
  )

  const riskForecast = clamp(
    Math.floor(Math.max(0, 100 - trendScore * 0.7 - execution.healthScore * 0.3)),
    0,
    100
  )

  const confidenceScore = clamp(
    Math.floor((maturity.confidenceScore * 0.5 + trendScore * 0.35 + execution.deliveryScore * 0.15)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((trendScore * 0.3 + confidenceScore * 0.3 + opportunityForecast * 0.25 + Math.max(0, 100 - riskForecast) * 0.15)),
    0,
    100
  )

  const forecasts: Forecast[] = [
    { forecastId: "market-trend", metric: "Market Trend", trend: trendScore > 70 ? "up" : trendScore > 40 ? "stable" : "down", confidence: confidenceScore },
    { forecastId: "growth-rate", metric: "Growth Rate", trend: growth.growthVelocity > 70 ? "up" : "stable", confidence: confidenceScore - 10 },
    { forecastId: "opportunity-index", metric: "Opportunity Index", trend: opportunityForecast > 70 ? "up" : "stable", confidence: confidenceScore - 5 },
    { forecastId: "risk-level", metric: "Risk Level", trend: riskForecast > 70 ? "up" : "down", confidence: confidenceScore - 15 },
  ]

  return {
    mission: slug,
    missionTitle: maturity.missionTitle,
    forecastCount,
    trendScore,
    opportunityForecast,
    riskForecast,
    confidenceScore,
    healthScore,
    forecasts,
    recommendations: [
      "Monitor trend forecasts",
      "Prepare for opportunities",
      "Manage identified risks",
    ],
    roadmap: buildPredictiveRoadmap(slug),
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

export async function getPredictiveRegistry() {
  const missions = await getResearchMissions()
  const workspaces = await Promise.all(missions.map((m) => getMissionPredictive(m.slug)))
  const validWorkspaces = workspaces.filter(Boolean) as MissionPredictiveWorkspace[]

  const forecastCount = validWorkspaces.reduce((sum, w) => sum + w.forecastCount, 0)
  const trendScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.trendScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const opportunityForecast = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.opportunityForecast, 0) / validWorkspaces.length),
    0,
    100
  )
  const riskForecast = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.riskForecast, 0) / validWorkspaces.length),
    0,
    100
  )
  const confidenceScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.confidenceScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const healthScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.healthScore, 0) / validWorkspaces.length),
    0,
    100
  )

  return {
    forecastCount,
    trendScore,
    opportunityForecast,
    riskForecast,
    confidenceScore,
    healthScore,
    missions: validWorkspaces,
  }
}
