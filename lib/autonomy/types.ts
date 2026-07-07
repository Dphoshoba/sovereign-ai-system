export interface AutonomyCapability {
  capabilityId: string
  name: string
  automationLevel: number
  readiness: number
}

export interface AutonomyRoadmapItem {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export interface MissionAutonomyWorkspace {
  mission: string
  missionTitle: string
  automationCoverage: number
  autonomyScore: number
  executionCapability: number
  decisionCapacity: number
  healthScore: number
  capabilities: AutonomyCapability[]
  recommendations: string[]
  roadmap: AutonomyRoadmapItem[]
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
