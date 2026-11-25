export interface AdaptationItem {
  adaptationId: string
  name: string
  effectivenesScore: number
  implementationCost: number
}

export interface AdaptiveRoadmapItem {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export interface MissionAdaptiveWorkspace {
  mission: string
  missionTitle: string
  adaptationScore: number
  changeVelocity: number
  learningCapacity: number
  selfImprovement: number
  healthScore: number
  adaptations: AdaptationItem[]
  recommendations: string[]
  roadmap: AdaptiveRoadmapItem[]
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
