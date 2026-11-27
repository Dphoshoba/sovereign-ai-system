export interface NexusComponent {
  componentId: string
  name: string
  status: "active" | "standby" | "integrating"
  score: number
}

export interface NexusRoadmapItem {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export interface MissionNexusWorkspace {
  mission: string
  missionTitle: string
  nexusScore: number
  adaptabilityScore: number
  optimizationScore: number
  intelligenceScore: number
  portfolioValue: number
  missionReadiness: number
  ecosystemStrength: number
  healthScore: number
  components: NexusComponent[]
  recommendations: string[]
  roadmap: NexusRoadmapItem[]
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
