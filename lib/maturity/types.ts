export type MissionMaturityLevel =
  | "Seed"
  | "Growing"
  | "Developing"
  | "Mature"
  | "Advanced"
  | "Production Ready"
  | "Operational"

export type MaturityWorkspaceStatus = "strong" | "watch" | "weak"

export type MaturityWorkspaceScore = {
  workspace: string
  score: number
  status: MaturityWorkspaceStatus
}

export type MaturityAssetHighlight = {
  title: string
  workspace: string
  score: number
  rationale: string
}

export type MaturityTimelineItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionMaturityWorkspace = {
  mission: string
  missionTitle: string
  missionScore: number
  researchScore: number
  creatorScore: number
  ministryScore: number
  executiveScore: number
  agencyScore: number
  knowledgeScore: number
  secondBrainScore: number
  coverageScore: number
  readinessScore: number
  reuseScore: number
  scalabilityScore: number
  commercialScore: number
  teachingScore: number
  confidenceScore: number
  healthScore: number
  productionReadyPercentage: number
  classification: MissionMaturityLevel
  strongestWorkspace: MaturityWorkspaceScore
  weakestWorkspace: MaturityWorkspaceScore
  workspaceRankings: MaturityWorkspaceScore[]
  weakestAreas: string[]
  highestPerformingAssets: MaturityAssetHighlight[]
  reusePotential: string[]
  commercialPotential: string[]
  teachingPotential: string[]
  readinessTimeline: MaturityTimelineItem[]
  missionEvolution: string[]
  scalingReady: boolean
  teachingReady: boolean
  commercializationReady: boolean
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