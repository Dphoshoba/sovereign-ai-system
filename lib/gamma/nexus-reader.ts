import { getOptimizationRegistry } from "./optimization-reader"
import { getPredictionRegistry } from "./prediction-reader"
import { getScenarioRegistry } from "./scenario-reader"
import { getSimulationRegistry } from "./simulation-reader"
import { getAdaptiveRegistry } from "./adaptive-reader"
import { getSignalRegistry } from "./signal-reader"
import { getPortfolioRegistry } from "./portfolio-reader"
import { getAutonomyRegistry } from "./autonomy-reader"
import { getMetaIntelligenceRegistry } from "./meta-intelligence-reader"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"
import { getMissionControlRegistry } from "./mission-control-reader"
import { getGammaOsRegistry } from "./gamma-os-reader"
import { getResearchMissions } from "./research-registry"
import { buildNexusRoadmap } from "../nexus/mock-data"
import type { MissionNexusWorkspace, NexusComponent } from "../nexus/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionNexus(slug: string): Promise<MissionNexusWorkspace | null> {
  const [opt, pred, scen, sim, adap, sig, port, auto, meta, core, mc, os] = await Promise.all([
    getOptimizationRegistry(),
    getPredictionRegistry(),
    getScenarioRegistry(),
    getSimulationRegistry(),
    getAdaptiveRegistry(),
    getSignalRegistry(),
    getPortfolioRegistry(),
    getAutonomyRegistry(),
    getMetaIntelligenceRegistry(),
    getIntelligenceCoreRegistry(),
    getMissionControlRegistry(),
    getGammaOsRegistry(),
  ])

  const nexusScore = clamp(
    Math.floor(
      (core.intelligenceScore * 0.15 +
        opt.efficiencyScore * 0.12 +
        pred.confidenceScore * 0.12 +
        adap.adaptationScore * 0.12 +
        auto.autonomyScore * 0.1 +
        meta.metaScore * 0.1 +
        core.adaptabilityScore * 0.09 +
        core.learningVelocity * 0.05) /
        0.85
    ),
    0,
    100
  )

  const adaptabilityScore = clamp(Math.floor((adap.adaptationScore * 0.5 + core.adaptabilityScore * 0.5)), 0, 100)
  const optimizationScore = clamp(Math.floor((opt.efficiencyScore * 0.4 + pred.growthProjection * 0.3 + sim.testCoverage * 0.3)), 0, 100)
  const intelligenceScore = clamp(Math.floor((core.intelligenceScore * 0.5 + meta.metaScore * 0.5)), 0, 100)
  const portfolioValue = clamp(Math.floor((port.workspaceCoverage * 0.5 + port.readinessScore * 0.5)), 0, 100)
  const missionReadiness = clamp(Math.floor((mc.readinessScore * 0.7 + port.readinessScore * 0.3)), 0, 100)
  const ecosystemStrength = clamp(Math.floor((core.ecosystemStrength * 0.4 + port.workspaceCoverage * 0.3 + core.knowledgeCapital * 0.3)), 0, 100)
  const healthScore = clamp(
    Math.floor(
      (nexusScore * 0.2 +
        adaptabilityScore * 0.15 +
        optimizationScore * 0.15 +
        intelligenceScore * 0.15 +
        missionReadiness * 0.15 +
        ecosystemStrength * 0.2) /
        1
    ),
    0,
    100
  )

  const components: NexusComponent[] = [
    { componentId: "opt", name: "Optimization Engine", status: "active", score: opt.efficiencyScore },
    { componentId: "pred", name: "Prediction Engine", status: "active", score: pred.confidenceScore },
    { componentId: "scen", name: "Scenario Engine", status: "active", score: scen.expectedCase },
    { componentId: "sim", name: "Simulation Engine", status: "active", score: sim.testCoverage },
    { componentId: "adap", name: "Adaptive Engine", status: "active", score: adap.adaptationScore },
    { componentId: "sig", name: "Signal Engine", status: "active", score: sig.trendScore },
    { componentId: "port", name: "Portfolio Engine", status: "active", score: port.readinessScore },
    { componentId: "auto", name: "Autonomy Engine", status: "active", score: auto.autonomyScore },
    { componentId: "meta", name: "Meta Intelligence", status: "active", score: meta.metaScore },
    { componentId: "core", name: "Intelligence Core", status: "active", score: core.intelligenceScore },
    { componentId: "mc", name: "Mission Control", status: "active", score: mc.readinessScore },
    { componentId: "os", name: "Gamma OS", status: "active", score: 85 },
  ]

  return {
    mission: slug,
    missionTitle: "Research Mission 001",
    nexusScore,
    adaptabilityScore,
    optimizationScore,
    intelligenceScore,
    portfolioValue,
    missionReadiness,
    ecosystemStrength,
    healthScore,
    components,
    recommendations: ["Maximize unified intelligence", "Optimize cross-engine coordination", "Expand ecosystem reach"],
    roadmap: buildNexusRoadmap(slug),
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

export async function getNexusRegistry(): Promise<{
  nexusScore: number
  adaptabilityScore: number
  optimizationScore: number
  intelligenceScore: number
  portfolioValue: number
  missionReadiness: number
  ecosystemStrength: number
  healthScore: number
  missions: MissionNexusWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionNexusWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionNexus(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgNexus = results.reduce((s, w) => s + w.nexusScore, 0) / results.length || 0
  const avgAdapt = results.reduce((s, w) => s + w.adaptabilityScore, 0) / results.length || 0
  const avgOpt = results.reduce((s, w) => s + w.optimizationScore, 0) / results.length || 0
  const avgInt = results.reduce((s, w) => s + w.intelligenceScore, 0) / results.length || 0
  const avgPort = results.reduce((s, w) => s + w.portfolioValue, 0) / results.length || 0
  const avgReady = results.reduce((s, w) => s + w.missionReadiness, 0) / results.length || 0
  const avgEco = results.reduce((s, w) => s + w.ecosystemStrength, 0) / results.length || 0

  return {
    nexusScore: Math.floor(avgNexus),
    adaptabilityScore: Math.floor(avgAdapt),
    optimizationScore: Math.floor(avgOpt),
    intelligenceScore: Math.floor(avgInt),
    portfolioValue: Math.floor(avgPort),
    missionReadiness: Math.floor(avgReady),
    ecosystemStrength: Math.floor(avgEco),
    healthScore: Math.floor(
      (avgNexus * 0.2 + avgAdapt * 0.15 + avgOpt * 0.15 + avgInt * 0.15 + avgReady * 0.15 + avgEco * 0.2) / 1
    ),
    missions: results,
  }
}
