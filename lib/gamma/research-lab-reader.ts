import { getMaturityRegistry } from "./maturity-reader"
import { getExecutionRegistry } from "./execution-reader"
import { getResearchMissions } from "./research-registry"
import { buildResearchLabRoadmap } from "../research-lab/mock-data"
import type { MissionResearchLabWorkspace, ResearchProject } from "../research-lab/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionResearchLab(slug: string): Promise<MissionResearchLabWorkspace | null> {
  const maturity = await getMaturityRegistry()
  const execution = await getExecutionRegistry()

  if (!maturity || !execution) {
    return null
  }

  const researchProjects = 5
  const discoveries = Math.floor(maturity.readinessScore / 15)
  const frameworks = 3
  const publicationScore = clamp(Math.floor((maturity.missionScore * 0.6 + execution.focusScore * 0.4)), 0, 100)
  const experimentationScore = clamp(Math.floor((execution.focusScore * 0.5 + maturity.readinessScore * 0.5)), 0, 100)
  const healthScore = clamp(Math.floor((publicationScore * 0.4 + experimentationScore * 0.3 + maturity.healthScore * 0.3)), 0, 100)

  const projects: ResearchProject[] = Array.from({ length: researchProjects }, (_, i) => ({
    projectId: `project-${i + 1}`,
    projectName: `Research Project ${i + 1}`,
    discoveryCount: discoveries - i,
    frameworkScore: 75 + i * 3,
    experimentationLevel: experimentationScore - i * 4,
  }))

  return {
    mission: slug,
    missionTitle: "Research Mission 001",
    researchProjects,
    discoveries,
    frameworks,
    publicationScore,
    experimentationScore,
    healthScore,
    projects,
    recommendations: ["Increase publication rate", "Expand research scope", "Strengthen frameworks"],
    roadmap: buildResearchLabRoadmap(slug),
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

export async function getResearchLabRegistry(): Promise<{
  researchProjects: number
  discoveries: number
  frameworks: number
  publicationScore: number
  experimentationScore: number
  healthScore: number
  missions: MissionResearchLabWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionResearchLabWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionResearchLab(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const researchProjects = missionCount > 0 ? 5 : 0
  const discoveries = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.discoveries, 0) / missionCount) : 0
  const frameworks = missionCount > 0 ? 3 : 0
  const publicationScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.publicationScore, 0) / missionCount) : 0
  const experimentationScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.experimentationScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    researchProjects,
    discoveries,
    frameworks,
    publicationScore,
    experimentationScore,
    healthScore,
    missions: results,
  }
}
