import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"
import { getResearchMissions } from "./research-registry"
import { buildOptimizationRoadmap } from "../optimization/mock-data"
import type { MissionOptimizationWorkspace, OptimizationItem } from "../optimization/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionOptimization(slug: string): Promise<MissionOptimizationWorkspace | null> {
  const core = await getIntelligenceCoreRegistry()

  if (!core) {
    return null
  }

  const optimizationCount = 6
  const efficiencyScore = clamp(Math.floor((core.intelligenceScore * 0.7 + core.adaptabilityScore * 0.3)), 0, 100)
  const costReduction = clamp(Math.floor((core.learningVelocity * 0.5 + core.innovationCapacity * 0.5)), 0, 100)
  const reusePotential = clamp(Math.floor((core.knowledgeCapital * 0.6 + core.ecosystemStrength * 0.4)), 0, 100)
  const improvementVelocity = clamp(Math.floor((core.learningVelocity * 0.4 + core.adaptabilityScore * 0.6)), 0, 100)
  const healthScore = clamp(Math.floor((efficiencyScore * 0.35 + costReduction * 0.3 + reusePotential * 0.35)), 0, 100)

  const optimizations: OptimizationItem[] = Array.from({ length: optimizationCount }, (_, i) => ({
    optimizationId: `opt-${i + 1}`,
    name: `Optimization ${i + 1}`,
    efficiencyGain: efficiencyScore - i * 3,
    costReduction: costReduction - i * 2,
  }))

  return {
    mission: slug,
    missionTitle: "Research Mission 001",
    optimizationCount,
    efficiencyScore,
    costReduction,
    reusePotential,
    improvementVelocity,
    healthScore,
    optimizations,
    recommendations: ["Increase reuse", "Accelerate efficiency", "Reduce costs"],
    roadmap: buildOptimizationRoadmap(slug),
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

export async function getOptimizationRegistry(): Promise<{
  optimizationCount: number
  efficiencyScore: number
  costReduction: number
  reusePotential: number
  improvementVelocity: number
  healthScore: number
  missions: MissionOptimizationWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionOptimizationWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionOptimization(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgEfficiency = results.reduce((s, w) => s + w.efficiencyScore, 0) / results.length || 0
  const avgCostReduction = results.reduce((s, w) => s + w.costReduction, 0) / results.length || 0
  const avgReuse = results.reduce((s, w) => s + w.reusePotential, 0) / results.length || 0
  const avgVelocity = results.reduce((s, w) => s + w.improvementVelocity, 0) / results.length || 0

  return {
    optimizationCount: results.reduce((s, w) => s + w.optimizationCount, 0),
    efficiencyScore: Math.floor(avgEfficiency),
    costReduction: Math.floor(avgCostReduction),
    reusePotential: Math.floor(avgReuse),
    improvementVelocity: Math.floor(avgVelocity),
    healthScore: Math.floor((avgEfficiency * 0.35 + avgCostReduction * 0.3 + avgReuse * 0.35)),
    missions: results,
  }
}
