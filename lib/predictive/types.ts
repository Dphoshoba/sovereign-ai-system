export type Forecast = {
  forecastId: string
  metric: string
  trend: "up" | "stable" | "down"
  confidence: number
}

export type PredictiveRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionPredictiveWorkspace = {
  mission: string
  missionTitle: string
  forecastCount: number
  trendScore: number
  opportunityForecast: number
  riskForecast: number
  confidenceScore: number
  healthScore: number
  forecasts: Forecast[]
  recommendations: string[]
  roadmap: PredictiveRoadmapItem[]
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
