export interface MissionEnterpriseGraphWorkspace {
  mission: string
  missionTitle: string
  enterpriseNodes: number
  enterpriseEdges: number
  graphCoverage: number
  relationshipDensity: number
  graphHealth: number
  healthScore: number
  readonly previewOnly: boolean
  readonly noAuth: boolean
  readonly noDatabase: boolean
}
