import { getCEOCenterRegistry } from "./ceo-center-reader"
import { getAgentRegistryRegistry } from "./agent-registry-reader"
import { getWorkflowRegistry } from "./workflow-reader"
import { getDecisionRegistry } from "./decision-reader"
import { getResourceAllocationRegistry } from "./resource-allocation-reader"
import { getFounderIntelligenceRegistry } from "./founder-intelligence-reader"
import { getMonetizationRegistry } from "./monetization-reader"
import { getGrowthRegistry } from "./growth-reader"
import { getEcosystemRegistry } from "./ecosystem-reader"
import { getPredictiveRegistry } from "./predictive-reader"
import { getGammaOsRegistry } from "./gamma-os-reader"
import { getResearchMissions } from "./research-registry"
import { buildGammaNexusRoadmap } from "../gamma-nexus/mock-data"
import type { MissionGammaNexusWorkspace, NexusElement } from "../gamma-nexus/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionGammaNexus(slug: string): Promise<MissionGammaNexusWorkspace | null> {
  const ceoCenter = await getCEOCenterRegistry()
  const agentRegistry = await getAgentRegistryRegistry()
  const workflow = await getWorkflowRegistry()
  const decision = await getDecisionRegistry()
  const resourceAllocation = await getResourceAllocationRegistry()
  const founderIntelligence = await getFounderIntelligenceRegistry()
  const monetization = await getMonetizationRegistry()
  const growth = await getGrowthRegistry()
  const ecosystem = await getEcosystemRegistry()
  const predictive = await getPredictiveRegistry()
  const gammaOs = await getGammaOsRegistry()

  if (!ceoCenter || !agentRegistry || !workflow) {
    return null
  }

  const enterpriseScore = clamp(
    Math.floor(
      (ceoCenter.executiveScore * 0.15 +
        agentRegistry.coordinationScore * 0.1 +
        workflow.automationCoverage * 0.1 +
        decision.strategicScore * 0.1 +
        founderIntelligence.leadershipScore * 0.1 +
        monetization.revenueScore * 0.1 +
        growth.growthPotential * 0.1 +
        ecosystem.ecosystemScore * 0.1 +
        predictive.confidenceScore * 0.08 +
        gammaOs.readinessScore * 0.07)
    ),
    0,
    100
  )

  const executionReadiness = clamp(
    Math.floor((workflow.completionRate * 0.35 + resourceAllocation.utilizationScore * 0.35 + ceoCenter.executionReadiness * 0.3)),
    0,
    100
  )

  const knowledgeCapital = clamp(
    Math.floor((ceoCenter.knowledgeCapital * 0.4 + resourceAllocation.capacityScore * 0.35 + ecosystem.communityAssets * 3.5)),
    0,
    100
  )

  const growthPotential = clamp(
    Math.floor((growth.growthPotential * 0.4 + ceoCenter.growthPotential * 0.3 + monetization.revenueScore * 0.2 + predictive.opportunityForecast * 0.1)),
    0,
    100
  )

  const monetizationPotential = clamp(
    Math.floor((monetization.revenueScore * 0.5 + ceoCenter.portfolioValue * 0.35 + growth.adoptionScore * 0.15)),
    0,
    100
  )

  const ecosystemStrength = clamp(
    Math.floor((ecosystem.ecosystemScore * 0.5 + agentRegistry.coordinationScore * 0.3 + ceoCenter.strategicAlignment * 0.2)),
    0,
    100
  )

  const forecastConfidence = clamp(
    Math.floor((predictive.confidenceScore * 0.6 + decision.confidenceScore * 0.25 + ceoCenter.healthScore * 0.15)),
    0,
    100
  )

  const autonomyScore = clamp(
    Math.floor((agentRegistry.coordinationScore * 0.35 + workflow.automationCoverage * 0.35 + decision.strategicScore * 0.3)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor(
      (enterpriseScore * 0.12 +
        executionReadiness * 0.12 +
        knowledgeCapital * 0.1 +
        growthPotential * 0.12 +
        monetizationPotential * 0.12 +
        ecosystemStrength * 0.12 +
        forecastConfidence * 0.12 +
        autonomyScore * 0.08)
    ),
    0,
    100
  )

  const elements: NexusElement[] = [
    { elementId: "ceo-center", elementName: "CEO Center", status: ceoCenter.healthScore > 70 ? "healthy" : "watch", score: ceoCenter.healthScore },
    { elementId: "agents", elementName: "Agent Registry", status: agentRegistry.healthScore > 70 ? "healthy" : "watch", score: agentRegistry.healthScore },
    { elementId: "workflows", elementName: "Workflow Engine", status: workflow.healthScore > 70 ? "healthy" : "watch", score: workflow.healthScore },
    { elementId: "decisions", elementName: "Decision Engine", status: decision.healthScore > 70 ? "healthy" : "watch", score: decision.healthScore },
    { elementId: "resources", elementName: "Resources", status: resourceAllocation.healthScore > 70 ? "healthy" : "watch", score: resourceAllocation.healthScore },
  ]

  return {
    mission: slug,
    missionTitle: "Gamma Nexus Control Center",
    enterpriseScore,
    executionReadiness,
    knowledgeCapital,
    growthPotential,
    monetizationPotential,
    ecosystemStrength,
    forecastConfidence,
    autonomyScore,
    healthScore,
    elements,
    recommendations: [
      "Monitor all system metrics",
      "Optimize enterprise coordination",
      "Scale autonomous operations",
      "Expand market opportunities",
    ],
    roadmap: buildGammaNexusRoadmap(slug),
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

export async function getGammaNexusRegistry() {
  const missions = await getResearchMissions()
  const workspaces = await Promise.all(missions.map((m) => getMissionGammaNexus(m.slug)))
  const validWorkspaces = workspaces.filter(Boolean) as MissionGammaNexusWorkspace[]

  if (validWorkspaces.length === 0) {
    return {
      enterpriseScore: 0,
      executionReadiness: 0,
      knowledgeCapital: 0,
      growthPotential: 0,
      monetizationPotential: 0,
      ecosystemStrength: 0,
      forecastConfidence: 0,
      autonomyScore: 0,
      healthScore: 0,
      missions: [],
    }
  }

  const enterpriseScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.enterpriseScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const executionReadiness = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.executionReadiness, 0) / validWorkspaces.length),
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
  const monetizationPotential = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.monetizationPotential, 0) / validWorkspaces.length),
    0,
    100
  )
  const ecosystemStrength = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.ecosystemStrength, 0) / validWorkspaces.length),
    0,
    100
  )
  const forecastConfidence = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.forecastConfidence, 0) / validWorkspaces.length),
    0,
    100
  )
  const autonomyScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.autonomyScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const healthScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.healthScore, 0) / validWorkspaces.length),
    0,
    100
  )

  return {
    enterpriseScore,
    executionReadiness,
    knowledgeCapital,
    growthPotential,
    monetizationPotential,
    ecosystemStrength,
    forecastConfidence,
    autonomyScore,
    healthScore,
    missions: validWorkspaces,
  }
}
