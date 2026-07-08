export interface RuntimeUnit {
  id: string
  name: string
  type: 'action' | 'workflow' | 'task' | 'approval' | 'audit'
  status: 'idle' | 'ready' | 'pending' | 'approved' | 'blocked'
  executionMode: 'preview' | 'simulated' | 'staged'
  requiresApproval: boolean
  safetyLevel: 'critical' | 'high' | 'medium' | 'low'
  createdAt: number
  lastUpdated: number
}

export interface RuntimeKernelMetrics {
  runtimeScore: number
  registeredRuntimeUnits: number
  executionPreviewCount: number
  safetyScore: number
  approvalCoverage: number
  auditabilityScore: number
  healthScore: number
}

export interface RuntimeKernelRegistry {
  id: string
  version: string
  status: 'operational' | 'maintenance' | 'degraded'
  runtimeUnits: RuntimeUnit[]
  metrics: RuntimeKernelMetrics
  lastSync: number
}
