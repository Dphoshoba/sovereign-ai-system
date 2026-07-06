import { getMissionCapital } from "./capital-reader"
import { getMissionControl } from "./mission-control-reader"
import { getMissionMaturity } from "./maturity-reader"
import { getMissionOpportunities } from "./opportunity-reader"
import { getResearchMissions } from "./research-registry"
import { buildPortfolioRoadmap } from "../portfolio/mock-data"
import type { MissionPortfolioWorkspace } from "../portfolio/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function statusFromScore(score: number): "strong" | "watch" | "weak" {
  if (score < 50) {
    return "weak"
  }
  if (score < 70) {
    return "watch"
  }
  return "strong"
}

export async function getMissionPortfolio(slug: string): Promise<MissionPortfolioWorkspace | null> {
  const control = await getMissionControl(slug)
  const maturity = await getMissionMaturity(slug)
  const opportunities = await getMissionOpportunities(slug)
  const capital = await getMissionCapital(slug)

  if (!control || !maturity || !opportunities || !capital) {
    return null
  }

  const coverage = [
    { workspace: "readiness", score: control.readinessScore, status: statusFromScore(control.readinessScore) },
    { workspace: "maturity", score: maturity.coverageScore, status: statusFromScore(maturity.coverageScore) },
    { workspace: "opportunities", score: opportunities.roiScore, status: statusFromScore(opportunities.roiScore) },
    { workspace: "capital", score: capital.knowledgeCapital, status: statusFromScore(capital.knowledgeCapital) },
  ]

  const workspaceCoverage = clamp(
    Math.floor(coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length),
    0,
    100
  )

  const portfolioHealth = clamp(
    Math.floor((control.healthScore * 0.4 + maturity.healthScore * 0.3 + capital.healthScore * 0.3)),
    0,
    100
  )

  const readinessScore = clamp(
    Math.floor((control.readinessScore * 0.45 + maturity.readinessScore * 0.35 + opportunities.educationPotential * 0.2)),
    0,
    100
  )

  const priorityScore = clamp(
    Math.floor((control.riskScore * 0.3 + opportunities.roiScore * 0.35 + capital.assetValue * 0.35)),
    0,
    100
  )

  const recommendations = unique([
    ...control.recommendations.slice(0, 4),
    ...opportunities.recommendations.slice(0, 3),
    ...capital.recommendations.slice(0, 3),
  ]).slice(0, 10)

  return {
    mission: slug,
    missionTitle: control.missionTitle,
    missionCount: 1,
    assetCount: control.recommendationCount + capital.assets.length,
    workspaceCoverage,
    portfolioHealth,
    readinessScore,
    priorityScore,
    coverage,
    recommendations,
    roadmap: buildPortfolioRoadmap(slug),
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

export async function getPortfolioRegistry(): Promise<{
  missionCount: number
  assetCount: number
  workspaceCoverage: number
  portfolioHealth: number
  readinessScore: number
  priorityScore: number
  missions: MissionPortfolioWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionPortfolioWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionPortfolio(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const assetCount = results.reduce((sum, item) => sum + item.assetCount, 0)
  const workspaceCoverage = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.workspaceCoverage, 0) / missionCount) : 0
  const portfolioHealth = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.portfolioHealth, 0) / missionCount) : 0
  const readinessScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.readinessScore, 0) / missionCount) : 0
  const priorityScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.priorityScore, 0) / missionCount) : 0

  return {
    missionCount,
    assetCount,
    workspaceCoverage,
    portfolioHealth,
    readinessScore,
    priorityScore,
    missions: results,
  }
}
