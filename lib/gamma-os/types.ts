export type GammaOsSignal = {
  title: string
  source: string
  score: number
}

export type GammaOsRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type GammaOsWorkspace = {
  mission: string
  missionTitle: string
  gammaScore: number
  osHealth: number
  knowledgeDebt: number
  assetValue: number
  capitalizationScore: number
  growthTrajectory: number
  readinessScore: number
  freezeReadiness: number
  signals: GammaOsSignal[]
  recommendations: string[]
  roadmap: GammaOsRoadmapItem[]
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
