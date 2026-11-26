export interface MetaCapability {
  capabilityId: string
  name: string
  score: number
  sophistication: number
}

export interface MetaIntelligenceRoadmapItem {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export interface MissionMetaIntelligenceWorkspace {
  mission: string
  missionTitle: string
  metaScore: number
  systemAwareness: number
  crossDomainReasoning: number
  optimizationDepth: number
  healthScore: number
  capabilities: MetaCapability[]
  recommendations: string[]
  roadmap: MetaIntelligenceRoadmapItem[]
  readonly readOnly: boolean
  readonly previewOnly: boolean
  readonly noAuth: boolean
  readonly noSessions: boolean
  readonly noJwt: boolean
  readonly noDatabase: boolean
  readonly noExecution: boolean
  readonly noPublishing: boolean
  readonly noOpenAI: boolean
  readonly noGraphWrites: boolean
  readonly noSocialPosting: boolean
}
