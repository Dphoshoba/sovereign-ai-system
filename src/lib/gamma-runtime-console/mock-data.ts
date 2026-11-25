import { GammaRuntimeConsole } from './types'

const FIXED_TIMESTAMP = 1751990400000

export const getGammaRuntimeConsoleMockData = (): GammaRuntimeConsole => ({
  id: 'gamma-runtime-console-001',
  version: '1.0.0',
  status: 'operational',
  systemStatus: {
    runtimeKernel: { status: 'operational', score: 93 },
    actionRegistry: { status: 'operational', count: 7 },
    approvalWorkflow: { status: 'operational', pending: 2 },
    runtimeAudit: { status: 'operational', events: 8 },
    executionSimulator: { status: 'operational', confidence: 87 },
    runtimeQueue: { status: 'operational', items: 6 },
    humanReview: { status: 'operational', reviews: 5 },
    safeExecutionPolicy: { status: 'operational', rules: 7 },
    runtimeAPI: { status: 'operational', endpoints: 5 },
  },
  metrics: {
    runtimeConsoleScore: 91,
    runtimeReadiness: 94,
    safetyScore: 96,
    approvalCoverage: 88,
    auditCoverage: 96,
    queueHealth: 86,
    previewExecutionCoverage: 92,
    humanReviewCoverage: 90,
    healthScore: 91,
  },
  lastSync: FIXED_TIMESTAMP,
})
