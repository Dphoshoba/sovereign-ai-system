/**
 * Gmail Audit Exporter
 *
 * Build 138: Export compliance events/reports with strict redaction.
 */

import type { ComplianceAuditEvent, GmailComplianceReport } from '../../../src/lib/gmail-compliance/types';

export class GmailAuditExporter {
  /**
   * Redact/sanitize a details payload before export.
   * Deterministic: pure function.
   */
  public sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(details || {})) {
      if (/token|secret|refresh|access|credential/i.test(k)) {
        out[k] = '[REDACTED]';
        continue;
      }
      if (typeof v === 'string' && /ya29\.|access_token|refresh_token|bearer/i.test(v)) {
        out[k] = '[REDACTED]';
        continue;
      }
      out[k] = v;
    }

    return out;
  }

  public exportEvents(events: ComplianceAuditEvent[]): {
    exportedAt: string;
    eventCount: number;
    events: Array<{
      id: string;
      correlationId: string;
      eventType: string;
      operator: string;
      timestamp: string;
      immutable: true;
      category: string;
      details: Record<string, unknown>;
      executionId?: string;
      draftId?: string;
      previewId?: string;
      approvalId?: string;
      queuedId?: string;
    }>;
  } {
    return {
      exportedAt: new Date().toISOString(),
      eventCount: events.length,
      events: events.map(e => ({
        id: e.id,
        correlationId: e.correlationId,
        eventType: e.eventType,
        operator: e.operator,
        timestamp: e.timestamp.toISOString(),
        immutable: e.immutable,
        category: e.category,
        details: this.sanitizeDetails(e.details),
        executionId: e.executionId,
        queuedId: e.queuedId,
        draftId: e.draftId,
        previewId: e.previewId,
        approvalId: e.approvalId,
      })),
    };
  }

  public exportReport(report: GmailComplianceReport): {
    exportedAt: string;
    reportId: string;
    correlationId: string;
    metrics: GmailComplianceReport['metrics'];
    integrity: GmailComplianceReport['integrity'];
    coverageByEventType: GmailComplianceReport['coverageByEventType'];
    events: GmailComplianceReport['events'];
  } {
    return {
      exportedAt: new Date().toISOString(),
      reportId: report.id,
      correlationId: report.correlationId,
      metrics: report.metrics,
      integrity: report.integrity,
      coverageByEventType: report.coverageByEventType,
      events: report.events.map(e => ({
        ...e,
        details: this.sanitizeDetails(e.details),
      })),
    };
  }
}

