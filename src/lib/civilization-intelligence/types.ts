export interface MissionCivilizationIntelligenceWorkspace {
  mission: string
  missionTitle: string
  civilizationScore: number
  culturalMaturity: number
  systemComplexity: number
  resilienceScore: number
  knowledgeCapital: number
  symbolicScore: number
  evolutionScore: number
  healthScore: number
  previewOnly: boolean
  noAuth: boolean
  noDatabase: boolean
}

export interface CivilizationIntelligenceRegistry {
  civilizationScore: number
  culturalMaturity: number
  systemComplexity: number
  resilienceScore: number
  knowledgeCapital: number
  symbolicScore: number
  evolutionScore: number
  healthScore: number
  missions: MissionCivilizationIntelligenceWorkspace[]
}
