import { getResearchMissions } from "./research-registry"
import { MISSION_BOOTSTRAP_TEMPLATES, buildMissionBootstrapRoadmap } from "../mission-bootstrap/mock-data"
import type { MissionBootstrapWorkspace } from "../mission-bootstrap/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionBootstrapWorkspace(slug: string): Promise<MissionBootstrapWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((item) => item.slug === slug)
  if (!mission) {
    return null
  }

  const templateCount = MISSION_BOOTSTRAP_TEMPLATES.length
  const workspaceCount = Math.max(...MISSION_BOOTSTRAP_TEMPLATES.map((item) => item.workspaceCount))
  const generatedAssets = MISSION_BOOTSTRAP_TEMPLATES.reduce((sum, item) => sum + item.generatedAssets, 0)
  const reuseScore = clamp(
    Math.floor(MISSION_BOOTSTRAP_TEMPLATES.reduce((sum, item) => sum + item.reuseScore, 0) / templateCount),
    0,
    100
  )

  const bootstrapCoverage = clamp(
    Math.floor((templateCount / 10) * 100),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor(reuseScore * 0.5 + bootstrapCoverage * 0.5),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    templateCount,
    workspaceCount,
    generatedAssets,
    reuseScore,
    bootstrapCoverage,
    healthScore,
    templates: [...MISSION_BOOTSTRAP_TEMPLATES],
    recommendations: [
      "Keep template contracts deterministic across all workspaces.",
      "Reuse validated assets before creating mission-specific variants.",
      "Run bootstrap checks before publishing new mission routes.",
    ],
    roadmap: buildMissionBootstrapRoadmap(slug),
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

export async function getMissionBootstrapRegistry(): Promise<{
  missionCount: number
  templateCount: number
  workspaceCount: number
  generatedAssets: number
  reuseScore: number
  bootstrapCoverage: number
  healthScore: number
  missions: MissionBootstrapWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionBootstrapWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionBootstrapWorkspace(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const templateCount = missionCount > 0 ? results[0].templateCount : 0
  const workspaceCount = missionCount > 0 ? results[0].workspaceCount : 0
  const generatedAssets = missionCount > 0 ? results[0].generatedAssets : 0
  const reuseScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.reuseScore, 0) / missionCount) : 0
  const bootstrapCoverage = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.bootstrapCoverage, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    missionCount,
    templateCount,
    workspaceCount,
    generatedAssets,
    reuseScore,
    bootstrapCoverage,
    healthScore,
    missions: results,
  }
}