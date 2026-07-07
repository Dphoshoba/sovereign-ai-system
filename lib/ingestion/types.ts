export type IngestionPipelineStage = {
  stage: string
  source: string
  output: string
  status: "ready" | "healthy" | "watch"
}

export type IngestionRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionIngestionWorkspace = {
  mission: string
  missionTitle: string
  documentCount: number
  missionCount: number
  registryCount: number
  relationshipCount: number
  graphNodeCount: number
  graphEdgeCount: number
  pipelineCoverage: number
  knowledgeFlowScore: number
  healthScore: number
  stages: IngestionPipelineStage[]
  recommendations: string[]
  roadmap: IngestionRoadmapItem[]
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