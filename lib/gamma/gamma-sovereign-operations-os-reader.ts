import { MissionGammaSovereignOperationsOSWorkspace } from "@/lib/gamma-sovereign-operations-os/types"
import { getResearchMissions } from "./research-registry"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"
import { getSovereignCoreRegistry } from "./sovereign-core-reader"
import { getGammaNexusRegistry } from "./gamma-nexus-reader"
import { getCEOCenterRegistry } from "./ceo-center-reader"
import { getMissionControlRegistry } from "./mission-control-reader"
import { getSovereignRiskRegistry } from "./sovereign-risk-reader"
import { getStrategicTimingRegistry } from "./strategic-timing-reader"
import { getFounderCommandCenterRegistry } from "./founder-command-center-reader"
import { getLegacyDeploymentRegistry } from "./legacy-deployment-reader"
import { getSovereignReviewBoardRegistry } from "./sovereign-review-board-reader"
import { getKingdomImpactOperationsRegistry } from "./kingdom-impact-operations-reader"
import { getEnterpriseContinuityOperationsRegistry } from "./enterprise-continuity-operations-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionGammaSovereignOperationsOS(
  slug: string
): Promise<MissionGammaSovereignOperationsOSWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const operationsScore = clamp(
    Math.floor((core.intelligenceScore * 0.5 + core.adaptabilityScore * 0.5)),
    0,
    100
  )
  const systemIntegrity = clamp(
    Math.floor((core.knowledgeCapital * 0.6 + core.intelligenceScore * 0.4)),
    0,
    100
  )
  const operationalExcellence = clamp(
    Math.floor((core.adaptabilityScore * 0.7 + core.learningVelocity * 0.3)),
    0,
    100
  )
  const commandChain = clamp(
    Math.floor((core.intelligenceScore * 0.6 + core.knowledgeCapital * 0.4)),
    0,
    100
  )
  const executionCapacity = clamp(
    Math.floor((core.learningVelocity * 0.5 + core.adaptabilityScore * 0.5)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    operationsScore,
    systemIntegrity,
    operationalExcellence,
    commandChain,
    executionCapacity,
    healthScore: operationsScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getGammaSovereignOperationsOSRegistry(): Promise<{
  operationsScore: number
  systemIntegrity: number
  operationalExcellence: number
  commandChain: number
  executionCapacity: number
  healthScore: number
  missions: MissionGammaSovereignOperationsOSWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionGammaSovereignOperationsOSWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionGammaSovereignOperationsOS(mission.slug)
    if (workspace) results.push(workspace)
  }

  // Aggregate core systems (11 Phase XI systems + Phase X core)
  const sovereignCore = await getSovereignCoreRegistry()
  const gammaNexus = await getGammaNexusRegistry()
  const ceoCenter = await getCEOCenterRegistry()
  const missionControl = await getMissionControlRegistry()
  const sovereignRisk = await getSovereignRiskRegistry()
  const strategicTiming = await getStrategicTimingRegistry()
  const founderCommandCenter = await getFounderCommandCenterRegistry()
  const legacyDeployment = await getLegacyDeploymentRegistry()
  const sovereignReviewBoard = await getSovereignReviewBoardRegistry()
  const kingdomImpactOps = await getKingdomImpactOperationsRegistry()
  const enterpriseContinuityOps = await getEnterpriseContinuityOperationsRegistry()

  const avgOperationsScore = Math.floor(results.reduce((sum, r) => sum + r.operationsScore, 0) / results.length)
  const avgSystemIntegrity = Math.floor(results.reduce((sum, r) => sum + r.systemIntegrity, 0) / results.length)
  const avgOperationalExcellence = Math.floor(
    results.reduce((sum, r) => sum + r.operationalExcellence, 0) / results.length
  )
  const avgCommandChain = Math.floor(results.reduce((sum, r) => sum + r.commandChain, 0) / results.length)
  const avgExecutionCapacity = Math.floor(
    results.reduce((sum, r) => sum + r.executionCapacity, 0) / results.length
  )

  const aggregatedSystemIntegrity = clamp(
    Math.floor(
      (sovereignCore.healthScore * 0.1 +
        gammaNexus.healthScore * 0.1 +
        ceoCenter.healthScore * 0.1 +
        missionControl.healthScore * 0.1 +
        sovereignRisk.healthScore * 0.09 +
        strategicTiming.healthScore * 0.09 +
        founderCommandCenter.healthScore * 0.09 +
        legacyDeployment.healthScore * 0.09 +
        sovereignReviewBoard.healthScore * 0.08 +
        kingdomImpactOps.healthScore * 0.08 +
        enterpriseContinuityOps.healthScore * 0.07) /
        1
    ),
    0,
    100
  )

  return {
    operationsScore: avgOperationsScore,
    systemIntegrity: aggregatedSystemIntegrity,
    operationalExcellence: avgOperationalExcellence,
    commandChain: avgCommandChain,
    executionCapacity: avgExecutionCapacity,
    healthScore: avgOperationsScore,
    missions: results,
  }
}
