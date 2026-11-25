export interface MissionPortfolioFederationWorkspace {
  mission: string
  missionTitle: string
  portfolioCount: number
  missionAlignment: number
  assetReuse: number
  capitalEfficiency: number
  portfolioScore: number
  healthScore: number
  readonly previewOnly: boolean
  readonly noAuth: boolean
  readonly noDatabase: boolean
}
