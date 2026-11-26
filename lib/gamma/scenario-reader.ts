import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"
import { getResearchMissions } from "./research-registry"
import { buildScenarioRoadmap } from "../scenario/mock-data"
import type { MissionScenarioWorkspace, ScenarioItem } from "../scenario/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionScenario(slug: string): Promise<MissionScenarioWorkspace | null> {
  const core = await getIntelligenceCoreRegistry()

  if (!core) {
    return null
  }

  const scenarioCount = 4
  const bestCase = clamp(Math.floor((core.intelligenceScore * 0.5 + core.innovationCapacity * 0.5)), 0, 100)
  const worstCase = clamp(Math.floor((100 - core.intelligenceScore * 0.4 - core.adaptabilityScore * 0.4)), 0, 100)
  const expectedCase = clamp(Math.floor(((bestCase + worstCase) / 2 * 0.6 + core.learningVelocity * 0.4)), 0, 100)
  const readinessScore = clamp(Math.floor((core.marketReadiness * 0.4 + core.adaptabilityScore * 0.6)), 0, 100)
  const healthScore = clamp(Math.floor((expectedCase * 0.4 + readinessScore * 0.6)), 0, 100)

  const scenarios: ScenarioItem[] = Array.from({ length: scenarioCount }, (_, i) => ({
    scenarioId: `scn-${i + 1}`,
    name: `Scenario ${i + 1}`,
    probability: 25 + (i % 2) * 10,
    outcome: `Outcome ${i + 1}`,
  }))

  return {
    mission: slug,
    missionTitle: "Research Mission 001",
    scenarioCount,
    bestCase,
    worstCase,
    expectedCase,
    readinessScore,
    healthScore,
    scenarios,
    recommendations: ["Plan for contingencies", "Prepare for best case", "Mitigate worst case"],
    roadmap: buildScenarioRoadmap(slug),
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

export async function getScenarioRegistry(): Promise<{
  scenarioCount: number
  bestCase: number
  worstCase: number
  expectedCase: number
  readinessScore: number
  healthScore: number
  missions: MissionScenarioWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionScenarioWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionScenario(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgBest = results.reduce((s, w) => s + w.bestCase, 0) / results.length || 0
  const avgWorst = results.reduce((s, w) => s + w.worstCase, 0) / results.length || 0
  const avgExpected = results.reduce((s, w) => s + w.expectedCase, 0) / results.length || 0
  const avgReadiness = results.reduce((s, w) => s + w.readinessScore, 0) / results.length || 0

  return {
    scenarioCount: results.reduce((s, w) => s + w.scenarioCount, 0),
    bestCase: Math.floor(avgBest),
    worstCase: Math.floor(avgWorst),
    expectedCase: Math.floor(avgExpected),
    readinessScore: Math.floor(avgReadiness),
    healthScore: Math.floor((avgExpected * 0.4 + avgReadiness * 0.6)),
    missions: results,
  }
}
