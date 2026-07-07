import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"
import { getResearchMissions } from "./research-registry"
import { buildAutonomyRoadmap } from "../autonomy/mock-data"
import type { MissionAutonomyWorkspace, AutonomyCapability } from "../autonomy/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionAutonomy(slug: string): Promise<MissionAutonomyWorkspace | null> {
  const core = await getIntelligenceCoreRegistry()

  if (!core) {
    return null
  }

  const automationCoverage = clamp(Math.floor((core.intelligenceScore * 0.5 + core.adaptabilityScore * 0.5)), 0, 100)
  const autonomyScore = clamp(Math.floor((core.adaptabilityScore * 0.4 + core.learningVelocity * 0.6)), 0, 100)
  const executionCapability = clamp(Math.floor((core.knowledgeCapital * 0.3 + core.adaptabilityScore * 0.7)), 0, 100)
  const decisionCapacity = clamp(Math.floor((core.intelligenceScore * 0.6 + core.adaptabilityScore * 0.4)), 0, 100)
  const healthScore = clamp(Math.floor((automationCoverage * 0.25 + autonomyScore * 0.3 + executionCapability * 0.25 + decisionCapacity * 0.2)), 0, 100)

  const capabilities: AutonomyCapability[] = Array.from({ length: 5 }, (_, i) => ({
    capabilityId: `cap-${i + 1}`,
    name: `Autonomous Capability ${i + 1}`,
    automationLevel: automationCoverage - i * 8,
    readiness: autonomyScore - i * 5,
  }))

  return {
    mission: slug,
    missionTitle: "Research Mission 001",
    automationCoverage,
    autonomyScore,
    executionCapability,
    decisionCapacity,
    healthScore,
    capabilities,
    recommendations: ["Increase automation", "Enable autonomy", "Improve execution"],
    roadmap: buildAutonomyRoadmap(slug),
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

export async function getAutonomyRegistry(): Promise<{
  automationCoverage: number
  autonomyScore: number
  executionCapability: number
  decisionCapacity: number
  healthScore: number
  missions: MissionAutonomyWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionAutonomyWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionAutonomy(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgAutomation = results.reduce((s, w) => s + w.automationCoverage, 0) / results.length || 0
  const avgAutonomy = results.reduce((s, w) => s + w.autonomyScore, 0) / results.length || 0
  const avgExecution = results.reduce((s, w) => s + w.executionCapability, 0) / results.length || 0
  const avgDecision = results.reduce((s, w) => s + w.decisionCapacity, 0) / results.length || 0

  return {
    automationCoverage: Math.floor(avgAutomation),
    autonomyScore: Math.floor(avgAutonomy),
    executionCapability: Math.floor(avgExecution),
    decisionCapacity: Math.floor(avgDecision),
    healthScore: Math.floor((avgAutomation * 0.25 + avgAutonomy * 0.3 + avgExecution * 0.25 + avgDecision * 0.2)),
    missions: results,
  }
}
