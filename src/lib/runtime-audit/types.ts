export interface AuditEvent {
  id: string
  timestamp: number
  eventType: 'action_proposed' | 'action_approved' | 'action_blocked' | 'action_executed' | 'risk_detected' | 'review_completed'
  description: string
  operator: string
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  traceable: boolean
  relatedActions: string[]
}

export interface RuntimeAuditMetrics {
  auditEventCount: number
  traceCoverage: number
  riskFlagCount: number
  operatorReviewCount: number
  auditIntegrityScore: number
  healthScore: number
}

export interface RuntimeAudit {
  id: string
  version: string
  status: 'operational' | 'maintenance' | 'degraded'
  events: AuditEvent[]
  metrics: RuntimeAuditMetrics
  lastSync: number
}
