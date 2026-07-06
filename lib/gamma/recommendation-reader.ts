import { getAgencyWorkspace } from "./agency-reader"
import { getCreatorWorkspace } from "./creator-output-reader"
import { getExecutiveWorkspace } from "./executive-reader"
import { getMission, getResearchMissions } from "./research-registry"
import { getKnowledgeIntelligenceWorkspace } from "./knowledge-intelligence-reader"
import { getMinistryWorkspace } from "./ministry-reader"
import { getMissionMetadataCoverage } from "./metadata-reader"
import { getMissionRelationships } from "./relationship-reader"
import { getSecondBrainWorkspace } from "./second-brain-reader"
import { getSharedKnowledgeWorkspace } from "./shared-knowledge-reader"

export type GammaRecommendation = {
  id: string
  title: string
  rationale: string
  priority: "high" | "medium" | "low"
  actionType: "build" | "expand" | "connect" | "stabilize"
}

export type MissionRecommendationWorkspace = {
  mission: string
  missionTitle: string
  researchAssets: number
  creatorAssets: number
  ministryAssets: number
  executiveAssets: number
  agencyAssets: number
  knowledgeAssets: number
  questions: number
  discoveries: number
  recommendationCount: number
  readinessScore: number
  healthScore: number
  coveragePercent: number
  actionCount: number
  priorityCount: number
  confidence: string
  recommendations: GammaRecommendation[]
  readOnly: true
  previewOnly: true
  noAuth: true
  noSessions: true
  noJwt: true
  noDatabase: true
  noExecution: true
  noPublishing: true
  noOpenAI: true
  noGraphWrites: true
  noSocialPosting: true
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function priorityFromIndex(index: number): "high" | "medium" | "low" {
  if (index < 2) {
    return "high"
  }
  if (index < 4) {
    return "medium"
  }
  return "low"
}

export async function getMissionRecommendations(slug: string): Promise<MissionRecommendationWorkspace | null> {
  const research = await getMission(slug)
  const creator = await getCreatorWorkspace(slug)
  const ministry = await getMinistryWorkspace(slug)
  const executive = await getExecutiveWorkspace(slug)
  const agency = await getAgencyWorkspace(slug)
  const shared = await getSharedKnowledgeWorkspace(slug)
  const secondBrain = await getSecondBrainWorkspace(slug)
  const intelligence = await getKnowledgeIntelligenceWorkspace(slug)
  const relationships = await getMissionRelationships(slug)

  if (!research || !creator || !ministry || !executive || !agency || !shared || !secondBrain || !intelligence || !relationships) {
    return null
  }

  const metadata = getMissionMetadataCoverage(slug)

  const researchAssets = research.discoveryCount
  const creatorAssets = creator.creatorProjects.length
  const ministryAssets = ministry.teachingCount
  const executiveAssets = executive.priorityCount + executive.decisionCount
  const agencyAssets = agency.proposalCount + agency.packageCount + agency.offerCount
  const knowledgeAssets = shared.assetCount

  const coveragePercent = clamp(
    Math.floor(
      (relationships.coverageScore * 0.35 +
        metadata.metadataCoverage * 0.2 +
        intelligence.overallScore * 0.25 +
        secondBrain.healthScore * 0.2)
    ),
    0,
    100
  )

  const readinessScore = clamp(
    Math.floor((executive.readinessScore * 0.4 + intelligence.intelligenceScore * 0.3 + secondBrain.brainScore * 0.3)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((shared.knowledgeHealthScore * 0.45 + metadata.metadataCoverage * 0.35 + relationships.coverageScore * 0.2)),
    0,
    100
  )

  const recommendationSeeds = [
    {
      title: "Build taxonomy.md",
      rationale: "Shared knowledge taxonomy is present but needs dense mission-level terms for better cross-reference resolution.",
      actionType: "build" as const,
    },
    {
      title: "Create motherhood article",
      rationale: "Search and relationship layers show repeated motherhood references that should be promoted into a flagship creator asset.",
      actionType: "expand" as const,
    },
    {
      title: "Expand hormone framework",
      rationale: "Research hormone discoveries map to unanswered questions and should be distilled into reusable framework assets.",
      actionType: "connect" as const,
    },
    {
      title: "Create women in civilization workshop",
      rationale: "Agency workshop packaging can reuse ministry and research assets to increase delivery readiness.",
      actionType: "build" as const,
    },
    {
      title: "Link executive priorities to discoveries",
      rationale: "Relationship coverage improves when each executive priority cites specific discovery records.",
      actionType: "connect" as const,
    },
    {
      title: "Stabilize metadata fields across assets",
      rationale: "Metadata coverage directly affects cross-reference quality and deterministic search confidence.",
      actionType: "stabilize" as const,
    },
  ]

  const recommendations: GammaRecommendation[] = recommendationSeeds.map((seed, index) => ({
    id: `${slug}-recommendation-${index + 1}`,
    title: seed.title,
    rationale: seed.rationale,
    priority: priorityFromIndex(index),
    actionType: seed.actionType,
  }))

  return {
    mission: slug,
    missionTitle: intelligence.missionTitle,
    researchAssets,
    creatorAssets,
    ministryAssets,
    executiveAssets,
    agencyAssets,
    knowledgeAssets,
    questions: research.questionCount,
    discoveries: research.discoveryCount,
    recommendationCount: recommendations.length,
    readinessScore,
    healthScore,
    coveragePercent,
    actionCount: secondBrain.actionCount,
    priorityCount: executive.priorityCount,
    confidence: intelligence.confidence,
    recommendations,
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

export async function getRecommendationRegistry(): Promise<{
  missionCount: number
  recommendationCount: number
  coveragePercent: number
  readinessScore: number
  healthScore: number
  missions: MissionRecommendationWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionRecommendationWorkspace[] = []

  for (const mission of missions) {
    const recommendation = await getMissionRecommendations(mission.slug)
    if (recommendation) {
      results.push(recommendation)
    }
  }

  const missionCount = results.length
  const recommendationCount = results.reduce((sum, item) => sum + item.recommendationCount, 0)
  const coveragePercent = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.coveragePercent, 0) / missionCount) : 0
  const readinessScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.readinessScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    missionCount,
    recommendationCount,
    coveragePercent,
    readinessScore,
    healthScore,
    missions: results,
  }
}
