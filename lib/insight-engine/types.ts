export type InsightTrend = {
  title: string
  score: number
  rationale: string
}

export type InsightSignal = {
  title: string
  source: string
  score: number
}

export type InsightRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionInsightWorkspace = {
  mission: string
  missionTitle: string
  insightCount: number
  trendCount: number
  emergingThemeCount: number
  crossDomainSignals: number
  knowledgeMomentum: number
  attentionScore: number
  healthScore: number
  insights: string[]
  trends: InsightTrend[]
  emergingThemes: string[]
  signals: InsightSignal[]
  recommendations: string[]
  roadmap: InsightRoadmapItem[]
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
