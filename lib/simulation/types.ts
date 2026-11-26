export interface SimulationItem {
  simulationId: string
  name: string
  outcome: number
  iterations: number
}

export interface SimulationRoadmapItem {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export interface MissionSimulationWorkspace {
  mission: string
  missionTitle: string
  simulationCount: number
  decisionModels: number
  testCoverage: number
  executionProbability: number
  healthScore: number
  simulations: SimulationItem[]
  recommendations: string[]
  roadmap: SimulationRoadmapItem[]
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
