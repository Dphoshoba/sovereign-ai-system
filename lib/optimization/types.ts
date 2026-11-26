export interface OptimizationItem {
  optimizationId: string
  name: string
  efficiencyGain: number
  costReduction: number
}

export interface OptimizationRoadmapItem {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export interface MissionOptimizationWorkspace {
  mission: string
  missionTitle: string
  optimizationCount: number
  efficiencyScore: number
  costReduction: number
  reusePotential: number
  improvementVelocity: number
  healthScore: number
  optimizations: OptimizationItem[]
  recommendations: string[]
  roadmap: OptimizationRoadmapItem[]
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
