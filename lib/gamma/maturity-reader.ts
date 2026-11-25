import { getAgencyWorkspace } from "./agency-reader"
import { getCreatorWorkspace } from "./creator-output-reader"
import { getExecutiveWorkspace } from "./executive-reader"
import { getMissionInference } from "./inference-reader"
import { getKnowledgeIntelligenceWorkspace } from "./knowledge-intelligence-reader"
import { getMinistryWorkspace } from "./ministry-reader"
import { getMission, getResearchMissions } from "./research-registry"
import { getMissionRecommendations } from "./recommendation-reader"
import { getMissionQueryWorkspace } from "./query-reader"
import { getSecondBrainWorkspace } from "./second-brain-reader"
import { getSharedKnowledgeWorkspace } from "./shared-knowledge-reader"
import { buildReadinessTimeline, classifyMissionMaturity } from "../maturity/mock-data"
import type { MaturityAssetHighlight, MaturityWorkspaceScore, MissionMaturityWorkspace } from "../maturity/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function statusFromScore(score: number): "strong" | "watch" | "weak" {
  if (score < 50) {
    return "weak"
  }
  if (score < 65) {
    return "watch"
  }
  return "strong"
}

function topAsset(title: string, workspace: string, score: number, rationale: string): MaturityAssetHighlight {
  return { title, workspace, score, rationale }
}

export async function getMissionMaturity(slug: string): Promise<MissionMaturityWorkspace | null> {
  const research = await getMission(slug)
  const creator = await getCreatorWorkspace(slug)
  const ministry = await getMinistryWorkspace(slug)
  const executive = await getExecutiveWorkspace(slug)
  const agency = await getAgencyWorkspace(slug)
  const shared = await getSharedKnowledgeWorkspace(slug)
  const secondBrain = await getSecondBrainWorkspace(slug)
  const intelligence = await getKnowledgeIntelligenceWorkspace(slug)
  const inference = await getMissionInference(slug)
  const query = await getMissionQueryWorkspace(slug)
  const recommendations = await getMissionRecommendations(slug)

  if (!research || !creator || !ministry || !executive || !agency || !shared || !secondBrain || !intelligence || !inference || !query || !recommendations) {
    return null
  }

  const researchScore = research.overallProgress
  const creatorScore = creator.progress
  const ministryScore = ministry.progress
  const executiveScore = executive.readinessScore
  const agencyScore = agency.progress
  const knowledgeScore = shared.knowledgeHealthScore
  const secondBrainScore = secondBrain.brainScore

  const coverageScore = clamp(
    Math.floor((query.coverageScore * 0.4 + recommendations.coveragePercent * 0.25 + intelligence.overallScore * 0.2 + inference.coverageScore * 0.15)),
    0,
    100
  )

  const readinessScore = clamp(
    Math.floor((recommendations.readinessScore * 0.45 + executiveScore * 0.25 + agencyScore * 0.15 + secondBrain.healthScore * 0.15)),
    0,
    100
  )

  const reuseScore = clamp(
    Math.floor((knowledgeScore * 0.35 + secondBrainScore * 0.3 + intelligence.knowledgeHealthScore * 0.2 + Math.min(15, shared.crossReferenceCount * 2))),
    0,
    100
  )

  const scalabilityScore = clamp(
    Math.floor((agencyScore * 0.35 + readinessScore * 0.25 + secondBrainScore * 0.15 + knowledgeScore * 0.15 + creatorScore * 0.1)),
    0,
    100
  )

  const commercialScore = clamp(
    Math.floor((agencyScore * 0.4 + executiveScore * 0.2 + creatorScore * 0.15 + readinessScore * 0.15 + knowledgeScore * 0.1)),
    0,
    100
  )

  const teachingScore = clamp(
    Math.floor((ministryScore * 0.45 + researchScore * 0.2 + creatorScore * 0.1 + knowledgeScore * 0.15 + reuseScore * 0.1)),
    0,
    100
  )

  const confidenceScore = clamp(
    Math.floor((query.confidenceScore * 0.45 + intelligence.intelligenceScore * 0.35 + secondBrain.healthScore * 0.2)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((coverageScore * 0.22 + readinessScore * 0.2 + reuseScore * 0.18 + scalabilityScore * 0.15 + commercialScore * 0.1 + teachingScore * 0.15)),
    0,
    100
  )

  const workspaceRankings: MaturityWorkspaceScore[] = [
    { workspace: "research", score: researchScore, status: statusFromScore(researchScore) },
    { workspace: "creator", score: creatorScore, status: statusFromScore(creatorScore) },
    { workspace: "ministry", score: ministryScore, status: statusFromScore(ministryScore) },
    { workspace: "executive", score: executiveScore, status: statusFromScore(executiveScore) },
    { workspace: "agency", score: agencyScore, status: statusFromScore(agencyScore) },
    { workspace: "shared-knowledge", score: knowledgeScore, status: statusFromScore(knowledgeScore) },
    { workspace: "second-brain", score: secondBrainScore, status: statusFromScore(secondBrainScore) },
  ].sort((a, b) => b.score - a.score)

  const strongestWorkspace = workspaceRankings[0]
  const weakestWorkspace = workspaceRankings[workspaceRankings.length - 1]
  const weakestAreas = workspaceRankings.filter((item) => item.status !== "strong").map((item) => item.workspace)

  const highestPerformingAssets: MaturityAssetHighlight[] = [
    topAsset(shared.frameworks[0] ?? "Shared framework backlog", "shared-knowledge", knowledgeScore, "High reuse value across missions and outputs."),
    topAsset(ministry.sermonSeries[0] ?? "Teaching series backlog", "ministry", teachingScore, "Teaching layer is one of the clearest transfer channels."),
    topAsset(creator.bookOutlines[0] ?? creator.articleIdeas[0] ?? "Creator flagship asset", "creator", creatorScore, "Creator workspace holds the best outward-facing packaging."),
    topAsset(agency.servicePackages[0] ?? agency.offerTemplates[0] ?? "Agency package", "agency", commercialScore, "Agency layer indicates commercialization headroom."),
  ]

  const reusePotential = unique([
    ...shared.frameworks.slice(0, 3),
    ...shared.templates.slice(0, 3),
    ...creator.courseOutlines.slice(0, 2),
  ]).slice(0, 8)

  const commercialPotential = unique([
    ...agency.servicePackages.slice(0, 3),
    ...agency.offerTemplates.slice(0, 2),
    ...recommendations.recommendations.slice(0, 3).map((item) => item.title),
  ]).slice(0, 8)

  const teachingPotential = unique([
    ...ministry.sermonSeries.slice(0, 3),
    ...ministry.teachingCourses.slice(0, 2),
    ...ministry.bibleStudies.slice(0, 2),
  ]).slice(0, 8)

  const workspaceAverage = Math.floor(
    (researchScore + creatorScore + ministryScore + executiveScore + agencyScore + knowledgeScore + secondBrainScore) / 7
  )

  const missionScore = clamp(
    Math.floor((workspaceAverage * 0.5 + coverageScore * 0.15 + readinessScore * 0.15 + reuseScore * 0.1 + teachingScore * 0.05 + commercialScore * 0.05)),
    0,
    100
  )

  const productionReadyPercentage = clamp(Math.floor((missionScore * 0.45 + readinessScore * 0.35 + healthScore * 0.2)), 0, 100)
  const classification = classifyMissionMaturity(missionScore, healthScore, readinessScore)

  const missionEvolution = [
    `Coverage is ${coverageScore}% across mission reasoning surfaces.`,
    `Readiness is ${readinessScore}% with executive score ${executiveScore} and agency score ${agencyScore}.`,
    `Reuse is ${reuseScore}% with second brain score ${secondBrainScore}.`,
    `Teaching suitability is ${teachingScore}% and commercial suitability is ${commercialScore}%.`,
  ]

  return {
    mission: slug,
    missionTitle: intelligence.missionTitle,
    missionScore,
    researchScore,
    creatorScore,
    ministryScore,
    executiveScore,
    agencyScore,
    knowledgeScore,
    secondBrainScore,
    coverageScore,
    readinessScore,
    reuseScore,
    scalabilityScore,
    commercialScore,
    teachingScore,
    confidenceScore,
    healthScore,
    productionReadyPercentage,
    classification,
    strongestWorkspace,
    weakestWorkspace,
    workspaceRankings,
    weakestAreas,
    highestPerformingAssets,
    reusePotential,
    commercialPotential,
    teachingPotential,
    readinessTimeline: buildReadinessTimeline(slug),
    missionEvolution,
    scalingReady: scalabilityScore >= 70,
    teachingReady: teachingScore >= 70,
    commercializationReady: commercialScore >= 70,
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

export async function getMaturityRegistry(): Promise<{
  missionCount: number
  missionScore: number
  coverageScore: number
  readinessScore: number
  reuseScore: number
  healthScore: number
  productionReadyPercentage: number
  strongestWorkspace: string
  weakestWorkspace: string
  missions: MissionMaturityWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionMaturityWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionMaturity(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const missionScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.missionScore, 0) / missionCount) : 0
  const coverageScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.coverageScore, 0) / missionCount) : 0
  const readinessScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.readinessScore, 0) / missionCount) : 0
  const reuseScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.reuseScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0
  const productionReadyPercentage = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.productionReadyPercentage, 0) / missionCount) : 0

  const strongestWorkspace = results[0]?.strongestWorkspace.workspace ?? "none"
  const weakestWorkspace = results[0]?.weakestWorkspace.workspace ?? "none"

  return {
    missionCount,
    missionScore,
    coverageScore,
    readinessScore,
    reuseScore,
    healthScore,
    productionReadyPercentage,
    strongestWorkspace,
    weakestWorkspace,
    missions: results,
  }
}