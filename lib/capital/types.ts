export type CapitalAssetItem = {
  title: string
  value: number
  category: "knowledge" | "content" | "commercial" | "licensing"
}

export type CapitalRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionCapitalWorkspace = {
  mission: string
  missionTitle: string
  assetValue: number
  knowledgeCapital: number
  reuseScore: number
  commercializationScore: number
  licensingScore: number
  contentScore: number
  healthScore: number
  assets: CapitalAssetItem[]
  recommendations: string[]
  roadmap: CapitalRoadmapItem[]
  readOnly: true
  previewOnly: true
  noAuth: true
  noSessions: true
  noJwt: true
  noDatabase: true
  noExecution: true
  noPublishing: true
  noOpenAI: true
  noGraphWrites: true
  noSocialPosting: true
}
