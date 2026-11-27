import { RuntimeAudit, AuditEvent } from './types'

const FIXED_TIMESTAMP = 1751990400000

const events: AuditEvent[] = [
  {
    id: 'evt-001',
    timestamp: FIXED_TIMESTAMP,
    eventType: 'action_proposed',
    description: 'Email draft proposed for executive team',
    operator: 'system-agent-001',
    riskLevel: 'critical',
    traceable: true,
    relatedActions: ['act-003'],
  },
  {
    id: 'evt-002',
    timestamp: FIXED_TIMESTAMP + 3600,
    eventType: 'action_approved',
    description: 'Email draft approved by reviewer',
    operator: 'human-reviewer-001',
    riskLevel: 'critical',
    traceable: true,
    relatedActions: ['evt-001'],
  },
  {
    id: 'evt-003',
    timestamp: FIXED_TIMESTAMP + 7200,
    eventType: 'action_blocked',
    description: 'Calendar block rejected - time conflict detected',
    operator: 'system-validator',
    riskLevel: 'high',
    traceable: true,
    relatedActions: ['act-005'],
  },
  {
    id: 'evt-004',
    timestamp: FIXED_TIMESTAMP + 10800,
    eventType: 'risk_detected',
    description: 'Social post flagged for brand compliance review',
    operator: 'compliance-checker',
    riskLevel: 'medium',
    traceable: true,
    relatedActions: ['act-004'],
  },
  {
    id: 'evt-005',
    timestamp: FIXED_TIMESTAMP + 14400,
    eventType: 'review_completed',
    description: 'Document creation workflow completed audit',
    operator: 'audit-agent',
    riskLevel: 'high',
    traceable: true,
    relatedActions: ['app-005'],
  },
  {
    id: 'evt-006',
    timestamp: FIXED_TIMESTAMP + 18000,
    eventType: 'action_proposed',
    description: 'Report generation initiated',
    operator: 'system-agent-002',
    riskLevel: 'low',
    traceable: true,
    relatedActions: ['act-007'],
  },
  {
    id: 'evt-007',
    timestamp: FIXED_TIMESTAMP + 21600,
    eventType: 'action_approved',
    description: 'Task assignment approved',
    operator: 'human-manager-001',
    riskLevel: 'low',
    traceable: true,
    relatedActions: ['act-006'],
  },
  {
    id: 'evt-008',
    timestamp: FIXED_TIMESTAMP + 25200,
    eventType: 'risk_detected',
    description: 'Plan synthesis flagged - requires legal review',
    operator: 'risk-detector',
    riskLevel: 'critical',
    traceable: true,
    relatedActions: ['app-002'],
  },
]

export const getRuntimeAuditMockData = (): RuntimeAudit => {
  const riskFlags = events.filter(e => e.eventType === 'risk_detected').length
  const reviews = events.filter(e => e.eventType === 'review_completed').length

  return {
    id: 'runtime-audit-001',
    version: '1.0.0',
    status: 'operational',
    events,
    metrics: {
      auditEventCount: events.length,
      traceCoverage: 100,
      riskFlagCount: riskFlags,
      operatorReviewCount: reviews,
      auditIntegrityScore: 96,
      healthScore: 94,
    },
    lastSync: FIXED_TIMESTAMP,
  }
}
