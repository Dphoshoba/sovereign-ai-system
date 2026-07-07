import { getResearchMissions } from "./research-registry"
import { GAMMA_CREATE_COMMANDS } from "../create/mock-data"
import type { GammaCreateWorkspace } from "../create/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionCreateWorkspace(slug: string): Promise<GammaCreateWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((item) => item.slug === slug)
  if (!mission) {
    return null
  }

  const commandCount = GAMMA_CREATE_COMMANDS.length
  const templateCoverage = clamp(Math.floor((commandCount / 7) * 100), 0, 100)
  const workspaceGenerationScore = clamp(
    Math.floor(GAMMA_CREATE_COMMANDS.reduce((sum, item) => sum + item.workspaceGenerationScore, 0) / commandCount),
    0,
    100
  )
  const automationScore = clamp(Math.floor(templateCoverage * 0.45 + workspaceGenerationScore * 0.55), 0, 100)
  const healthScore = clamp(Math.floor((templateCoverage + workspaceGenerationScore + automationScore) / 3), 0, 100)

  return {
    mission: slug,
    missionTitle: mission.title,
    commandCount,
    templateCoverage,
    workspaceGenerationScore,
    automationScore,
    healthScore,
    commands: [...GAMMA_CREATE_COMMANDS],
    recommendations: [
      "Use deterministic template assignment for create commands.",
      "Validate workspace generation contracts before mission bootstrap.",
      "Preserve read-only command previews for SSR routes.",
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

export async function getCreateRegistry(): Promise<{
  missionCount: number
  commandCount: number
  templateCoverage: number
  workspaceGenerationScore: number
  automationScore: number
  healthScore: number
  missions: GammaCreateWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: GammaCreateWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionCreateWorkspace(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const commandCount = missionCount > 0 ? results[0].commandCount : 0
  const templateCoverage = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.templateCoverage, 0) / missionCount) : 0
  const workspaceGenerationScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.workspaceGenerationScore, 0) / missionCount) : 0
  const automationScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.automationScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    missionCount,
    commandCount,
    templateCoverage,
    workspaceGenerationScore,
    automationScore,
    healthScore,
    missions: results,
  }
}