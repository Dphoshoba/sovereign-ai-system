export interface MissionContinuityWorkspace {
  mission: string
  missionTitle: string
  continuityScore: number
  resilienceScore: number
  adaptabilityScore: number
  successorReadiness: number
  knowledgePreservation: number
  systemIntegrity: number
  recoveryCapacity: number
  healthScore: number
  previewOnly: boolean
  noAuth: boolean
  noDatabase: boolean
}

export interface ContinuityRegistry {
  continuityScore: number
  resilienceScore: number
  adaptabilityScore: number
  successorReadiness: number
  knowledgePreservation: number
  systemIntegrity: number
  recoveryCapacity: number
  healthScore: number
  missions: MissionContinuityWorkspace[]
}
