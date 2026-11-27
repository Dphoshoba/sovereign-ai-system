import { getMissionControl } from "./mission-control-reader"
import { getMissionPortfolio } from "./portfolio-reader"
import { getMissionReview } from "./review-reader"
import { getResearchMissions } from "./research-registry"
import { buildGovernanceRoadmap } from "../governance/mock-data"
import type { MissionGovernanceWorkspace } from "../governance/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function statusFromScore(score: number): "pass" | "watch" | "risk" {
  if (score < 50) {
    return "risk"
  }
  if (score < 70) {
    return "watch"
  }
  return "pass"
}

export async function getMissionGovernance(slug: string): Promise<MissionGovernanceWorkspace | null> {
  const control = await getMissionControl(slug)
  const portfolio = await getMissionPortfolio(slug)
  const review = await getMissionReview(slug)

  if (!control || !portfolio || !review) {
    return null
  }

  const determinismScore = clamp(
    Math.floor((portfolio.readinessScore * 0.35 + control.readinessScore * 0.35 + (100 - review.regressionScore) * 0.3)),
    0,
    100
  )

  const hydrationScore = clamp(
    Math.floor((control.healthScore * 0.45 + portfolio.portfolioHealth * 0.35 + (100 - review.overdueCount * 10) * 0.2)),
    0,
    100
  )

  const ssrScore = clamp(
    Math.floor((portfolio.workspaceCoverage * 0.4 + control.executionScore * 0.35 + review.reviewScore * 0.25)),
    0,
    100
  )

  const securityScore = clamp(
    Math.floor((control.alignmentScore * 0.25 + control.healthScore * 0.35 + portfolio.portfolioHealth * 0.4)),
    0,
    100
  )

  const governanceScore = clamp(
    Math.floor((determinismScore * 0.25 + hydrationScore * 0.2 + ssrScore * 0.25 + securityScore * 0.3)),
    0,
    100
  )

  const freezeReadiness = clamp(
    Math.floor((governanceScore * 0.5 + control.readinessScore * 0.3 + portfolio.readinessScore * 0.2)),
    0,
    100
  )

  const checks = [
    {
      title: "Deterministic data path",
      score: determinismScore,
      status: statusFromScore(determinismScore),
      note: "All mission dashboards use deterministic read-only reader contracts.",
    },
    {
      title: "Hydration safety",
      score: hydrationScore,
      status: statusFromScore(hydrationScore),
      note: "SSR render surfaces avoid client-only state and browser runtime branches.",
    },
    {
      title: "SSR route stability",
      score: ssrScore,
      status: statusFromScore(ssrScore),
      note: "Route rendering paths are aligned for stable build and runtime output.",
    },
    {
      title: "Security baseline",
      score: securityScore,
      status: statusFromScore(securityScore),
      note: "No auth/mutation/publishing path introduced by governance engine.",
    },
  ]

  const recommendations = unique([
    ...control.recommendations.slice(0, 4),
    ...portfolio.recommendations.slice(0, 4),
    ...review.nextWeekActions.slice(0, 2),
  ]).slice(0, 10)

  return {
    mission: slug,
    missionTitle: control.missionTitle,
    determinismScore,
    hydrationScore,
    ssrScore,
    securityScore,
    governanceScore,
    freezeReadiness,
    checks,
    recommendations,
    roadmap: buildGovernanceRoadmap(slug),
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

export async function getGovernanceRegistry(): Promise<{
  missionCount: number
  determinismScore: number
  hydrationScore: number
  ssrScore: number
  securityScore: number
  governanceScore: number
  freezeReadiness: number
  missions: MissionGovernanceWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionGovernanceWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionGovernance(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const determinismScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.determinismScore, 0) / missionCount) : 0
  const hydrationScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.hydrationScore, 0) / missionCount) : 0
  const ssrScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.ssrScore, 0) / missionCount) : 0
  const securityScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.securityScore, 0) / missionCount) : 0
  const governanceScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.governanceScore, 0) / missionCount) : 0
  const freezeReadiness = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.freezeReadiness, 0) / missionCount) : 0

  return {
    missionCount,
    determinismScore,
    hydrationScore,
    ssrScore,
    securityScore,
    governanceScore,
    freezeReadiness,
    missions: results,
  }
}
