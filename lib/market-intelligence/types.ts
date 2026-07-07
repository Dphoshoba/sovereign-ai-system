export type MarketSegment = {
  segmentId: string
  segmentName: string
  audienceSize: number
  demandLevel: number
  competitionLevel: number
}

export type MarketRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionMarketIntelligenceWorkspace = {
  mission: string
  missionTitle: string
  marketSegments: number
  audienceCount: number
  demandScore: number
  competitionScore: number
  opportunityScore: number
  adoptionScore: number
  healthScore: number
  segments: MarketSegment[]
  recommendations: string[]
  roadmap: MarketRoadmapItem[]
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
