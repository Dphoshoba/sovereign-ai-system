import { getStrategyRegistry } from "./strategy-reader"
import { getMarketIntelligenceRegistry } from "./market-intelligence-reader"
import { getLearningRegistry } from "./learning-reader"
import { getInnovationRegistry } from "./innovation-reader"
import { getImpactRegistry } from "./impact-reader"
import { getCommunityRegistry } from "./community-reader"
import { getResearchLabRegistry } from "./research-lab-reader"
import { getSynthesisRegistry } from "./synthesis-reader"
import { getEvolutionRegistry } from "./evolution-reader"
import { getGammaNexusRegistry } from "./gamma-nexus-reader"
import { getMissionControl } from "./mission-control-reader"
import { getCEOCenterRegistry } from "./ceo-center-reader"
import { getGammaOsRegistry } from "./gamma-os-reader"
import { getResearchMissions } from "./research-registry"
import { buildIntelligenceCoreRoadmap } from "../intelligence-core/mock-data"
import type { MissionIntelligenceCoreWorkspace, IntelligenceCoreElement } from "../intelligence-core/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionIntelligenceCore(slug: string): Promise<MissionIntelligenceCoreWorkspace | null> {
  const strategy = await getStrategyRegistry()
  const market = await getMarketIntelligenceRegistry()
  const learning = await getLearningRegistry()
  const innovation = await getInnovationRegistry()
  const impact = await getImpactRegistry()
  const community = await getCommunityRegistry()
  const researchLab = await getResearchLabRegistry()
  const synthesis = await getSynthesisRegistry()
  const evolution = await getEvolutionRegistry()
  const gammaNexus = await getGammaNexusRegistry()
  const control = await getMissionControl(slug)
  const ceoCenter = await getCEOCenterRegistry()
  const gammaOs = await getGammaOsRegistry()

  if (!strategy || !market || !learning || !innovation || !impact || !control) {
    return null
  }

  const intelligenceScore = clamp(
    Math.floor(
      (strategy.alignmentScore * 0.08 +
        market.opportunityScore * 0.08 +
        learning.improvementScore * 0.08 +
        innovation.innovationScore * 0.08 +
        impact.impactScore * 0.08 +
        community.engagementScore * 0.08 +
        researchLab.publicationScore * 0.08 +
        synthesis.integrationScore * 0.08 +
        evolution.evolutionScore * 0.08 +
        gammaNexus.enterpriseScore * 0.12)
    ),
    0,
    100
  )

  const adaptabilityScore = clamp(
    Math.floor((learning.growthRate * 0.3 + market.opportunityScore * 0.25 + innovation.ideaVelocity * 0.2 + evolution.autonomyScore * 0.25)),
    0,
    100
  )

  const learningVelocity = clamp(learning.growthRate, 0, 100)
  const innovationCapacity = clamp(innovation.commercialPotential, 0, 100)
  const impactPotential = clamp(impact.impactScore, 0, 100)
  const marketReadiness = clamp(market.adoptionScore, 0, 100)
  const ecosystemStrength = clamp(gammaNexus.ecosystemStrength, 0, 100)
  const knowledgeCapital = clamp(synthesis.knowledgeDensity, 0, 100)
  const healthScore = clamp(
    Math.floor(
      (intelligenceScore * 0.15 +
        adaptabilityScore * 0.1 +
        learningVelocity * 0.1 +
        innovationCapacity * 0.1 +
        impactPotential * 0.1 +
        marketReadiness * 0.1 +
        ecosystemStrength * 0.15 +
        knowledgeCapital * 0.15)
    ),
    0,
    100
  )

  const elements: IntelligenceCoreElement[] = [
    { elementId: "strategy", elementName: "Strategy", status: intelligenceScore > 70 ? "healthy" : "watch", score: strategy.alignmentScore },
    { elementId: "market", elementName: "Market Intelligence", status: marketReadiness > 70 ? "healthy" : "watch", score: market.opportunityScore },
    { elementId: "learning", elementName: "Learning", status: learningVelocity > 70 ? "healthy" : "watch", score: learning.improvementScore },
    { elementId: "innovation", elementName: "Innovation", status: innovationCapacity > 70 ? "healthy" : "watch", score: innovation.innovationScore },
    { elementId: "impact", elementName: "Impact", status: impactPotential > 70 ? "healthy" : "watch", score: impact.impactScore },
  ]

  return {
    mission: slug,
    missionTitle: "Research Mission 001",
    intelligenceScore,
    adaptabilityScore,
    learningVelocity,
    innovationCapacity,
    impactPotential,
    marketReadiness,
    ecosystemStrength,
    knowledgeCapital,
    healthScore,
    elements,
    recommendations: ["Accelerate learning", "Increase innovation", "Expand market reach", "Strengthen ecosystem"],
    roadmap: buildIntelligenceCoreRoadmap(slug),
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

export async function getIntelligenceCoreRegistry(): Promise<{
  intelligenceScore: number
  adaptabilityScore: number
  learningVelocity: number
  innovationCapacity: number
  impactPotential: number
  marketReadiness: number
  ecosystemStrength: number
  knowledgeCapital: number
  healthScore: number
  missions: MissionIntelligenceCoreWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionIntelligenceCoreWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionIntelligenceCore(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const intelligenceScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.intelligenceScore, 0) / missionCount) : 0
  const adaptabilityScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.adaptabilityScore, 0) / missionCount) : 0
  const learningVelocity = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.learningVelocity, 0) / missionCount) : 0
  const innovationCapacity = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.innovationCapacity, 0) / missionCount) : 0
  const impactPotential = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.impactPotential, 0) / missionCount) : 0
  const marketReadiness = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.marketReadiness, 0) / missionCount) : 0
  const ecosystemStrength = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.ecosystemStrength, 0) / missionCount) : 0
  const knowledgeCapital = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.knowledgeCapital, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    intelligenceScore,
    adaptabilityScore,
    learningVelocity,
    innovationCapacity,
    impactPotential,
    marketReadiness,
    ecosystemStrength,
    knowledgeCapital,
    healthScore,
    missions: results,
  }
}
