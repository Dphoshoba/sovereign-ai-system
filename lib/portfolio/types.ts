export type PortfolioCoverageItem = {
  workspace: string
  score: number
  status: "strong" | "watch" | "weak"
}

export type PortfolioRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionPortfolioWorkspace = {
  mission: string
  missionTitle: string
  missionCount: number
  assetCount: number
  workspaceCoverage: number
  portfolioHealth: number
  readinessScore: number
  priorityScore: number
  coverage: PortfolioCoverageItem[]
  recommendations: string[]
  roadmap: PortfolioRoadmapItem[]
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
