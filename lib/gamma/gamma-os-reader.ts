import { getMissionAdvisor } from "./advisor-reader"
import { getMissionControl } from "./mission-control-reader"
import { getMissionGovernance } from "./governance-reader"
import { getMissionGapAnalysis } from "./gap-analysis-reader"
import { getMissionInsights } from "./insight-reader"
import { getMissionOpportunities } from "./opportunity-reader"
import { getMissionPortfolio } from "./portfolio-reader"
import { getMissionPlanner } from "./planner-reader"
import { getMissionReview } from "./review-reader"
import { getMissionMaturity } from "./maturity-reader"
import { getMissionQueryWorkspace } from "./query-reader"
import { getMissionInference } from "./inference-reader"
import { getMissionRecommendations } from "./recommendation-reader"
import { getMissionKnowledgeGraph } from "./graph-reader"
import { getMissionRelationships } from "./relationship-reader"
import { getSecondBrainWorkspace } from "./second-brain-reader"
import { getResearchMissions } from "./research-registry"
import { buildGammaOsRoadmap } from "../gamma-os/mock-data"
import type { GammaOsWorkspace } from "../gamma-os/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export async function getGammaOsWorkspace(slug: string): Promise<GammaOsWorkspace | null> {
  const advisor = await getMissionAdvisor(slug)
  const control = await getMissionControl(slug)
  const governance = await getMissionGovernance(slug)
  const gap = await getMissionGapAnalysis(slug)
  const insights = await getMissionInsights(slug)
  const opportunities = await getMissionOpportunities(slug)
  const portfolio = await getMissionPortfolio(slug)
  const planner = await getMissionPlanner(slug)
  const review = await getMissionReview(slug)
  const maturity = await getMissionMaturity(slug)
  const query = await getMissionQueryWorkspace(slug)
  const inference = await getMissionInference(slug)
  const recommendations = await getMissionRecommendations(slug)
  const graph = await getMissionKnowledgeGraph(slug)
  const relationships = await getMissionRelationships(slug)
  const secondBrain = await getSecondBrainWorkspace(slug)

  if (!advisor || !control || !governance || !gap || !insights || !opportunities || !portfolio || !planner || !review || !maturity || !query || !inference || !recommendations || !graph || !relationships || !secondBrain) {
    return null
  }

  const gammaScore = clamp(
    Math.floor((control.missionScore * 0.14 + advisor.missionFocusScore * 0.1 + governance.governanceScore * 0.14 + insights.knowledgeMomentum * 0.08 + opportunities.roiScore * 0.08 + portfolio.workspaceCoverage * 0.08 + planner.roadmapScore * 0.08 + review.reviewScore * 0.08 + maturity.missionScore * 0.06 + query.knowledgeCompleteness * 0.06 + inference.coverageScore * 0.06 + recommendations.coveragePercent * 0.06 + graph.coverageScore * 0.04 + relationships.coverageScore * 0.04)),
    0,
    100
  )

  const osHealth = clamp(
    Math.floor((governance.freezeReadiness * 0.3 + control.healthScore * 0.15 + insights.healthScore * 0.1 + opportunities.healthScore * 0.1 + portfolio.portfolioHealth * 0.1 + planner.healthScore * 0.08 + review.healthScore * 0.08 + maturity.healthScore * 0.05 + secondBrain.healthScore * 0.04)),
    0,
    100
  )

  const knowledgeDebt = clamp(
    Math.floor((gap.assetDeficit * 0.4 + inference.missingFrameworkCount * 8 + review.knowledgeDebt * 0.2 + query.gapCount * 0.1 + control.knowledgeDebt * 0.1 + portfolio.assetCount * 0.05)),
    0,
    100
  )

  const assetValue = clamp(
    Math.floor((portfolio.assetCount * 0.25 + opportunities.roiScore * 0.25 + control.opportunityScore * 0.2 + insights.trendCount * 8 + recommendations.recommendationCount * 2)),
    0,
    100
  )

  const capitalizationScore = clamp(
    Math.floor((control.executionScore * 0.2 + opportunities.roiScore * 0.2 + portfolio.priorityScore * 0.2 + governance.securityScore * 0.2 + maturity.commercialScore * 0.2)),
    0,
    100
  )

  const growthTrajectory = clamp(
    Math.floor((planner.momentum * 0.2 + review.momentumScore * 0.2 + opportunities.marketPotential * 0.2 + control.momentumScore * 0.15 + insights.knowledgeMomentum * 0.15 + maturity.scalabilityScore * 0.1)),
    0,
    100
  )

  const readinessScore = clamp(
    Math.floor((control.readinessScore * 0.2 + governance.freezeReadiness * 0.2 + portfolio.readinessScore * 0.2 + planner.executionReadiness * 0.2 + query.confidenceScore * 0.1 + inference.confidenceScore * 0.1)),
    0,
    100
  )

  const freezeReadiness = clamp(
    Math.floor((governance.freezeReadiness * 0.4 + osHealth * 0.2 + readinessScore * 0.2 + control.healthScore * 0.1 + review.healthScore * 0.1)),
    0,
    100
  )

  const signals = [
    { title: "Mission control alignment", source: "mission-control", score: control.missionScore },
    { title: "Governance freeze readiness", source: "governance", score: governance.freezeReadiness },
    { title: "Insight momentum", source: "insights", score: insights.knowledgeMomentum },
    { title: "Opportunity ROI", source: "opportunities", score: opportunities.roiScore },
    { title: "Portfolio coverage", source: "portfolio", score: portfolio.workspaceCoverage },
    { title: "Knowledge debt pressure", source: "gap-analysis", score: 100 - gap.healthScore },
    { title: "Relationship coverage", source: "relationships", score: relationships.coverageScore },
  ]

  const recommendationsList = unique([
    ...governance.recommendations.slice(0, 4),
    ...control.immediateActions.slice(0, 3).map((item) => item.title),
    ...opportunities.recommendations.slice(0, 3),
    ...portfolio.recommendations.slice(0, 2),
  ]).slice(0, 12)

  return {
    mission: slug,
    missionTitle: control.missionTitle,
    gammaScore,
    osHealth,
    knowledgeDebt,
    assetValue,
    capitalizationScore,
    growthTrajectory,
    readinessScore,
    freezeReadiness,
    signals,
    recommendations: recommendationsList,
    roadmap: buildGammaOsRoadmap(slug),
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

export async function getGammaOsRegistry(): Promise<{
  missionCount: number
  gammaScore: number
  osHealth: number
  knowledgeDebt: number
  assetValue: number
  capitalizationScore: number
  growthTrajectory: number
  readinessScore: number
  freezeReadiness: number
  missions: GammaOsWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: GammaOsWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getGammaOsWorkspace(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const gammaScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.gammaScore, 0) / missionCount) : 0
  const osHealth = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.osHealth, 0) / missionCount) : 0
  const knowledgeDebt = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.knowledgeDebt, 0) / missionCount) : 0
  const assetValue = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.assetValue, 0) / missionCount) : 0
  const capitalizationScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.capitalizationScore, 0) / missionCount) : 0
  const growthTrajectory = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.growthTrajectory, 0) / missionCount) : 0
  const readinessScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.readinessScore, 0) / missionCount) : 0
  const freezeReadiness = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.freezeReadiness, 0) / missionCount) : 0

  return {
    missionCount,
    gammaScore,
    osHealth,
    knowledgeDebt,
    assetValue,
    capitalizationScore,
    growthTrajectory,
    readinessScore,
    freezeReadiness,
    missions: results,
  }
}
