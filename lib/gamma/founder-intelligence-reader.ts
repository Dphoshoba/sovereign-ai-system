import { getMissionAdvisor } from "./advisor-reader"
import { getMissionMaturity } from "./maturity-reader"
import { getExecutionRegistry } from "./execution-reader"
import { getPrioritizationRegistry } from "./prioritization-reader"
import { getResearchMissions } from "./research-registry"
import { buildFounderRoadmap } from "../founder-intelligence/mock-data"
import type { MissionFounderIntelligenceWorkspace, FounderFocus } from "../founder-intelligence/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export async function getMissionFounderIntelligence(slug: string): Promise<MissionFounderIntelligenceWorkspace | null> {
  const advisor = await getMissionAdvisor(slug)
  const maturity = await getMissionMaturity(slug)
  const execution = await getExecutionRegistry()
  const prioritization = await getPrioritizationRegistry()

  if (!advisor || !maturity || !execution || !prioritization) {
    return null
  }

  const focusScore = clamp(
    Math.floor((advisor.missionFocusScore * 0.5 + prioritization.focusScore * 0.35 + execution.focusScore * 0.15)),
    0,
    100
  )

  const clarityScore = clamp(
    Math.floor((prioritization.alignmentScore * 0.5 + advisor.momentumScore * 0.35 + maturity.confidenceScore * 0.15)),
    0,
    100
  )

  const executionScore = clamp(
    Math.floor((execution.deliveryScore * 0.5 + execution.executionVelocity * 0.35 + prioritization.focusScore * 0.15)),
    0,
    100
  )

  const knowledgeScore = clamp(
    Math.floor((maturity.knowledgeScore * 0.5 + advisor.impactScore * 0.35 + maturity.confidenceScore * 0.15)),
    0,
    100
  )

  const leadershipScore = clamp(
    Math.floor((advisor.missionFocusScore * 0.4 + execution.focusScore * 0.35 + prioritization.alignmentScore * 0.25)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((focusScore * 0.25 + clarityScore * 0.2 + executionScore * 0.2 + knowledgeScore * 0.15 + leadershipScore * 0.2)),
    0,
    100
  )

  const focuses: FounderFocus[] = [
    { area: "Strategic Focus", focusLevel: focusScore, progress: focusScore * 0.9 },
    { area: "Vision Clarity", focusLevel: clarityScore, progress: clarityScore * 0.85 },
    { area: "Execution Excellence", focusLevel: executionScore, progress: executionScore * 0.9 },
  ]

  const recommendations = unique([
    ...advisor.creatorSuggestions.slice(0, 2),
    focusScore > 80 ? "Founder focus strong: scale operations" : "Sharpen founder focus",
    leadershipScore > 75 ? "Leadership capability high" : "Develop leadership skills",
  ]).slice(0, 9)

  return {
    mission: slug,
    missionTitle: advisor.missionTitle,
    focusScore,
    clarityScore,
    executionScore,
    knowledgeScore,
    leadershipScore,
    healthScore,
    focuses,
    recommendations,
    roadmap: buildFounderRoadmap(slug),
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

export async function getFounderIntelligenceRegistry() {
  const missions = await getResearchMissions()
  const workspaces = await Promise.all(missions.map((m) => getMissionFounderIntelligence(m.slug)))
  const validWorkspaces = workspaces.filter(Boolean) as MissionFounderIntelligenceWorkspace[]

  const focusScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.focusScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const clarityScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.clarityScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const executionScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.executionScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const knowledgeScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.knowledgeScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const leadershipScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.leadershipScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const healthScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.healthScore, 0) / validWorkspaces.length),
    0,
    100
  )

  return {
    focusScore,
    clarityScore,
    executionScore,
    knowledgeScore,
    leadershipScore,
    healthScore,
    missions: validWorkspaces,
  }
}
