import { getMissionControl } from "./mission-control-reader"
import { getMissionAdvisor } from "./advisor-reader"
import { getMissionExecution } from "./execution-reader"
import { getResearchMissions } from "./research-registry"
import { buildAgentRoadmap } from "../agent-registry/mock-data"
import type { MissionAgentRegistryWorkspace, AgentRegistryItem } from "../agent-registry/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export async function getMissionAgentRegistry(slug: string): Promise<MissionAgentRegistryWorkspace | null> {
  const control = await getMissionControl(slug)
  const advisor = await getMissionAdvisor(slug)
  const execution = await getMissionExecution(slug)

  if (!control || !advisor || !execution) {
    return null
  }

  const agentCount = 5
  const activeAgents = Math.ceil(agentCount * (execution.executionVelocity / 100))
  const availableCapabilities = agentCount * 3

  const missionCoverage = clamp(
    Math.floor((control.readinessScore * 0.4 + advisor.missionFocusScore * 0.35 + execution.focusScore * 0.25)),
    0,
    100
  )

  const coordinationScore = clamp(
    Math.floor((execution.focusScore * 0.45 + control.alignmentScore * 0.35 + advisor.missionFocusScore * 0.2)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((execution.healthScore * 0.4 + control.healthScore * 0.35 + advisor.healthScore * 0.25)),
    0,
    100
  )

  const agents: AgentRegistryItem[] = Array.from({ length: agentCount }, (_, i) => ({
    agentId: `agent-${i + 1}`,
    agentName: `Agent ${i + 1}`,
    capabilities: 3,
    status: i < activeAgents ? "available" : "offline",
    missionCoverage: Math.floor((missionCoverage * (i + 1)) / agentCount),
  }))

  const recommendations = unique([
    ...advisor.creatorSuggestions.slice(0, 2),
    activeAgents < agentCount ? `Activate ${agentCount - activeAgents} dormant agents` : "All agents active",
    missionCoverage > 80 ? "Mission coverage strong: expand capabilities" : "Increase coverage focus",
  ]).slice(0, 9)

  return {
    mission: slug,
    missionTitle: control.missionTitle,
    agentCount,
    activeAgents,
    availableCapabilities,
    missionCoverage,
    coordinationScore,
    healthScore,
    agents,
    recommendations,
    roadmap: buildAgentRoadmap(slug),
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

export async function getAgentRegistryRegistry() {
  const missions = await getResearchMissions()
  const workspaces = await Promise.all(missions.map((m) => getMissionAgentRegistry(m.slug)))
  const validWorkspaces = workspaces.filter(Boolean) as MissionAgentRegistryWorkspace[]

  const agentCount = validWorkspaces.reduce((sum, w) => sum + w.agentCount, 0)
  const activeAgents = validWorkspaces.reduce((sum, w) => sum + w.activeAgents, 0)
  const availableCapabilities = validWorkspaces.reduce((sum, w) => sum + w.availableCapabilities, 0)
  const missionCoverage = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.missionCoverage, 0) / validWorkspaces.length),
    0,
    100
  )
  const coordinationScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.coordinationScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const healthScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.healthScore, 0) / validWorkspaces.length),
    0,
    100
  )

  return {
    agentCount,
    activeAgents,
    availableCapabilities,
    missionCoverage,
    coordinationScore,
    healthScore,
    missions: validWorkspaces,
  }
}
