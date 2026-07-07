export interface MissionNetworkWorkspace {
  mission: string
  missionTitle: string
  networkCount: number
  connectedMissions: number
  connectedAssets: number
  networkDensity: number
  networkHealth: number
  collaborationScore: number
  healthScore: number
  readonly previewOnly: boolean
  readonly noAuth: boolean
  readonly noDatabase: boolean
}
