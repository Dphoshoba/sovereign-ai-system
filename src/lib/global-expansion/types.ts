export interface MissionGlobalExpansionWorkspace {
  mission: string
  missionTitle: string
  expansionScore: number
  marketPenetration: number
  geographicReach: number
  culturalAdaptation: number
  partnershipStrength: number
  riskResilience: number
  scalability: number
  healthScore: number
  previewOnly: boolean
  noAuth: boolean
  noDatabase: boolean
}

export interface GlobalExpansionRegistry {
  expansionScore: number
  marketPenetration: number
  geographicReach: number
  culturalAdaptation: number
  partnershipStrength: number
  riskResilience: number
  scalability: number
  healthScore: number
  missions: MissionGlobalExpansionWorkspace[]
}
