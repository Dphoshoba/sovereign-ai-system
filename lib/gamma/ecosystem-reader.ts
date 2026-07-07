import { getMissionControl } from "./mission-control-reader"
import { getExecutionRegistry } from "./execution-reader"
import { getGrowthRegistry } from "./growth-reader"
import { getResearchMissions } from "./research-registry"
import { buildEcosystemRoadmap } from "../ecosystem/mock-data"
import type { MissionEcosystemWorkspace, EcosystemConnection } from "../ecosystem/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionEcosystem(slug: string): Promise<MissionEcosystemWorkspace | null> {
  const control = await getMissionControl(slug)
  const execution = await getExecutionRegistry()
  const growth = await getGrowthRegistry()

  if (!control || !execution || !growth) {
    return null
  }

  const partnerCount = 4
  const communityAssets = 8
  const connectedSystems = 6

  const networkStrength = clamp(
    Math.floor((control.alignmentScore * 0.4 + execution.focusScore * 0.35 + growth.communityScore * 0.25)),
    0,
    100
  )

  const ecosystemScore = clamp(
    Math.floor((networkStrength * 0.5 + execution.focusScore * 0.35 + growth.adoptionScore * 0.15)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((networkStrength * 0.5 + ecosystemScore * 0.3 + control.healthScore * 0.2)),
    0,
    100
  )

  const connections: EcosystemConnection[] = Array.from({ length: partnerCount }, (_, i) => ({
    connectionId: `partner-${i + 1}`,
    partnerName: `Partner ${i + 1}`,
    strengthLevel: networkStrength - i * 5,
    synergy: 75 + i * 5,
  }))

  return {
    mission: slug,
    missionTitle: control.missionTitle,
    partnerCount,
    communityAssets,
    connectedSystems,
    networkStrength,
    ecosystemScore,
    healthScore,
    connections,
    recommendations: [
      "Strengthen partner relationships",
      "Expand ecosystem reach",
      "Optimize network connectivity",
    ],
    roadmap: buildEcosystemRoadmap(slug),
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

export async function getEcosystemRegistry() {
  const missions = await getResearchMissions()
  const workspaces = await Promise.all(missions.map((m) => getMissionEcosystem(m.slug)))
  const validWorkspaces = workspaces.filter(Boolean) as MissionEcosystemWorkspace[]

  const partnerCount = validWorkspaces.reduce((sum, w) => sum + w.partnerCount, 0)
  const communityAssets = validWorkspaces.reduce((sum, w) => sum + w.communityAssets, 0)
  const connectedSystems = validWorkspaces.reduce((sum, w) => sum + w.connectedSystems, 0)
  const networkStrength = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.networkStrength, 0) / validWorkspaces.length),
    0,
    100
  )
  const ecosystemScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.ecosystemScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const healthScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.healthScore, 0) / validWorkspaces.length),
    0,
    100
  )

  return {
    partnerCount,
    communityAssets,
    connectedSystems,
    networkStrength,
    ecosystemScore,
    healthScore,
    missions: validWorkspaces,
  }
}
