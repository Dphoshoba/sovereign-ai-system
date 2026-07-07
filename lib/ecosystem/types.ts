export type EcosystemConnection = {
  connectionId: string
  partnerName: string
  strengthLevel: number
  synergy: number
}

export type EcosystemRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionEcosystemWorkspace = {
  mission: string
  missionTitle: string
  partnerCount: number
  communityAssets: number
  connectedSystems: number
  networkStrength: number
  ecosystemScore: number
  healthScore: number
  connections: EcosystemConnection[]
  recommendations: string[]
  roadmap: EcosystemRoadmapItem[]
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
