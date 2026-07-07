export interface MissionFederationWorkspace {
  mission: string
  missionTitle: string
  missionCount: number
  federatedAssets: number
  federatedKnowledge: number
  reuseScore: number
  cohesionScore: number
  healthScore: number
  readonly previewOnly: boolean
  readonly noAuth: boolean
  readonly noDatabase: boolean
}
