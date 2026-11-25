export type FounderFocus = {
  area: string
  focusLevel: number
  progress: number
}

export type FounderRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionFounderIntelligenceWorkspace = {
  mission: string
  missionTitle: string
  focusScore: number
  clarityScore: number
  executionScore: number
  knowledgeScore: number
  leadershipScore: number
  healthScore: number
  focuses: FounderFocus[]
  recommendations: string[]
  roadmap: FounderRoadmapItem[]
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
