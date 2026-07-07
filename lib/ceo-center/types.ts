export type CEODashboardItem = {
  metric: string
  value: number
  trend: "up" | "stable" | "down"
  status: "alert" | "watch" | "healthy"
}

export type CEORoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionCEOCenterWorkspace = {
  mission: string
  missionTitle: string
  executiveScore: number
  portfolioValue: number
  executionReadiness: number
  opportunityIndex: number
  strategicAlignment: number
  knowledgeCapital: number
  growthPotential: number
  missionHealth: number
  healthScore: number
  dashboard: CEODashboardItem[]
  recommendations: string[]
  roadmap: CEORoadmapItem[]
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
