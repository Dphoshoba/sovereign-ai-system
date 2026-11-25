import { MissionGammaSovereignOSWorkspace } from "@/lib/gamma-sovereign-os/types"
import { getResearchMissions } from "./research-registry"
import { getSovereignCoreRegistry } from "./sovereign-core-reader"
import { getGammaNexusRegistry } from "./gamma-nexus-reader"
import { getIntelligenceCoreRegistry } from "./intelligence-core-reader"
import { getCEOCenterRegistry } from "./ceo-center-reader"
import { getMissionControlRegistry } from "./mission-control-reader"
import { getPortfolioFederationRegistry } from "./portfolio-federation-reader"
import { getCollectiveIntelligenceRegistry } from "./collective-intelligence-reader"
import { getEnterpriseGraphRegistry } from "./enterprise-graph-reader"
import { getSovereignGovernanceRegistry } from "./sovereign-governance-reader"
import { getLegacyRegistry } from "./legacy-reader"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionGammaSovereignOS(slug: string): Promise<MissionGammaSovereignOSWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((m) => m.slug === slug)
  if (!mission) return null

  const core = await getIntelligenceCoreRegistry()
  const sovereignScore = clamp(
    Math.floor((core.intelligenceScore * 0.7 + core.adaptabilityScore * 0.3)),
    0,
    100
  )
  const systemIntegrity = clamp(
    Math.floor((core.intelligenceScore * 0.8 + core.adaptabilityScore * 0.2)),
    0,
    100
  )
  const ecosystemStrength = clamp(
    Math.floor((core.knowledgeCapital * 0.4 + core.intelligenceScore * 0.4 + core.adaptabilityScore * 0.2)),
    0,
    100
  )
  const autonomyScore = clamp(
    Math.floor((sovereignScore * 0.5 + systemIntegrity * 0.5)),
    0,
    100
  )

  return {
    mission: slug,
    missionTitle: mission.title,
    sovereignScore,
    systemIntegrity,
    ecosystemStrength,
    autonomyScore,
    healthScore: sovereignScore,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  }
}

export async function getGammaSovereignOSRegistry(): Promise<{
  sovereignScore: number
  systemIntegrity: number
  ecosystemStrength: number
  autonomyScore: number
  healthScore: number
  missions: MissionGammaSovereignOSWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionGammaSovereignOSWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionGammaSovereignOS(mission.slug)
    if (workspace) results.push(workspace)
  }

  const sovereignCore = await getSovereignCoreRegistry()
  const gammaNexus = await getGammaNexusRegistry()
  const intelligenceCore = await getIntelligenceCoreRegistry()
  const ceoCenter = await getCEOCenterRegistry()
  const missionControl = await getMissionControlRegistry()
  const portfolioFederation = await getPortfolioFederationRegistry()
  const collectiveIntelligence = await getCollectiveIntelligenceRegistry()
  const enterpriseGraph = await getEnterpriseGraphRegistry()
  const sovereignGovernance = await getSovereignGovernanceRegistry()
  const legacy = await getLegacyRegistry()

  const avgSovereignScore = Math.floor(
    results.reduce((sum, r) => sum + r.sovereignScore, 0) / results.length
  )
  const avgSystemIntegrity = Math.floor(
    results.reduce((sum, r) => sum + r.systemIntegrity, 0) / results.length
  )
  const avgAutonomyScore = Math.floor(
    results.reduce((sum, r) => sum + r.autonomyScore, 0) / results.length
  )

  const aggregatedEcosystemStrength = clamp(
    Math.floor(
      (sovereignCore.ecosystemStrength * 0.12 +
        gammaNexus.ecosystemStrength * 0.12 +
        intelligenceCore.intelligenceScore * 0.12 +
        ceoCenter.executiveScore * 0.12 +
        missionControl.missionScore * 0.12 +
        portfolioFederation.portfolioScore * 0.12 +
        collectiveIntelligence.collectiveScore * 0.12 +
        enterpriseGraph.graphHealth * 0.12 +
        sovereignGovernance.governanceScore * 0.01 +
        legacy.legacyScore * 0.01) /
        1
    ),
    0,
    100
  )

  return {
    sovereignScore: avgSovereignScore,
    systemIntegrity: avgSystemIntegrity,
    ecosystemStrength: aggregatedEcosystemStrength,
    autonomyScore: avgAutonomyScore,
    healthScore: avgSovereignScore,
    missions: results,
  }
}
