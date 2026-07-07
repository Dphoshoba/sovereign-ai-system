export interface MissionSovereigntyWorkspace {
  mission: string
  missionTitle: string
  ownershipScore: number
  controlScore: number
  dependencyScore: number
  resilienceScore: number
  sovereigntyScore: number
  healthScore: number
  readonly previewOnly: boolean
  readonly noAuth: boolean
  readonly noDatabase: boolean
}
