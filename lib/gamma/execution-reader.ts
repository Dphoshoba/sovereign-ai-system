import { getMissionPlanner } from "./planner-reader"
import { getMissionMaturity } from "./maturity-reader"
import { getMissionControl } from "./mission-control-reader"
import { getMissionAdvisor } from "./advisor-reader"
import { getResearchMissions } from "./research-registry"
import { buildExecutionRoadmap } from "../execution/mock-data"
import type { MissionExecutionWorkspace, ExecutionItem } from "../execution/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export async function getMissionExecution(slug: string): Promise<MissionExecutionWorkspace | null> {
  const planner = await getMissionPlanner(slug)
  const maturity = await getMissionMaturity(slug)
  const control = await getMissionControl(slug)
  const advisor = await getMissionAdvisor(slug)

  if (!planner || !maturity || !control || !advisor) {
    return null
  }

  const taskCount = planner.taskCount || 12
  const activeProjects = Math.ceil(planner.taskCount / 3)
  
  const executionCapacity = clamp(
    Math.floor((maturity.healthScore * 0.4 + control.readinessScore * 0.3 + planner.momentum * 0.3)),
    0,
    100
  )

  const executionVelocity = clamp(
    Math.floor((planner.deliveryScore * 0.5 + control.riskScore * 0.3 + advisor.momentumScore * 0.2)),
    0,
    100
  )

  const bottlenecks = Math.max(0, Math.floor((100 - executionVelocity) / 20))
  const blockedItems = Math.max(0, Math.floor((100 - maturity.readinessScore) / 15))

  const focusScore = clamp(
    Math.floor((advisor.missionFocusScore * 0.5 + planner.roadmapScore * 0.3 + control.alignmentScore * 0.2)),
    0,
    100
  )

  const deliveryScore = clamp(
    Math.floor((planner.deliveryScore * 0.45 + executionVelocity * 0.35 + control.readinessScore * 0.2)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((planner.healthScore * 0.4 + maturity.healthScore * 0.3 + control.healthScore * 0.3)),
    0,
    100
  )

  const execution: ExecutionItem[] = [
    {
      title: `Phase ${Math.floor(planner.taskCount / 3) + 1} delivery`,
      status: executionVelocity > 75 ? ("on-track" as const) : executionVelocity > 50 ? ("at-risk" as const) : ("blocked" as const),
      priority: "critical" as const,
      progress: executionVelocity,
      dueDate: "2026-07-15",
    },
    {
      title: "Dependency resolution",
      status: blockedItems > 2 ? ("blocked" as const) : blockedItems > 0 ? ("at-risk" as const) : ("on-track" as const),
      priority: blockedItems > 2 ? ("critical" as const) : ("high" as const),
      progress: Math.max(0, 100 - blockedItems * 25),
      dueDate: "2026-07-10",
    },
    {
      title: "Momentum acceleration",
      status: focusScore > 70 ? ("on-track" as const) : ("at-risk" as const),
      priority: "high" as const,
      progress: focusScore,
      dueDate: "2026-07-12",
    },
  ]

  const recommendations = unique([
    ...control.recommendations.slice(0, 3),
    ...planner.recommendations.slice(0, 3),
    `Focus score at ${focusScore}: ${focusScore > 70 ? "maintain momentum" : "reduce task switching"}`,
  ]).slice(0, 9)

  return {
    mission: slug,
    missionTitle: control.missionTitle,
    taskCount,
    activeProjects,
    executionCapacity,
    executionVelocity,
    bottlenecks,
    blockedItems,
    focusScore,
    deliveryScore,
    healthScore,
    execution,
    recommendations,
    roadmap: buildExecutionRoadmap(slug),
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

export async function getExecutionRegistry() {
  const missions = await getResearchMissions()
  const workspaces = await Promise.all(missions.map((m) => getMissionExecution(m.slug)))
  const validWorkspaces = workspaces.filter(Boolean) as MissionExecutionWorkspace[]

  const taskCount = validWorkspaces.reduce((sum, w) => sum + w.taskCount, 0)
  const activeProjects = validWorkspaces.reduce((sum, w) => sum + w.activeProjects, 0)
  const executionCapacity = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.executionCapacity, 0) / validWorkspaces.length),
    0,
    100
  )
  const executionVelocity = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.executionVelocity, 0) / validWorkspaces.length),
    0,
    100
  )
  const bottlenecks = validWorkspaces.reduce((sum, w) => sum + w.bottlenecks, 0)
  const blockedItems = validWorkspaces.reduce((sum, w) => sum + w.blockedItems, 0)
  const focusScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.focusScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const deliveryScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.deliveryScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const healthScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.healthScore, 0) / validWorkspaces.length),
    0,
    100
  )

  return {
    taskCount,
    activeProjects,
    executionCapacity,
    executionVelocity,
    bottlenecks,
    blockedItems,
    focusScore,
    deliveryScore,
    healthScore,
    missions: validWorkspaces,
  }
}
