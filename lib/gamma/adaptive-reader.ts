import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"
import { getResearchMissions } from "./research-registry"
import { buildAdaptiveRoadmap } from "../adaptive/mock-data"
import type { MissionAdaptiveWorkspace, AdaptationItem } from "../adaptive/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionAdaptive(slug: string): Promise<MissionAdaptiveWorkspace | null> {
  const core = await getIntelligenceCoreRegistry()

  if (!core) {
    return null
  }

  const adaptationScore = clamp(Math.floor((core.adaptabilityScore * 0.6 + core.learningVelocity * 0.4)), 0, 100)
  const changeVelocity = clamp(Math.floor((core.learningVelocity * 0.5 + core.innovationCapacity * 0.5)), 0, 100)
  const learningCapacity = clamp(Math.floor((core.knowledgeCapital * 0.4 + core.learningVelocity * 0.6)), 0, 100)
  const selfImprovement = clamp(Math.floor((core.adaptabilityScore * 0.7 + core.learningVelocity * 0.3)), 0, 100)
  const healthScore = clamp(Math.floor((adaptationScore * 0.3 + changeVelocity * 0.25 + learningCapacity * 0.25 + selfImprovement * 0.2)), 0, 100)

  const adaptations: AdaptationItem[] = Array.from({ length: 4 }, (_, i) => ({
    adaptationId: `adapt-${i + 1}`,
    name: `Adaptation ${i + 1}`,
    effectivenesScore: adaptationScore - i * 5,
    implementationCost: 30 + i * 10,
  }))

  return {
    mission: slug,
    missionTitle: "Research Mission 001",
    adaptationScore,
    changeVelocity,
    learningCapacity,
    selfImprovement,
    healthScore,
    adaptations,
    recommendations: ["Accelerate adaptation", "Increase learning capacity", "Enable self-improvement"],
    roadmap: buildAdaptiveRoadmap(slug),
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

export async function getAdaptiveRegistry(): Promise<{
  adaptationScore: number
  changeVelocity: number
  learningCapacity: number
  selfImprovement: number
  healthScore: number
  missions: MissionAdaptiveWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionAdaptiveWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionAdaptive(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgAdapt = results.reduce((s, w) => s + w.adaptationScore, 0) / results.length || 0
  const avgChange = results.reduce((s, w) => s + w.changeVelocity, 0) / results.length || 0
  const avgCapacity = results.reduce((s, w) => s + w.learningCapacity, 0) / results.length || 0
  const avgSelf = results.reduce((s, w) => s + w.selfImprovement, 0) / results.length || 0

  return {
    adaptationScore: Math.floor(avgAdapt),
    changeVelocity: Math.floor(avgChange),
    learningCapacity: Math.floor(avgCapacity),
    selfImprovement: Math.floor(avgSelf),
    healthScore: Math.floor((avgAdapt * 0.3 + avgChange * 0.25 + avgCapacity * 0.25 + avgSelf * 0.2)),
    missions: results,
  }
}
