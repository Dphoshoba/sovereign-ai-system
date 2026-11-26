import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"
import { getResearchMissions } from "./research-registry"
import { buildSimulationRoadmap } from "../simulation/mock-data"
import type { MissionSimulationWorkspace, SimulationItem } from "../simulation/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionSimulation(slug: string): Promise<MissionSimulationWorkspace | null> {
  const core = await getIntelligenceCoreRegistry()

  if (!core) {
    return null
  }

  const simulationCount = 6
  const decisionModels = 5
  const testCoverage = clamp(Math.floor((core.intelligenceScore * 0.6 + core.knowledgeCapital * 0.4)), 0, 100)
  const executionProbability = clamp(Math.floor((core.learningVelocity * 0.4 + core.adaptabilityScore * 0.6)), 0, 100)
  const healthScore = clamp(Math.floor((testCoverage * 0.5 + executionProbability * 0.5)), 0, 100)

  const simulations: SimulationItem[] = Array.from({ length: simulationCount }, (_, i) => ({
    simulationId: `sim-${i + 1}`,
    name: `Simulation ${i + 1}`,
    outcome: testCoverage - i * 5,
    iterations: 100 * (i + 1),
  }))

  return {
    mission: slug,
    missionTitle: "Research Mission 001",
    simulationCount,
    decisionModels,
    testCoverage,
    executionProbability,
    healthScore,
    simulations,
    recommendations: ["Expand test coverage", "Increase model fidelity", "Validate execution paths"],
    roadmap: buildSimulationRoadmap(slug),
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

export async function getSimulationRegistry(): Promise<{
  simulationCount: number
  decisionModels: number
  testCoverage: number
  executionProbability: number
  healthScore: number
  missions: MissionSimulationWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionSimulationWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionSimulation(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgCoverage = results.reduce((s, w) => s + w.testCoverage, 0) / results.length || 0
  const avgExecution = results.reduce((s, w) => s + w.executionProbability, 0) / results.length || 0

  return {
    simulationCount: results.reduce((s, w) => s + w.simulationCount, 0),
    decisionModels: results.reduce((s, w) => s + w.decisionModels, 0),
    testCoverage: Math.floor(avgCoverage),
    executionProbability: Math.floor(avgExecution),
    healthScore: Math.floor((avgCoverage * 0.5 + avgExecution * 0.5)),
    missions: results,
  }
}
