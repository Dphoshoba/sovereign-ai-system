export interface ScenarioItem {
  scenarioId: string
  name: string
  probability: number
  outcome: string
}

export interface ScenarioRoadmapItem {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export interface MissionScenarioWorkspace {
  mission: string
  missionTitle: string
  scenarioCount: number
  bestCase: number
  worstCase: number
  expectedCase: number
  readinessScore: number
  healthScore: number
  scenarios: ScenarioItem[]
  recommendations: string[]
  roadmap: ScenarioRoadmapItem[]
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
