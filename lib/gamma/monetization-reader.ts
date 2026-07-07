import { getOpportunityRegistry } from "./opportunity-reader"
import { getMissionMaturity } from "./maturity-reader"
import { getCapitalRegistry } from "./capital-reader"
import { getResearchMissions } from "./research-registry"
import { buildMonetizationRoadmap } from "../monetization/mock-data"
import type { MissionMonetizationWorkspace, RevenueStream } from "../monetization/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export async function getMissionMonetization(slug: string): Promise<MissionMonetizationWorkspace | null> {
  const opportunities = await getOpportunityRegistry()
  const maturity = await getMissionMaturity(slug)
  const capital = await getCapitalRegistry()

  if (!opportunities || !maturity || !capital) {
    return null
  }

  const revenueStreams = 3
  const marketOpportunities = Math.floor(opportunities.roiScore / 20)
  const pricingModels = 2
  const commercialAssets = 5

  const revenueScore = clamp(
    Math.floor((opportunities.roiScore * 0.4 + maturity.commercialScore * 0.35 + capital.assetValue * 0.25)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((revenueScore * 0.6 + maturity.healthScore * 0.2 + capital.healthScore * 0.2)),
    0,
    100
  )

  const streams: RevenueStream[] = Array.from({ length: revenueStreams }, (_, i) => ({
    streamId: `stream-${i + 1}`,
    streamName: i === 0 ? "Direct Sales" : i === 1 ? "Licensing" : "Services",
    potential: revenueScore - i * 10,
    effort: 100 - revenueScore + i * 10,
  }))

  const recommendations = unique([
    opportunities.roiScore > 80 ? "High ROI: scale revenue streams" : "Optimize revenue model",
    revenueScore > 75 ? "Strong monetization potential" : "Develop pricing strategy",
  ]).slice(0, 9)

  return {
    mission: slug,
    missionTitle: maturity.missionTitle,
    revenueStreams,
    marketOpportunities,
    pricingModels,
    commercialAssets,
    revenueScore,
    healthScore,
    streams,
    recommendations,
    roadmap: buildMonetizationRoadmap(slug),
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

export async function getMonetizationRegistry() {
  const missions = await getResearchMissions()
  const workspaces = await Promise.all(missions.map((m) => getMissionMonetization(m.slug)))
  const validWorkspaces = workspaces.filter(Boolean) as MissionMonetizationWorkspace[]

  const revenueStreams = validWorkspaces.reduce((sum, w) => sum + w.revenueStreams, 0)
  const marketOpportunities = validWorkspaces.reduce((sum, w) => sum + w.marketOpportunities, 0)
  const pricingModels = validWorkspaces.reduce((sum, w) => sum + w.pricingModels, 0)
  const commercialAssets = validWorkspaces.reduce((sum, w) => sum + w.commercialAssets, 0)
  const revenueScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.revenueScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const healthScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.healthScore, 0) / validWorkspaces.length),
    0,
    100
  )

  return {
    revenueStreams,
    marketOpportunities,
    pricingModels,
    commercialAssets,
    revenueScore,
    healthScore,
    missions: validWorkspaces,
  }
}
