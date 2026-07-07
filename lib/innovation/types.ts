export type InnovationIdea = {
  ideaId: string
  ideaName: string
  noveltyScore: number
  feasibilityScore: number
  commercialPotential: number
}

export type InnovationRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionInnovationWorkspace = {
  mission: string
  missionTitle: string
  innovationCount: number
  newConcepts: number
  prototypeCount: number
  ideaVelocity: number
  innovationScore: number
  commercialPotential: number
  healthScore: number
  ideas: InnovationIdea[]
  recommendations: string[]
  roadmap: InnovationRoadmapItem[]
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
