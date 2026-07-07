export type RevenueStream = {
  streamId: string
  streamName: string
  potential: number
  effort: number
}

export type MonetizationRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionMonetizationWorkspace = {
  mission: string
  missionTitle: string
  revenueStreams: number
  marketOpportunities: number
  pricingModels: number
  commercialAssets: number
  revenueScore: number
  healthScore: number
  streams: RevenueStream[]
  recommendations: string[]
  roadmap: MonetizationRoadmapItem[]
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
