export interface MissionLegacyWorkspace {
  mission: string
  missionTitle: string
  legacyScore: number
  historicalValue: number
  preservationScore: number
  continuity: number
  inheritanceScore: number
  impactScore: number
  wisdomTransfer: number
  healthScore: number
  previewOnly: boolean
  noAuth: boolean
  noDatabase: boolean
}

export interface LegacyRegistry {
  legacyScore: number
  historicalValue: number
  preservationScore: number
  continuity: number
  inheritanceScore: number
  impactScore: number
  wisdomTransfer: number
  healthScore: number
  missions: MissionLegacyWorkspace[]
}
