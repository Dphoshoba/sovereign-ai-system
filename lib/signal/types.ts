export interface SignalItem {
  signalId: string
  name: string
  strength: number
  relevance: number
}

export interface SignalRoadmapItem {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export interface MissionSignalWorkspace {
  mission: string
  missionTitle: string
  signalCount: number
  trendScore: number
  anomalyCount: number
  prioritySignals: number
  healthScore: number
  signals: SignalItem[]
  recommendations: string[]
  roadmap: SignalRoadmapItem[]
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
