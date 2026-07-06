import { getMissionInference } from "./inference-reader"
import { getKnowledgeIntelligenceWorkspace } from "./knowledge-intelligence-reader"
import { getMissionQueryWorkspace } from "./query-reader"
import { getResearchMissions } from "./research-registry"
import { getMissionRelationships } from "./relationship-reader"
import { getMissionReview } from "./review-reader"
import { getSecondBrainWorkspace } from "./second-brain-reader"
import { buildInsightRoadmap } from "../insight-engine/mock-data"
import type { MissionInsightWorkspace } from "../insight-engine/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export async function getMissionInsights(slug: string): Promise<MissionInsightWorkspace | null> {
  const inference = await getMissionInference(slug)
  const query = await getMissionQueryWorkspace(slug)
  const intelligence = await getKnowledgeIntelligenceWorkspace(slug)
  const relationships = await getMissionRelationships(slug)
  const review = await getMissionReview(slug)
  const secondBrain = await getSecondBrainWorkspace(slug)

  if (!inference || !query || !intelligence || !relationships || !review || !secondBrain) {
    return null
  }

  const trends = [
    {
      title: "Knowledge reuse acceleration",
      score: clamp(Math.floor((query.knowledgeCompleteness * 0.55 + intelligence.overallScore * 0.45)), 0, 100),
      rationale: "Query and intelligence layers show increasing reusable output patterns.",
    },
    {
      title: "Discovery-to-action compression",
      score: clamp(Math.floor((review.momentumScore * 0.5 + intelligence.discoveryCount * 2)), 0, 100),
      rationale: "Weekly review and discovery velocity indicate faster execution conversion.",
    },
    {
      title: "Cross-domain alignment stabilization",
      score: clamp(Math.floor((relationships.coverageScore * 0.5 + intelligence.overallScore * 0.5)), 0, 100),
      rationale: "Relationship and intelligence coverage show improved mission coherence.",
    },
  ]

  const emergingThemes = unique([
    ...inference.knowledgeOpportunities.slice(0, 3).map((item) => `Opportunity: ${item.source}`),
    ...query.answers.slice(0, 2).map((item) => `Demand: ${item.query}`),
    ...secondBrain.suggestedActions.slice(0, 2).map((item) => `Priority: ${item}`),
  ]).slice(0, 8)

  const signals = [
    {
      title: "Research uncertainty pressure",
      source: "inference",
      score: clamp(Math.floor(inference.unansweredQuestions * 4), 0, 100),
    },
    {
      title: "Query confidence trend",
      source: "query",
      score: query.confidenceScore,
    },
    {
      title: "Relationship graph coherence",
      source: "relationships",
      score: relationships.coverageScore,
    },
    {
      title: "Knowledge intelligence strength",
      source: "knowledge-intelligence",
      score: intelligence.overallScore,
    },
  ]

  const knowledgeMomentum = clamp(
    Math.floor((review.momentumScore * 0.35 + secondBrain.brainScore * 0.25 + intelligence.discoveryCount * 1.8 + query.knowledgeCompleteness * 0.2)),
    0,
    100
  )

  const attentionScore = clamp(
    Math.floor((review.attentionScore * 0.4 + (100 - query.confidenceScore) * 0.25 + inference.unansweredQuestions * 2 + (100 - intelligence.knowledgeHealthScore) * 0.15)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((review.healthScore * 0.35 + intelligence.knowledgeHealthScore * 0.2 + intelligence.brainHealthScore * 0.15 + secondBrain.healthScore * 0.3)),
    0,
    100
  )

  const insights = unique([
    `Knowledge momentum is ${knowledgeMomentum} with review momentum at ${review.momentumScore}.`,
    `Attention pressure is ${attentionScore} driven by ${inference.unansweredQuestions} unanswered questions.`,
    `Health score is ${healthScore} with intelligence score at ${intelligence.overallScore}.`,
    ...emergingThemes.slice(0, 3),
  ]).slice(0, 10)

  const recommendations = unique([
    ...review.nextWeekActions.slice(0, 3),
    ...query.suggestedNextActions.slice(0, 3),
    ...secondBrain.suggestedActions.slice(0, 2),
  ]).slice(0, 10)

  return {
    mission: slug,
    missionTitle: intelligence.missionTitle,
    insightCount: insights.length,
    trendCount: trends.length,
    emergingThemeCount: emergingThemes.length,
    crossDomainSignals: signals.length,
    knowledgeMomentum,
    attentionScore,
    healthScore,
    insights,
    trends,
    emergingThemes,
    signals,
    recommendations,
    roadmap: buildInsightRoadmap(slug),
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

export async function getInsightRegistry(): Promise<{
  missionCount: number
  insightCount: number
  trendCount: number
  emergingThemeCount: number
  crossDomainSignals: number
  knowledgeMomentum: number
  attentionScore: number
  healthScore: number
  missions: MissionInsightWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionInsightWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionInsights(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const insightCount = results.reduce((sum, item) => sum + item.insightCount, 0)
  const trendCount = results.reduce((sum, item) => sum + item.trendCount, 0)
  const emergingThemeCount = results.reduce((sum, item) => sum + item.emergingThemeCount, 0)
  const crossDomainSignals = results.reduce((sum, item) => sum + item.crossDomainSignals, 0)

  const knowledgeMomentum = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.knowledgeMomentum, 0) / missionCount) : 0
  const attentionScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.attentionScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    missionCount,
    insightCount,
    trendCount,
    emergingThemeCount,
    crossDomainSignals,
    knowledgeMomentum,
    attentionScore,
    healthScore,
    missions: results,
  }
}
