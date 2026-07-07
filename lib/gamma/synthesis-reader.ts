import { getCapitalRegistry } from "./capital-reader"
import { getExecutionRegistry } from "./execution-reader"
import { getGrowthRegistry } from "./growth-reader"
import { getResearchMissions } from "./research-registry"
import { buildSynthesisRoadmap } from "../synthesis/mock-data"
import type { MissionSynthesisWorkspace, SynthesisLink } from "../synthesis/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionSynthesis(slug: string): Promise<MissionSynthesisWorkspace | null> {
  const capital = await getCapitalRegistry()
  const execution = await getExecutionRegistry()
  const growth = await getGrowthRegistry()

  if (!capital || !execution || !growth) {
    return null
  }

  const crossDomainLinks = 6
  const synthesisCount = 4
  const knowledgeDensity = clamp(Math.floor((capital.knowledgeCapital * 0.5 + execution.focusScore * 0.3 + growth.growthVelocity * 0.2)), 0, 100)
  const integrationScore = clamp(Math.floor((execution.focusScore * 0.4 + capital.reuseScore * 0.6)), 0, 100)
  const reuseScore = clamp(capital.reuseScore, 0, 100)
  const healthScore = clamp(Math.floor((knowledgeDensity * 0.3 + integrationScore * 0.35 + reuseScore * 0.35)), 0, 100)

  const links: SynthesisLink[] = Array.from({ length: crossDomainLinks }, (_, i) => ({
    linkId: `link-${i + 1}`,
    linkName: `Domain Link ${i + 1}`,
    integrationScore: integrationScore - i * 3,
    reuseScore: reuseScore - i * 2,
    knowledgeDensity: knowledgeDensity - i * 4,
  }))

  return {
    mission: slug,
    missionTitle: "Research Mission 001",
    crossDomainLinks,
    synthesisCount,
    knowledgeDensity,
    integrationScore,
    reuseScore,
    healthScore,
    links,
    recommendations: ["Connect domains", "Increase reuse", "Build knowledge density"],
    roadmap: buildSynthesisRoadmap(slug),
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

export async function getSynthesisRegistry(): Promise<{
  crossDomainLinks: number
  synthesisCount: number
  knowledgeDensity: number
  integrationScore: number
  reuseScore: number
  healthScore: number
  missions: MissionSynthesisWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionSynthesisWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionSynthesis(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const crossDomainLinks = missionCount > 0 ? 6 : 0
  const synthesisCount = missionCount > 0 ? 4 : 0
  const knowledgeDensity = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.knowledgeDensity, 0) / missionCount) : 0
  const integrationScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.integrationScore, 0) / missionCount) : 0
  const reuseScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.reuseScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    crossDomainLinks,
    synthesisCount,
    knowledgeDensity,
    integrationScore,
    reuseScore,
    healthScore,
    missions: results,
  }
}
