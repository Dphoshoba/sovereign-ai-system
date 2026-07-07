import { getOpportunityRegistry } from "./opportunity-reader"
import { getExecutionRegistry } from "./execution-reader"
import { getResearchMissions } from "./research-registry"
import { buildMarketIntelligenceRoadmap } from "../market-intelligence/mock-data"
import type { MissionMarketIntelligenceWorkspace, MarketSegment } from "../market-intelligence/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionMarketIntelligence(slug: string): Promise<MissionMarketIntelligenceWorkspace | null> {
  const opportunities = await getOpportunityRegistry()
  const execution = await getExecutionRegistry()

  if (!opportunities || !execution) {
    return null
  }

  const marketSegments = 5
  const audienceCount = 3
  const demandScore = clamp(opportunities.roiScore, 0, 100)
  const competitionScore = clamp(100 - opportunities.roiScore / 2, 0, 100)
  const opportunityScore = clamp(Math.floor((opportunities.roiScore * 0.6 + opportunities.creatorPotential * 0.4)), 0, 100)
  const adoptionScore = clamp(Math.floor((execution.focusScore * 0.5 + opportunities.creatorPotential * 0.5)), 0, 100)
  const healthScore = clamp(Math.floor((demandScore * 0.3 + opportunityScore * 0.3 + adoptionScore * 0.4)), 0, 100)

  const segments: MarketSegment[] = Array.from({ length: marketSegments }, (_, i) => ({
    segmentId: `segment-${i + 1}`,
    segmentName: `Market Segment ${i + 1}`,
    audienceSize: 1000 + i * 500,
    demandLevel: demandScore - i * 5,
    competitionLevel: competitionScore - i * 3,
  }))

  return {
    mission: slug,
    missionTitle: "Research Mission 001",
    marketSegments,
    audienceCount,
    demandScore,
    competitionScore,
    opportunityScore,
    adoptionScore,
    healthScore,
    segments,
    recommendations: ["Target high-demand segments", "Monitor competition", "Expand audience reach"],
    roadmap: buildMarketIntelligenceRoadmap(slug),
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

export async function getMarketIntelligenceRegistry(): Promise<{
  marketSegments: number
  audienceCount: number
  demandScore: number
  competitionScore: number
  opportunityScore: number
  adoptionScore: number
  healthScore: number
  missions: MissionMarketIntelligenceWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionMarketIntelligenceWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionMarketIntelligence(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const marketSegments = missionCount > 0 ? 5 : 0
  const audienceCount = missionCount > 0 ? 3 : 0
  const demandScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.demandScore, 0) / missionCount) : 0
  const competitionScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.competitionScore, 0) / missionCount) : 0
  const opportunityScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.opportunityScore, 0) / missionCount) : 0
  const adoptionScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.adoptionScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    marketSegments,
    audienceCount,
    demandScore,
    competitionScore,
    opportunityScore,
    adoptionScore,
    healthScore,
    missions: results,
  }
}
