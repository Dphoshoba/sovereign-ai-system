export interface QueuedWorkItem {
  id: string
  title: string
  status: 'ready' | 'blocked' | 'waiting_approval' | 'pending'
  priority: number
  dependencies: string[]
  estimatedTime: number
  createdAt: number
}

export interface RuntimeQueueMetrics {
  queueCount: number
  readyCount: number
  blockedCount: number
  waitingForApprovalCount: number
  dependencyCount: number
  queueHealth: number
  healthScore: number
}

export interface RuntimeQueue {
  id: string
  version: string
  status: 'operational' | 'maintenance' | 'degraded'
  items: QueuedWorkItem[]
  metrics: RuntimeQueueMetrics
  lastSync: number
}
