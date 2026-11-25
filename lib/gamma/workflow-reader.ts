import { getMissionExecution } from "./execution-reader"
import { getMissionPrioritization } from "./prioritization-reader"
import { getMissionControl } from "./mission-control-reader"
import { getResearchMissions } from "./research-registry"
import { buildWorkflowRoadmap } from "../workflow/mock-data"
import type { MissionWorkflowWorkspace, WorkflowStep } from "../workflow/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export async function getMissionWorkflow(slug: string): Promise<MissionWorkflowWorkspace | null> {
  const execution = await getMissionExecution(slug)
  const prioritization = await getMissionPrioritization(slug)
  const control = await getMissionControl(slug)

  if (!execution || !prioritization || !control) {
    return null
  }

  const workflowCount = Math.ceil(execution.taskCount / 4)
  const automationCoverage = clamp(
    Math.floor((prioritization.focusScore * 0.5 + execution.executionVelocity * 0.35 + control.readinessScore * 0.15)),
    0,
    100
  )

  const executionChains = Math.ceil(workflowCount / 2)
  const completionRate = clamp(Math.floor(execution.deliveryScore * 0.9), 0, 100)
  const dependencyCount = Math.ceil(executionChains * 1.5)

  const healthScore = clamp(
    Math.floor((execution.healthScore * 0.4 + prioritization.healthScore * 0.3 + control.healthScore * 0.3)),
    0,
    100
  )

  const workflows: WorkflowStep[] = Array.from({ length: workflowCount }, (_, i) => ({
    stepId: `workflow-${i + 1}`,
    title: `Workflow Chain ${i + 1}`,
    status: i < Math.ceil(workflowCount * 0.6) ? "active" : "pending",
    automationLevel: Math.floor((automationCoverage * (i + 1)) / workflowCount),
  }))

  const recommendations = unique([
    ...control.recommendations.slice(0, 2),
    automationCoverage > 75 ? "High automation: maintain efficiency" : "Increase workflow automation",
    completionRate > 80 ? "Completion rate strong" : "Improve completion tracking",
  ]).slice(0, 9)

  return {
    mission: slug,
    missionTitle: control.missionTitle,
    workflowCount,
    automationCoverage,
    executionChains,
    completionRate,
    dependencyCount,
    healthScore,
    workflows,
    recommendations,
    roadmap: buildWorkflowRoadmap(slug),
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

export async function getWorkflowRegistry() {
  const missions = await getResearchMissions()
  const workspaces = await Promise.all(missions.map((m) => getMissionWorkflow(m.slug)))
  const validWorkspaces = workspaces.filter(Boolean) as MissionWorkflowWorkspace[]

  const workflowCount = validWorkspaces.reduce((sum, w) => sum + w.workflowCount, 0)
  const automationCoverage = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.automationCoverage, 0) / validWorkspaces.length),
    0,
    100
  )
  const executionChains = validWorkspaces.reduce((sum, w) => sum + w.executionChains, 0)
  const completionRate = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.completionRate, 0) / validWorkspaces.length),
    0,
    100
  )
  const dependencyCount = validWorkspaces.reduce((sum, w) => sum + w.dependencyCount, 0)
  const healthScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.healthScore, 0) / validWorkspaces.length),
    0,
    100
  )

  return {
    workflowCount,
    automationCoverage,
    executionChains,
    completionRate,
    dependencyCount,
    healthScore,
    missions: validWorkspaces,
  }
}
