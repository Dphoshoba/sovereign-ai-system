export interface MissionCollectiveIntelligenceWorkspace {
  mission: string
  missionTitle: string
  collectiveScore: number
  crossMissionLearning: number
  knowledgeReuse: number
  adaptationCapacity: number
  coordinationScore: number
  healthScore: number
  readonly previewOnly: boolean
  readonly noAuth: boolean
  readonly noDatabase: boolean
}
