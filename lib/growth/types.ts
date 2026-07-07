export type GrowthVector = {
  vectorId: string
  vectorName: string
  potential: number
  velocity: number
  status: "emerging" | "active" | "mature"
}

export type GrowthRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionGrowthWorkspace = {
  mission: string
  missionTitle: string
  growthPotential: number
  growthVelocity: number
  expansionScore: number
  adoptionScore: number
  communityScore: number
  healthScore: number
  vectors: GrowthVector[]
  recommendations: string[]
  roadmap: GrowthRoadmapItem[]
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
