export interface MissionKingdomEnterpriseWorkspace {
  mission: string
  missionTitle: string
  enterpriseScore: number
  scaleScore: number
  disciplineScore: number
  leadershipScore: number
  operationalScore: number
  financialScore: number
  culturalScore: number
  healthScore: number
  previewOnly: boolean
  noAuth: boolean
  noDatabase: boolean
}

export interface KingdomEnterpriseRegistry {
  enterpriseScore: number
  scaleScore: number
  disciplineScore: number
  leadershipScore: number
  operationalScore: number
  financialScore: number
  culturalScore: number
  healthScore: number
  missions: MissionKingdomEnterpriseWorkspace[]
}
