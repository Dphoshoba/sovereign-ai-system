export interface MissionGammaSovereignOSWorkspace {
  mission: string
  missionTitle: string
  sovereignScore: number
  systemIntegrity: number
  ecosystemStrength: number
  autonomyScore: number
  healthScore: number
  previewOnly: boolean
  noAuth: boolean
  noDatabase: boolean
}

export interface GammaSovereignOSRegistry {
  sovereignScore: number
  systemIntegrity: number
  ecosystemStrength: number
  autonomyScore: number
  healthScore: number
  missions: MissionGammaSovereignOSWorkspace[]
}
