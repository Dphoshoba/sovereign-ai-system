import { getMissionCapital } from "./capital-reader"
import { getMissionMaturity } from "./maturity-reader"
import { getExecutionRegistry } from "./execution-reader"
import { getResearchMissions } from "./research-registry"
import { buildResourceRoadmap } from "../resource-allocation/mock-data"
import type { MissionResourceAllocationWorkspace, ResourceAllocation } from "../resource-allocation/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export async function getMissionResourceAllocation(slug: string): Promise<MissionResourceAllocationWorkspace | null> {
  const capital = await getMissionCapital(slug)
  const maturity = await getMissionMaturity(slug)
  const execution = await getExecutionRegistry()

  if (!capital || !maturity || !execution) {
    return null
  }

  const resourceCount = capital.assets.length || 8
  const allocationEfficiency = clamp(
    Math.floor((maturity.healthScore * 0.45 + execution.executionCapacity * 0.35 + capital.assetValue * 0.2)),
    0,
    100
  )

  const utilizationScore = clamp(
    Math.floor((execution.executionVelocity * 0.5 + maturity.reuseScore * 0.35 + capital.knowledgeCapital * 0.15)),
    0,
    100
  )

  const capacityScore = clamp(
    Math.floor((execution.executionCapacity * 0.5 + maturity.scalabilityScore * 0.35 + capital.healthScore * 0.15)),
    0,
    100
  )

  const optimizationScore = clamp(
    Math.floor((allocationEfficiency + utilizationScore + capacityScore) / 3),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((allocationEfficiency * 0.35 + utilizationScore * 0.35 + capacityScore * 0.3)),
    0,
    100
  )

  const resources: ResourceAllocation[] = Array.from({ length: resourceCount }, (_, i) => ({
    resourceId: `resource-${i + 1}`,
    resourceType: i % 3 === 0 ? "knowledge" : i % 3 === 1 ? "capital" : "capacity",
    allocated: Math.floor(100 - i * 5),
    utilized: Math.floor(utilizationScore - i * 3),
    efficiency: Math.floor((utilizationScore + allocationEfficiency) / 2 - i * 2),
  }))

  const recommendations = unique([
    ...capital.recommendations.slice(0, 2),
    utilizationScore > 80 ? "Resources well-utilized" : "Optimize resource allocation",
    capacityScore > 75 ? "Strong capacity base" : "Expand resource capacity",
  ]).slice(0, 9)

  return {
    mission: slug,
    missionTitle: maturity.missionTitle,
    resourceCount,
    allocationEfficiency,
    utilizationScore,
    capacityScore,
    optimizationScore,
    healthScore,
    resources,
    recommendations,
    roadmap: buildResourceRoadmap(slug),
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

export async function getResourceAllocationRegistry() {
  const missions = await getResearchMissions()
  const workspaces = await Promise.all(missions.map((m) => getMissionResourceAllocation(m.slug)))
  const validWorkspaces = workspaces.filter(Boolean) as MissionResourceAllocationWorkspace[]

  const resourceCount = validWorkspaces.reduce((sum, w) => sum + w.resourceCount, 0)
  const allocationEfficiency = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.allocationEfficiency, 0) / validWorkspaces.length),
    0,
    100
  )
  const utilizationScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.utilizationScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const capacityScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.capacityScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const optimizationScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.optimizationScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const healthScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.healthScore, 0) / validWorkspaces.length),
    0,
    100
  )

  return {
    resourceCount,
    allocationEfficiency,
    utilizationScore,
    capacityScore,
    optimizationScore,
    healthScore,
    missions: validWorkspaces,
  }
}
