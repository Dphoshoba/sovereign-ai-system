export type Decision = {
  decisionId: string
  title: string
  quality: number
  confidence: number
  impact: "high" | "medium" | "low"
}

export type DecisionRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionDecisionWorkspace = {
  mission: string
  missionTitle: string
  decisionCount: number
  decisionQuality: number
  confidenceScore: number
  riskScore: number
  strategicScore: number
  healthScore: number
  decisions: Decision[]
  recommendations: string[]
  roadmap: DecisionRoadmapItem[]
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
