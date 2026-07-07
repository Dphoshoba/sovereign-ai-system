export interface MissionEcosystemIntelligenceWorkspace {
  mission: string
  missionTitle: string
  ecosystemScore: number
  ecosystemBreadth: number
  ecosystemDepth: number
  crossDomainReuse: number
  synergyScore: number
  healthScore: number
  readonly previewOnly: boolean
  readonly noAuth: boolean
  readonly noDatabase: boolean
}
