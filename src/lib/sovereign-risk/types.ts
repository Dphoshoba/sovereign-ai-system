export interface MissionSovereignRiskWorkspace {
  mission: string
  missionTitle: string
  riskScore: number
  threatAssessment: number
  mitigationScore: number
  resilience: number
  recovery: number
  contingency: number
  adaptability: number
  healthScore: number
  readonly previewOnly: boolean
  readonly noAuth: boolean
  readonly noDatabase: boolean
}
