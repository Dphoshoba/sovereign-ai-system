import { MissionIntellectualPropertyWorkspace } from "@/lib/intellectual-property/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionIntellectualProperty(slug: string): Promise<MissionIntellectualPropertyWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const ipScore = clamp(Math.floor((core.intelligenceScore * 0.6 + core.knowledgeCapital * 0.4)), 0, 100)
  const innovationScore = clamp(Math.floor((core.intelligenceScore * 0.7 + core.learningVelocity * 0.3)), 0, 100)
  const protectionScore = clamp(Math.floor((core.adaptabilityScore * 0.5 + core.intelligenceScore * 0.5)), 0, 100)
  const licensingPotential = clamp(Math.floor((ipScore * 0.6 + innovationScore * 0.4)), 0, 100)
  const patentStrength = clamp(Math.floor((innovationScore * 0.7 + core.knowledgeCapital * 0.3)), 0, 100)
  const trademarkValue = clamp(Math.floor((core.intelligenceScore * 0.5 + protectionScore * 0.5)), 0, 100)
  const copyrightCoverage = clamp(Math.floor((ipScore * 0.4 + protectionScore * 0.6)), 0, 100)

  return {
    mission: slug,
    missionTitle: mission.title,
    ipScore,
    innovationScore,
    protectionScore,
    licensingPotential,
    patentStrength,
    trademarkValue,
    copyrightCoverage,
    healthScore: ipScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getIntellectualPropertyRegistry(): Promise<{
  ipScore: number
  innovationScore: number
  protectionScore: number
  licensingPotential: number
  patentStrength: number
  trademarkValue: number
  copyrightCoverage: number
  healthScore: number
  missions: MissionIntellectualPropertyWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionIntellectualPropertyWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionIntellectualProperty(mission.slug)
    if (workspace) results.push(workspace)
  }

  return {
    ipScore: Math.floor(results.reduce((sum, r) => sum + r.ipScore, 0) / results.length),
    innovationScore: Math.floor(results.reduce((sum, r) => sum + r.innovationScore, 0) / results.length),
    protectionScore: Math.floor(results.reduce((sum, r) => sum + r.protectionScore, 0) / results.length),
    licensingPotential: Math.floor(results.reduce((sum, r) => sum + r.licensingPotential, 0) / results.length),
    patentStrength: Math.floor(results.reduce((sum, r) => sum + r.patentStrength, 0) / results.length),
    trademarkValue: Math.floor(results.reduce((sum, r) => sum + r.trademarkValue, 0) / results.length),
    copyrightCoverage: Math.floor(results.reduce((sum, r) => sum + r.copyrightCoverage, 0) / results.length),
    healthScore: Math.floor(results.reduce((sum, r) => sum + r.ipScore, 0) / results.length),
    missions: results,
  }
}
