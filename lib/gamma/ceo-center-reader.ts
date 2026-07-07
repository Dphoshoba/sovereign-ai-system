import { getMissionAdvisor } from "./advisor-reader"
import { getOpportunityRegistry } from "./opportunity-reader"
import { getExecutionRegistry } from "./execution-reader"
import { getPortfolioRegistry } from "./portfolio-reader"
import { getPrioritizationRegistry } from "./prioritization-reader"
import { getResearchMissions } from "./research-registry"
import { buildCEORoadmap } from "../ceo-center/mock-data"
import type { MissionCEOCenterWorkspace } from "../ceo-center/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function statusFromScore(score: number): "alert" | "watch" | "healthy" {
  if (score < 40) {
    return "alert"
  }
  if (score < 70) {
    return "watch"
  }
  return "healthy"
}

function trendFromScores(current: number, baseline: number = 50): "up" | "stable" | "down" {
  const diff = current - baseline
  if (diff > 10) return "up"
  if (diff < -10) return "down"
  return "stable"
}

export async function getMissionCEOCenter(slug: string): Promise<MissionCEOCenterWorkspace | null> {
  const advisor = await getMissionAdvisor(slug)
  const opportunities = await getOpportunityRegistry()
  const execution = await getExecutionRegistry()
  const portfolio = await getPortfolioRegistry()
  const prioritization = await getPrioritizationRegistry()

  if (!advisor || !opportunities || !execution || !portfolio || !prioritization) {
    return null
  }

  const executiveScore = clamp(
    Math.floor(
      (advisor.healthScore * 0.2 +
        opportunities.roiScore * 0.2 +
        execution.deliveryScore * 0.2 +
        portfolio.portfolioHealth * 0.2 +
        prioritization.focusScore * 0.2)
    ),
    0,
    100
  )

  const portfolioValue = clamp(
    Math.floor((portfolio.workspaceCoverage * 0.4 + portfolio.readinessScore * 0.35 + portfolio.priorityScore * 0.25)),
    0,
    100
  )

  const executionReadiness = clamp(
    Math.floor(
      (execution.executionCapacity * 0.35 + execution.deliveryScore * 0.4 + Math.max(0, 100 - execution.bottlenecks * 10) * 0.25)
    ),
    0,
    100
  )

  const opportunityIndex = clamp(
    Math.floor((opportunities.roiScore * 0.4 + opportunities.marketPotential * 0.3 + opportunities.educationPotential * 0.3)),
    0,
    100
  )

  const strategicAlignment = clamp(
    Math.floor((prioritization.alignmentScore * 0.5 + advisor.missionFocusScore * 0.3 + prioritization.focusScore * 0.2)),
    0,
    100
  )

  const knowledgeCapital = clamp(
    Math.floor((portfolio.assetCount * 0.5 + advisor.impactScore * 0.3 + opportunities.creatorPotential * 0.2)),
    0,
    100
  )

  const growthPotential = clamp(
    Math.floor((opportunityIndex * 0.35 + executionReadiness * 0.35 + strategicAlignment * 0.3)),
    0,
    100
  )

  const missionHealth = clamp(
    Math.floor((portfolio.portfolioHealth * 0.3 + execution.healthScore * 0.35 + advisor.healthScore * 0.35)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor(
      (executiveScore * 0.2 +
        portfolioValue * 0.15 +
        executionReadiness * 0.2 +
        opportunityIndex * 0.15 +
        strategicAlignment * 0.15 +
        growthPotential * 0.15)
    ),
    0,
    100
  )

  const dashboard = [
    { metric: "Executive Score", value: executiveScore, trend: trendFromScores(executiveScore), status: statusFromScore(executiveScore) },
    {
      metric: "Portfolio Value",
      value: portfolioValue,
      trend: trendFromScores(portfolioValue),
      status: statusFromScore(portfolioValue),
    },
    {
      metric: "Execution Readiness",
      value: executionReadiness,
      trend: trendFromScores(executionReadiness),
      status: statusFromScore(executionReadiness),
    },
    {
      metric: "Opportunity Index",
      value: opportunityIndex,
      trend: trendFromScores(opportunityIndex),
      status: statusFromScore(opportunityIndex),
    },
    {
      metric: "Strategic Alignment",
      value: strategicAlignment,
      trend: trendFromScores(strategicAlignment),
      status: statusFromScore(strategicAlignment),
    },
    {
      metric: "Knowledge Capital",
      value: knowledgeCapital,
      trend: trendFromScores(knowledgeCapital),
      status: statusFromScore(knowledgeCapital),
    },
    {
      metric: "Growth Potential",
      value: growthPotential,
      trend: trendFromScores(growthPotential),
      status: statusFromScore(growthPotential),
    },
    {
      metric: "Mission Health",
      value: missionHealth,
      trend: trendFromScores(missionHealth),
      status: statusFromScore(missionHealth),
    },
  ]

  const recommendations = unique([
    ...advisor.creatorSuggestions.slice(0, 2),
    opportunityIndex > 80 ? "High opportunity index: scale commercialization" : "Opportunity index below threshold: diversify lanes",
    executionReadiness < 60 ? "Execution readiness low: increase delivery capacity" : "Execution track nominal",
    strategicAlignment < 70 ? "Strategic alignment below target: refocus initiatives" : "Strategic alignment strong",
    growthPotential > 75 ? "High growth potential: accelerate portfolio expansion" : "Growth potential moderate: consolidate gains",
  ]).slice(0, 10)

  return {
    mission: slug,
    missionTitle: advisor.missionTitle,
    executiveScore,
    portfolioValue,
    executionReadiness,
    opportunityIndex,
    strategicAlignment,
    knowledgeCapital,
    growthPotential,
    missionHealth,
    healthScore,
    dashboard,
    recommendations,
    roadmap: buildCEORoadmap(slug),
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

export async function getCEOCenterRegistry() {
  const missions = await getResearchMissions()
  const workspaces = await Promise.all(missions.map((m) => getMissionCEOCenter(m.slug)))
  const validWorkspaces = workspaces.filter(Boolean) as MissionCEOCenterWorkspace[]

  const executiveScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.executiveScore, 0) / validWorkspaces.length),
    0,
    100
  )

  const portfolioValue = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.portfolioValue, 0) / validWorkspaces.length),
    0,
    100
  )

  const executionReadiness = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.executionReadiness, 0) / validWorkspaces.length),
    0,
    100
  )

  const opportunityIndex = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.opportunityIndex, 0) / validWorkspaces.length),
    0,
    100
  )

  const strategicAlignment = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.strategicAlignment, 0) / validWorkspaces.length),
    0,
    100
  )

  const knowledgeCapital = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.knowledgeCapital, 0) / validWorkspaces.length),
    0,
    100
  )

  const growthPotential = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.growthPotential, 0) / validWorkspaces.length),
    0,
    100
  )

  const missionHealth = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.missionHealth, 0) / validWorkspaces.length),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.healthScore, 0) / validWorkspaces.length),
    0,
    100
  )

  return {
    executiveScore,
    portfolioValue,
    executionReadiness,
    opportunityIndex,
    strategicAlignment,
    knowledgeCapital,
    growthPotential,
    missionHealth,
    healthScore,
    missions: validWorkspaces,
  }
}
