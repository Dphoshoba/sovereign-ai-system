/**
 * Gmail Compliance (connector-agnostic governance projection)
 *
 * Build 138 adds a parallel compliance event model that maps from the execution
 * lifecycle (runtime audit log) into governance/certification events.
 */

export type ComplianceEventCategory =
  | 'oauth'
  | 'message'
  | 'draft'
  | 'preview'
  | 'approval'
  | 'queue'
  | 'execution'
  | 'resilience'
  | 'safety';

/**
 * Build 138 required event types.
 * Note: this is intentionally independent from `src/lib/gmail-execution/types.ts`.
 */
export type GmailComplianceEventType =
  | 'oauth_connected'
  | 'token_refreshed'
  | 'message_read'
  | 'draft_composed'
  | 'draft_previewed'
  | 'draft_approved'
  | 'draft_queued'
  | 'execution_started'
  | 'execution_failed'
  | 'execution_retried'
  | 'dead_lettered'
  | 'duplicate_blocked';

export interface ComplianceAuditEvent {
  id: string;
  correlationId: string; // executionId / queuedId / draftId aggregation key
  executionId?: string;
  queuedId?: string;
  draftId?: string;
  previewId?: string;
  approvalId?: string;
  operator: string;
  eventType: GmailComplianceEventType;
  category: ComplianceEventCategory;
  // Deterministic readers must accept timestamps from the caller.
  timestamp: Date;
  immutable: true;

  /**
   * Details must never contain secrets/tokens.
   * (Enforced by audit-integrity + exporter.)
   */
  details: Record<string, unknown>;
}

export interface GmailComplianceMetrics {
  auditEventCount: number;
  auditCoverage: number; // 0-100
  integrityScore: number; // 0-100
  complianceScore: number; // 0-100
  exportReadyCount: number;
  riskFlagCount: number;
  healthScore: number; // 0-100
}

export interface GmailComplianceReport {
  id: string;
  correlationId: string;
  generatedAt: Date;

  metrics: GmailComplianceMetrics;

  /**
   * For UI: coverage by required event types.
   */
  coverageByEventType: Record<GmailComplianceEventType, boolean>;

  /**
   * For UI/testing: chronological events.
   */
  events: ComplianceAuditEvent[];

  /**
   * Integrity findings.
   */
  integrity: {
    valid: boolean;
    issues: string[];
    riskFlags: string[];
  };
}

/**
 * Required coverage checklist for Build 138.
 */
export const GMAIL_COMPLIANCE_REQUIRED_EVENT_TYPES: GmailComplianceEventType[] = [
  'oauth_connected',
  'message_read',
  'draft_composed',
  'draft_previewed',
  'draft_approved',
  'draft_queued',
  'execution_started',
  'execution_failed',
  'execution_retried',
  'dead_lettered',
  'duplicate_blocked',
  'token_refreshed',
];

