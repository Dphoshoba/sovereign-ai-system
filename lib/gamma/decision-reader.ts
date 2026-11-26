import { getMissionAdvisor } from "./advisor-reader"
import { getMissionMaturity } from "./maturity-reader"
import { getPrioritizationRegistry } from "./prioritization-reader"
import { getResearchMissions } from "./research-registry"
import { buildDecisionRoadmap } from "../decision-engine/mock-data"
import type { MissionDecisionWorkspace, Decision } from "../decision-engine/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export async function getMissionDecision(slug: string): Promise<MissionDecisionWorkspace | null> {
  const advisor = await getMissionAdvisor(slug)
  const maturity = await getMissionMaturity(slug)
  const prioritization = await getPrioritizationRegistry()

  if (!advisor || !maturity || !prioritization) {
    return null
  }

  const decisionCount = 5
  const decisionQuality = clamp(
    Math.floor((advisor.impactScore * 0.4 + maturity.confidenceScore * 0.35 + prioritization.alignmentScore * 0.25)),
    0,
    100
  )

  const confidenceScore = clamp(
    Math.floor((maturity.confidenceScore * 0.5 + advisor.momentumScore * 0.35 + prioritization.focusScore * 0.15)),
    0,
    100
  )

  const riskScore = clamp(Math.max(0, 100 - advisor.healthScore), 0, 100)
  const strategicScore = clamp(
    Math.floor((prioritization.alignmentScore * 0.6 + prioritization.focusScore * 0.4)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((decisionQuality * 0.35 + confidenceScore * 0.35 + strategicScore * 0.3)),
    0,
    100
  )

  const decisions: Decision[] = Array.from({ length: decisionCount }, (_, i) => ({
    decisionId: `decision-${i + 1}`,
    title: `Strategic Decision ${i + 1}`,
    quality: decisionQuality - i * 5,
    confidence: confidenceScore - i * 3,
    impact: i < 2 ? "high" : i < 4 ? "medium" : "low",
  }))

  const recommendations = unique([
    ...advisor.creatorSuggestions.slice(0, 2),
    decisionQuality > 80 ? "Decision quality strong" : "Improve decision frameworks",
    confidenceScore > 75 ? "High confidence decisions" : "Build confidence in decisions",
  ]).slice(0, 9)

  return {
    mission: slug,
    missionTitle: advisor.missionTitle,
    decisionCount,
    decisionQuality,
    confidenceScore,
    riskScore,
    strategicScore,
    healthScore,
    decisions,
    recommendations,
    roadmap: buildDecisionRoadmap(slug),
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

export async function getDecisionRegistry() {
  const missions = await getResearchMissions()
  const workspaces = await Promise.all(missions.map((m) => getMissionDecision(m.slug)))
  const validWorkspaces = workspaces.filter(Boolean) as MissionDecisionWorkspace[]

  const decisionCount = validWorkspaces.reduce((sum, w) => sum + w.decisionCount, 0)
  const decisionQuality = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.decisionQuality, 0) / validWorkspaces.length),
    0,
    100
  )
  const confidenceScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.confidenceScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const riskScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.riskScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const strategicScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.strategicScore, 0) / validWorkspaces.length),
    0,
    100
  )
  const healthScore = clamp(
    Math.floor(validWorkspaces.reduce((sum, w) => sum + w.healthScore, 0) / validWorkspaces.length),
    0,
    100
  )

  return {
    decisionCount,
    decisionQuality,
    confidenceScore,
    riskScore,
    strategicScore,
    healthScore,
    missions: validWorkspaces,
  }
}
