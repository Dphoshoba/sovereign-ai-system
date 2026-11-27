export type OpportunityItem = {
  title: string
  score: number
  lane: "market" | "education" | "ministry" | "creator"
  action: string
}

export type OpportunityRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionOpportunityWorkspace = {
  mission: string
  missionTitle: string
  opportunityCount: number
  marketPotential: number
  educationPotential: number
  ministryPotential: number
  creatorPotential: number
  roiScore: number
  healthScore: number
  opportunities: OpportunityItem[]
  recommendations: string[]
  roadmap: OpportunityRoadmapItem[]
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
