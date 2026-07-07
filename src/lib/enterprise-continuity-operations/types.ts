export interface MissionEnterpriseContinuityOperationsWorkspace {
  mission: string
  missionTitle: string
  continuityScore: number
  businessContinuity: number
  disasterRecovery: number
  knowledgePreservation: number
  systemRedundancy: number
  failoverCapacity: number
  resilience: number
  healthScore: number
  readonly previewOnly: boolean
  readonly noAuth: boolean
  readonly noDatabase: boolean
}
