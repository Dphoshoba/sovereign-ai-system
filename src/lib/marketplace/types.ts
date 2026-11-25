export interface MissionMarketplaceWorkspace {
  mission: string
  missionTitle: string
  assetCount: number
  courseCount: number
  frameworkCount: number
  bookCount: number
  seriesCount: number
  marketValue: number
  healthScore: number
  readonly previewOnly: boolean
  readonly noAuth: boolean
  readonly noDatabase: boolean
}
