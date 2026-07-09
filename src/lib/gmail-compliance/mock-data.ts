import type {
  ComplianceAuditEvent,
  GmailComplianceEventType,
  GmailComplianceMetrics,
  GmailComplianceReport,
} from './types';
import {
  GMAIL_COMPLIANCE_REQUIRED_EVENT_TYPES,
} from './types';

/**
 * Deterministic timestamp helper for tests/readers.
 * DO NOT use Date.now()/Math.random().
 */
function ts(iso: string): Date {
  return new Date(iso);
}

const FIXED_BASE = '2026-07-01T10:00:00.000Z';

function addSeconds(base: string, seconds: number): Date {
  const d = new Date(base);
  d.setUTCSeconds(d.getUTCSeconds() + seconds);
  return d;
}

export const operator = 'compliance_operator_test';

export function buildComplianceEventsForCorrelation(correlationId: string): ComplianceAuditEvent[] {
  // Correlation ordering is chronological by design.
  const map: Array<[GmailComplianceEventType, number]> = [
    ['oauth_connected', 0],
    ['token_refreshed', 5],
    ['message_read', 10],
    ['draft_composed', 15],
    ['draft_previewed', 20],
    ['draft_approved', 25],
    ['draft_queued', 30],
    ['execution_started', 35],
    ['execution_failed', 40],
    ['execution_retried', 45],
    ['dead_lettered', 50],
    ['duplicate_blocked', 55],
  ];

  return map.map(([eventType, offsetSeconds], idx) => {
    const id = `ce_${correlationId}_${idx + 1}`;
    const timestamp = addSeconds(FIXED_BASE, offsetSeconds);
    const category = categoryFor(eventType);

    return {
      id,
      correlationId,
      executionId: correlationId,
      queuedId: correlationId,
      draftId: correlationId,
      previewId: correlationId,
      approvalId: correlationId,
      operator,
      eventType,
      category,
      timestamp,
      immutable: true,
      details: safeDetailsFor(eventType),
    };
  });
}

export function buildComplianceMetrics(params?: {
  auditEventCount?: number;
  auditCoverage?: number;
  integrityScore?: number;
  complianceScore?: number;
  exportReadyCount?: number;
  riskFlagCount?: number;
  healthScore?: number;
}): GmailComplianceMetrics {
  return {
    auditEventCount: params?.auditEventCount ?? 12,
    auditCoverage: params?.auditCoverage ?? 100,
    integrityScore: params?.integrityScore ?? 99,
    complianceScore: params?.complianceScore ?? 97,
    exportReadyCount: params?.exportReadyCount ?? 1,
    riskFlagCount: params?.riskFlagCount ?? 2,
    healthScore: params?.healthScore ?? 92,
  };
}

export function buildComplianceReport(correlationId: string): GmailComplianceReport {
  const events = buildComplianceEventsForCorrelation(correlationId);
  const metrics = buildComplianceMetrics();

  const coverageByEventType = GMAIL_COMPLIANCE_REQUIRED_EVENT_TYPES.reduce((acc, t) => {
    acc[t] = events.some(e => e.eventType === t);
    return acc;
  }, {} as Record<GmailComplianceEventType, boolean>);

  return {
    id: `report_${correlationId}`,
    correlationId,
    generatedAt: ts('2026-07-01T10:01:00.000Z'),
    metrics,
    coverageByEventType,
    events,
    integrity: {
      valid: true,
      issues: [],
      riskFlags: ['duplicate_detected', 'retry_failed_and_dlq'],
    },
  };
}

function categoryFor(eventType: GmailComplianceEventType): ComplianceAuditEvent['category'] {
  if (eventType.startsWith('oauth') || eventType.includes('token')) return 'oauth';
  if (eventType.includes('message')) return 'message';
  if (eventType.includes('draft_composed') || eventType.includes('draft')) return 'draft';
  if (eventType.includes('preview')) return 'preview';
  if (eventType.includes('approved')) return 'approval';
  if (eventType.includes('queued')) return 'queue';
  if (eventType.includes('execution')) return 'execution';
  if (eventType.includes('dead_lettered') || eventType.includes('duplicate')) return 'resilience';
  if (eventType.includes('duplicate_blocked')) return 'safety';
  return 'safety';
}

function safeDetailsFor(eventType: GmailComplianceEventType): Record<string, unknown> {
  // Ensure details contain no secrets/tokens.
  // These are governance flags only.
  switch (eventType) {
    case 'oauth_connected':
      return { provider: 'gmail', connected: true };
    case 'token_refreshed':
      return { refreshSucceeded: true, risk: 'low' };
    case 'message_read':
      return { messageCount: 3, redactionsApplied: true };
    case 'draft_composed':
      return { draftSize: 245_000, sanitizer: 'safe_preview' };
    case 'draft_previewed':
      return { previewExpiresDays: 7, riskLevel: 'medium' };
    case 'draft_approved':
      return { operator: 'operator_approved', approved: true };
    case 'draft_queued':
      return { queued: true, priority: 'normal' };
    case 'execution_started':
      return { attemptNumber: 1, mode: 'simulation' };
    case 'execution_failed':
      return { errorClass: 'network_error', retriable: true };
    case 'execution_retried':
      return { attemptNumber: 2, scheduled: true };
    case 'dead_lettered':
      return { finalClass: 'unknown_failure', deadLettered: true };
    case 'duplicate_blocked':
      return { duplicateReason: 'idempotency_key_conflict', blocked: true };
    default:
      return { ok: true };
  }
}

