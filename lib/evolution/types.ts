export type EvolutionPhase = {
  phaseId: string
  phaseName: string
  capabilityGain: number
  autonomyGain: number
  growthAcceleration: number
}

export type EvolutionRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionEvolutionWorkspace = {
  mission: string
  missionTitle: string
  phaseCount: number
  buildCount: number
  capabilityScore: number
  autonomyScore: number
  growthVelocity: number
  evolutionScore: number
  healthScore: number
  phases: EvolutionPhase[]
  recommendations: string[]
  roadmap: EvolutionRoadmapItem[]
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
