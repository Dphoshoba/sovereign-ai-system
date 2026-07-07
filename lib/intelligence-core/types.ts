export type IntelligenceCoreElement = {
  elementId: string
  elementName: string
  status: "healthy" | "watch" | "critical"
  score: number
}

export type IntelligenceCoreRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionIntelligenceCoreWorkspace = {
  mission: string
  missionTitle: string
  intelligenceScore: number
  adaptabilityScore: number
  learningVelocity: number
  innovationCapacity: number
  impactPotential: number
  marketReadiness: number
  ecosystemStrength: number
  knowledgeCapital: number
  healthScore: number
  elements: IntelligenceCoreElement[]
  recommendations: string[]
  roadmap: IntelligenceCoreRoadmapItem[]
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
