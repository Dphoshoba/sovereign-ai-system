export interface MissionSovereignStrategyWorkspace {
  mission: string
  missionTitle: string
  strategyScore: number
  alignmentScore: number
  executionScore: number
  missionCohesion: number
  resourceAllocation: number
  successProbability: number
  riskMitigation: number
  healthScore: number
  previewOnly: boolean
  noAuth: boolean
  noDatabase: boolean
}

export interface SovereignStrategyRegistry {
  strategyScore: number
  alignmentScore: number
  executionScore: number
  missionCohesion: number
  resourceAllocation: number
  successProbability: number
  riskMitigation: number
  healthScore: number
  missions: MissionSovereignStrategyWorkspace[]
}
