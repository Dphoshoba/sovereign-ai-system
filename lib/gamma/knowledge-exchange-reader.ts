import { MissionKnowledgeExchangeWorkspace } from "@/lib/knowledge-exchange/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionKnowledgeExchange(
  slug: string
): Promise<MissionKnowledgeExchangeWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const knowledgeFlow = clamp(
    Math.floor((core.learningVelocity * 0.7 + core.intelligenceScore * 0.3)),
    0,
    100
  )
  const reusePotential = clamp(
    Math.floor((core.knowledgeCapital * 0.6 + core.innovationCapacity * 0.4)),
    0,
    100
  )
  const exchangeScore = clamp(
    Math.floor((knowledgeFlow * 0.5 + reusePotential * 0.5)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    exchangeCount: 16,
    knowledgeFlow,
    reusePotential,
    crossPollinization: 74,
    exchangeScore,
    healthScore: exchangeScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getKnowledgeExchangeRegistry(): Promise<{
  exchangeCount: number
  knowledgeFlow: number
  reusePotential: number
  crossPollinization: number
  exchangeScore: number
  healthScore: number
  missions: MissionKnowledgeExchangeWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionKnowledgeExchangeWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionKnowledgeExchange(mission.slug)
    if (workspace) results.push(workspace)
  }

  const avgKnowledgeFlow = Math.floor(
    results.reduce((sum, r) => sum + r.knowledgeFlow, 0) / results.length
  )
  const avgReusePotential = Math.floor(
    results.reduce((sum, r) => sum + r.reusePotential, 0) / results.length
  )
  const avgExchangeScore = Math.floor(
    results.reduce((sum, r) => sum + r.exchangeScore, 0) / results.length
  )

  return {
    exchangeCount: results.length * 16,
    knowledgeFlow: avgKnowledgeFlow,
    reusePotential: avgReusePotential,
    crossPollinization: 74,
    exchangeScore: avgExchangeScore,
    healthScore: avgExchangeScore,
    missions: results,
  }
}
