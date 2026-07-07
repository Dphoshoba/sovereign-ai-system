export interface MissionMissionEconomyWorkspace {
  mission: string
  missionTitle: string
  economyScore: number
  valueGeneration: number
  revenuePotential: number
  costOptimization: number
  profitMargin: number
  capitalEfficiency: number
  growthRate: number
  healthScore: number
  previewOnly: boolean
  noAuth: boolean
  noDatabase: boolean
}

export interface MissionEconomyRegistry {
  economyScore: number
  valueGeneration: number
  revenuePotential: number
  costOptimization: number
  profitMargin: number
  capitalEfficiency: number
  growthRate: number
  healthScore: number
  missions: MissionMissionEconomyWorkspace[]
}
