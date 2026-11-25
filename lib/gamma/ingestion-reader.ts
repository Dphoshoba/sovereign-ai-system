import { getMissionAdvisor } from "./advisor-reader"
import { getGammaOsWorkspace } from "./gamma-os-reader"
import { getMissionKnowledgeGraph } from "./graph-reader"
import { getMissionInference } from "./inference-reader"
import { getMissionControl } from "./mission-control-reader"
import { getMissionPlanner } from "./planner-reader"
import { getResearchMissions } from "./research-registry"
import { getMissionRelationships } from "./relationship-reader"
import { getMissionReview } from "./review-reader"
import { buildIngestionRoadmap, buildIngestionStages } from "../ingestion/mock-data"
import type { MissionIngestionWorkspace } from "../ingestion/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export async function getMissionIngestionWorkspace(slug: string): Promise<MissionIngestionWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((item) => item.slug === slug)
  const relationships = await getMissionRelationships(slug)
  const graph = await getMissionKnowledgeGraph(slug)
  const inference = await getMissionInference(slug)
  const advisor = await getMissionAdvisor(slug)
  const planner = await getMissionPlanner(slug)
  const review = await getMissionReview(slug)
  const control = await getMissionControl(slug)
  const gammaOs = await getGammaOsWorkspace(slug)

  if (!mission || !relationships || !graph || !inference || !advisor || !planner || !review || !control || !gammaOs) {
    return null
  }

  const missionCount = missions.length
  const registryCount = missions.length
  const relationshipCount = relationships.connectionCount
  const graphNodeCount = graph.nodeCount
  const graphEdgeCount = graph.edgeCount
  const documentCount = mission.questions + mission.discoveries + mission.scriptures

  const stageScores = [
    relationships.coverageScore,
    graph.coverageScore,
    inference.coverageScore,
    advisor.healthScore,
    planner.healthScore,
    review.healthScore,
    control.healthScore,
    gammaOs.osHealth,
  ]

  const pipelineCoverage = clamp(
    Math.floor(stageScores.reduce((sum, score) => sum + score, 0) / stageScores.length),
    0,
    100
  )

  const knowledgeFlowScore = clamp(
    Math.floor((
      relationships.coverageScore * 0.14 +
      graph.coverageScore * 0.14 +
      inference.coverageScore * 0.12 +
      advisor.executionScore * 0.12 +
      planner.roadmapScore * 0.12 +
      review.reviewScore * 0.12 +
      control.executionScore * 0.12 +
      gammaOs.gammaScore * 0.12
    )),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((
      relationships.coverageScore * 0.2 +
      graph.coverageScore * 0.15 +
      inference.healthScore * 0.15 +
      advisor.healthScore * 0.1 +
      planner.healthScore * 0.1 +
      review.healthScore * 0.1 +
      control.healthScore * 0.1 +
      gammaOs.osHealth * 0.1
    )),
    0,
    100
  )

  const recommendations = unique([
    "Preserve deterministic markdown-to-registry synchronization.",
    ...control.immediateActions.slice(0, 2).map((item) => item.title),
    ...planner.recommendations.slice(0, 2),
    ...review.recommendations.slice(0, 2),
  ]).slice(0, 10)

  return {
    mission: slug,
    missionTitle: mission.title,
    documentCount,
    missionCount,
    registryCount,
    relationshipCount,
    graphNodeCount,
    graphEdgeCount,
    pipelineCoverage,
    knowledgeFlowScore,
    healthScore,
    stages: buildIngestionStages(),
    recommendations,
    roadmap: buildIngestionRoadmap(slug),
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

export async function getIngestionRegistry(): Promise<{
  missionCount: number
  documentCount: number
  registryCount: number
  relationshipCount: number
  graphNodeCount: number
  graphEdgeCount: number
  pipelineCoverage: number
  knowledgeFlowScore: number
  healthScore: number
  missions: MissionIngestionWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionIngestionWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionIngestionWorkspace(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const documentCount = results.reduce((sum, item) => sum + item.documentCount, 0)
  const registryCount = results.reduce((sum, item) => sum + item.registryCount, 0)
  const relationshipCount = results.reduce((sum, item) => sum + item.relationshipCount, 0)
  const graphNodeCount = results.reduce((sum, item) => sum + item.graphNodeCount, 0)
  const graphEdgeCount = results.reduce((sum, item) => sum + item.graphEdgeCount, 0)
  const pipelineCoverage = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.pipelineCoverage, 0) / missionCount) : 0
  const knowledgeFlowScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.knowledgeFlowScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    missionCount,
    documentCount,
    registryCount,
    relationshipCount,
    graphNodeCount,
    graphEdgeCount,
    pipelineCoverage,
    knowledgeFlowScore,
    healthScore,
    missions: results,
  }
}