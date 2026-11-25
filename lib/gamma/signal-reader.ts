import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"
import { getResearchMissions } from "./research-registry"
import { buildSignalRoadmap } from "../signal/mock-data"
import type { MissionSignalWorkspace, SignalItem } from "../signal/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionSignal(slug: string): Promise<MissionSignalWorkspace | null> {
  const core = await getIntelligenceCoreRegistry()

  if (!core) {
    return null
  }

  const signalCount = 12
  const trendScore = clamp(Math.floor((core.intelligenceScore * 0.5 + core.learningVelocity * 0.5)), 0, 100)
  const anomalyCount = Math.floor(signalCount * 0.25)
  const prioritySignals = Math.floor(signalCount * 0.4)
  const healthScore = clamp(Math.floor((trendScore * 0.6 + (100 - anomalyCount) * 0.4)), 0, 100)

  const signals: SignalItem[] = Array.from({ length: signalCount }, (_, i) => ({
    signalId: `sig-${i + 1}`,
    name: `Signal ${i + 1}`,
    strength: trendScore - Math.floor(i / 2) * 5,
    relevance: 80 - (i % 5) * 10,
  }))

  return {
    mission: slug,
    missionTitle: "Research Mission 001",
    signalCount,
    trendScore,
    anomalyCount,
    prioritySignals,
    healthScore,
    signals,
    recommendations: ["Monitor emerging trends", "Detect anomalies early", "Act on priority signals"],
    roadmap: buildSignalRoadmap(slug),
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

export async function getSignalRegistry(): Promise<{
  signalCount: number
  trendScore: number
  anomalyCount: number
  prioritySignals: number
  healthScore: number
  missions: MissionSignalWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionSignalWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionSignal(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgTrend = results.reduce((s, w) => s + w.trendScore, 0) / results.length || 0
  const totalAnomalies = results.reduce((s, w) => s + w.anomalyCount, 0)
  const totalPriority = results.reduce((s, w) => s + w.prioritySignals, 0)

  return {
    signalCount: results.reduce((s, w) => s + w.signalCount, 0),
    trendScore: Math.floor(avgTrend),
    anomalyCount: totalAnomalies,
    prioritySignals: totalPriority,
    healthScore: Math.floor((avgTrend * 0.6 + (100 - totalAnomalies / 10) * 0.4)),
    missions: results,
  }
}
