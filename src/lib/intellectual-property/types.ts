export interface MissionIntellectualPropertyWorkspace {
  mission: string
  missionTitle: string
  ipScore: number
  innovationScore: number
  protectionScore: number
  licensingPotential: number
  patentStrength: number
  trademarkValue: number
  copyrightCoverage: number
  healthScore: number
  previewOnly: boolean
  noAuth: boolean
  noDatabase: boolean
}

export interface IntellectualPropertyRegistry {
  ipScore: number
  innovationScore: number
  protectionScore: number
  licensingPotential: number
  patentStrength: number
  trademarkValue: number
  copyrightCoverage: number
  healthScore: number
  missions: MissionIntellectualPropertyWorkspace[]
}