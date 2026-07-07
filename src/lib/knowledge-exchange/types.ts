export interface MissionKnowledgeExchangeWorkspace {
  mission: string
  missionTitle: string
  exchangeCount: number
  knowledgeFlow: number
  reusePotential: number
  crossPollinization: number
  exchangeScore: number
  healthScore: number
  readonly previewOnly: boolean
  readonly noAuth: boolean
  readonly noDatabase: boolean
}
