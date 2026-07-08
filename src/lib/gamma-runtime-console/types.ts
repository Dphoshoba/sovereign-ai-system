export interface ConsoleMetrics {
  runtimeConsoleScore: number
  runtimeReadiness: number
  safetyScore: number
  approvalCoverage: number
  auditCoverage: number
  queueHealth: number
  previewExecutionCoverage: number
  humanReviewCoverage: number
  healthScore: number
}

export interface RuntimeSystemStatus {
  runtimeKernel: { status: string; score: number }
  actionRegistry: { status: string; count: number }
  approvalWorkflow: { status: string; pending: number }
  runtimeAudit: { status: string; events: number }
  executionSimulator: { status: string; confidence: number }
  runtimeQueue: { status: string; items: number }
  humanReview: { status: string; reviews: number }
  safeExecutionPolicy: { status: string; rules: number }
  runtimeAPI: { status: string; endpoints: number }
}

export interface GammaRuntimeConsole {
  id: string
  version: string
  status: 'operational' | 'maintenance' | 'degraded'
  systemStatus: RuntimeSystemStatus
  metrics: ConsoleMetrics
  lastSync: number
}
