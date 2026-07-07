export type StrategyItem = {
  strategyId: string
  strategyName: string
  competitiveAdvantage: number
  alignment: number
  resourcesRequired: number
}

export type StrategyRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionStrategyWorkspace = {
  mission: string
  missionTitle: string
  strategyCount: number
  strategicThemes: number
  competitiveAdvantage: number
  missionFit: number
  alignmentScore: number
  executionPotential: number
  healthScore: number
  strategies: StrategyItem[]
  recommendations: string[]
  roadmap: StrategyRoadmapItem[]
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
