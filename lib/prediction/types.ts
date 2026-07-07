export interface PredictionItem {
  predictionId: string
  name: string
  confidence: number
  horizon: string
}

export interface PredictionRoadmapItem {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export interface MissionPredictionWorkspace {
  mission: string
  missionTitle: string
  forecastCount: number
  confidenceScore: number
  growthProjection: number
  trajectoryScore: number
  riskProjection: number
  healthScore: number
  predictions: PredictionItem[]
  recommendations: string[]
  roadmap: PredictionRoadmapItem[]
  readonly readOnly: boolean
  readonly previewOnly: boolean
  readonly noAuth: boolean
  readonly noSessions: boolean
  readonly noJwt: boolean
  readonly noDatabase: boolean
  readonly noExecution: boolean
  readonly noPublishing: boolean
  readonly noOpenAI: boolean
  readonly noGraphWrites: boolean
  readonly noSocialPosting: boolean
}
