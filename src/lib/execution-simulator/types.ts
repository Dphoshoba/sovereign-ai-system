export interface SimulationResult {
  id: string
  actionId: string
  successProjection: number
  failureProjection: number
  riskProjection: number
  manualReviewRequired: boolean
  confidence: number
  assumptions: string[]
  createdAt: number
}

export interface ExecutionSimulatorMetrics {
  simulationCount: number
  successProjection: number
  failureProjection: number
  riskProjection: number
  manualReviewRequired: number
  simulationConfidence: number
  healthScore: number
}

export interface ExecutionSimulator {
  id: string
  version: string
  status: 'operational' | 'maintenance' | 'degraded'
  results: SimulationResult[]
  metrics: ExecutionSimulatorMetrics
  lastSync: number
}
