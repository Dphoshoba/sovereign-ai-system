import { getMissionControl } from "./mission-control-reader"
import { getExecutionRegistry } from "./execution-reader"
import { getAdvisorRegistry } from "./advisor-reader"
import { getResearchMissions } from "./research-registry"
import { buildStrategyRoadmap } from "../strategy/mock-data"
import type { MissionStrategyWorkspace, StrategyItem } from "../strategy/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionStrategy(slug: string): Promise<MissionStrategyWorkspace | null> {
  const control = await getMissionControl(slug)
  const execution = await getExecutionRegistry()
  const advisor = await getAdvisorRegistry()

  if (!control || !execution || !advisor) {
    return null
  }

  const strategyCount = 4
  const strategicThemes = 3
  const competitiveAdvantage = clamp(Math.floor((execution.focusScore + advisor.momentumScore) / 2), 0, 100)
  const missionFit = clamp(control.alignmentScore, 0, 100)
  const alignmentScore = clamp(Math.floor((control.alignmentScore * 0.5 + execution.focusScore * 0.35 + advisor.missionFocusScore * 0.15)), 0, 100)
  const executionPotential = clamp(Math.floor((execution.executionVelocity * 0.6 + control.readinessScore * 0.4)), 0, 100)
  const healthScore = clamp(Math.floor((alignmentScore * 0.4 + executionPotential * 0.3 + control.healthScore * 0.3)), 0, 100)

  const strategies: StrategyItem[] = Array.from({ length: strategyCount }, (_, i) => ({
    strategyId: `strategy-${i + 1}`,
    strategyName: `Strategy ${i + 1}`,
    competitiveAdvantage: competitiveAdvantage - i * 5,
    alignment: alignmentScore - i * 3,
    resourcesRequired: 50 + i * 10,
  }))

  return {
    mission: slug,
    missionTitle: "Research Mission 001",
    strategyCount,
    strategicThemes,
    competitiveAdvantage,
    missionFit,
    alignmentScore,
    executionPotential,
    healthScore,
    strategies,
    recommendations: ["Define strategic priorities", "Align execution with strategy", "Monitor competitive landscape"],
    roadmap: buildStrategyRoadmap(slug),
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

export async function getStrategyRegistry(): Promise<{
  strategyCount: number
  strategicThemes: number
  competitiveAdvantage: number
  missionFit: number
  alignmentScore: number
  executionPotential: number
  healthScore: number
  missions: MissionStrategyWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionStrategyWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionStrategy(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const strategyCount = missionCount > 0 ? 4 : 0
  const strategicThemes = missionCount > 0 ? 3 : 0
  const competitiveAdvantage = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.competitiveAdvantage, 0) / missionCount) : 0
  const missionFit = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.missionFit, 0) / missionCount) : 0
  const alignmentScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.alignmentScore, 0) / missionCount) : 0
  const executionPotential = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.executionPotential, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    strategyCount,
    strategicThemes,
    competitiveAdvantage,
    missionFit,
    alignmentScore,
    executionPotential,
    healthScore,
    missions: results,
  }
}
