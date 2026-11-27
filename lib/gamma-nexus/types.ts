export type NexusElement = {
  elementId: string
  elementName: string
  status: "healthy" | "watch" | "alert"
  score: number
}

export type NexusRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionGammaNexusWorkspace = {
  mission: string
  missionTitle: string
  enterpriseScore: number
  executionReadiness: number
  knowledgeCapital: number
  growthPotential: number
  monetizationPotential: number
  ecosystemStrength: number
  forecastConfidence: number
  autonomyScore: number
  healthScore: number
  elements: NexusElement[]
  recommendations: string[]
  roadmap: NexusRoadmapItem[]
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
