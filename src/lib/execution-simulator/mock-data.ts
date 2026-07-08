import { ExecutionSimulator, SimulationResult } from './types'

const FIXED_TIMESTAMP = 1751990400000

const results: SimulationResult[] = [
  { id: 'sim-001', actionId: 'act-001', successProjection: 92, failureProjection: 5, riskProjection: 3, manualReviewRequired: false, confidence: 89, assumptions: ['sender verified', 'content validated'], createdAt: FIXED_TIMESTAMP },
  { id: 'sim-002', actionId: 'act-002', successProjection: 88, failureProjection: 8, riskProjection: 4, manualReviewRequired: true, confidence: 85, assumptions: ['dependencies resolved', 'timeline accurate'], createdAt: FIXED_TIMESTAMP },
  { id: 'sim-003', actionId: 'act-003', successProjection: 95, failureProjection: 2, riskProjection: 3, manualReviewRequired: true, confidence: 92, assumptions: ['recipients identified', 'legal reviewed'], createdAt: FIXED_TIMESTAMP },
  { id: 'sim-004', actionId: 'act-004', successProjection: 90, failureProjection: 6, riskProjection: 4, manualReviewRequired: false, confidence: 87, assumptions: ['brand guidelines met', 'tone appropriate'], createdAt: FIXED_TIMESTAMP },
  { id: 'sim-005', actionId: 'act-005', successProjection: 85, failureProjection: 10, riskProjection: 5, manualReviewRequired: true, confidence: 82, assumptions: ['no conflicts', 'availability confirmed'], createdAt: FIXED_TIMESTAMP },
]

export const getExecutionSimulatorMockData = (): ExecutionSimulator => ({
  id: 'execution-simulator-001',
  version: '1.0.0',
  status: 'operational',
  results,
  metrics: {
    simulationCount: results.length,
    successProjection: 90,
    failureProjection: 6,
    riskProjection: 4,
    manualReviewRequired: results.filter(r => r.manualReviewRequired).length,
    simulationConfidence: 87,
    healthScore: 89,
  },
  lastSync: FIXED_TIMESTAMP,
})
