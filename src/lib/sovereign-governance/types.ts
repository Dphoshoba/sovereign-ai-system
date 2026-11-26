export interface MissionSovereignGovernanceWorkspace {
  mission: string
  missionTitle: string
  governanceScore: number
  decisionQuality: number
  transparencyScore: number
  accountabilityScore: number
  participationScore: number
  legitimacy: number
  effectivenessScore: number
  healthScore: number
  previewOnly: boolean
  noAuth: boolean
  noDatabase: boolean
}

export interface SovereignGovernanceRegistry {
  governanceScore: number
  decisionQuality: number
  transparencyScore: number
  accountabilityScore: number
  participationScore: number
  legitimacy: number
  effectivenessScore: number
  healthScore: number
  missions: MissionSovereignGovernanceWorkspace[]
}
