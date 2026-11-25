import { getResearchMissions } from "./research-registry"
import { GAMMA_TEMPLATES } from "../templates/mock-data"
import type { GammaTemplateWorkspace } from "../templates/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionTemplateWorkspace(slug: string): Promise<GammaTemplateWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((item) => item.slug === slug)
  if (!mission) {
    return null
  }

  const templateCount = GAMMA_TEMPLATES.length
  const coverageScore = clamp(Math.floor((templateCount / 6) * 100), 0, 100)
  const adoptionScore = clamp(Math.floor(coverageScore * 0.86), 0, 100)
  const reuseScore = clamp(Math.floor((coverageScore + adoptionScore) / 2), 0, 100)
  const healthScore = clamp(Math.floor((coverageScore + adoptionScore + reuseScore) / 3), 0, 100)

  return {
    mission: slug,
    missionTitle: mission.title,
    templateCount,
    coverageScore,
    adoptionScore,
    reuseScore,
    healthScore,
    templates: [...GAMMA_TEMPLATES],
    recommendations: [
      "Keep template metadata aligned with mission registry slugs.",
      "Track template adoption in bootstrap and academy engines.",
      "Preserve deterministic markdown template contracts.",
    ],
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

export async function getTemplateRegistry(): Promise<{
  missionCount: number
  templateCount: number
  coverageScore: number
  adoptionScore: number
  reuseScore: number
  healthScore: number
  missions: GammaTemplateWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: GammaTemplateWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionTemplateWorkspace(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const templateCount = missionCount > 0 ? results[0].templateCount : 0
  const coverageScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.coverageScore, 0) / missionCount) : 0
  const adoptionScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.adoptionScore, 0) / missionCount) : 0
  const reuseScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.reuseScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    missionCount,
    templateCount,
    coverageScore,
    adoptionScore,
    reuseScore,
    healthScore,
    missions: results,
  }
}