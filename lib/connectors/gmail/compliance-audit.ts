/**
 * Gmail Compliance Audit
 *
 * Build 138: map/validate/score compliance events derived from execution lifecycle.
 */

import type {
  ComplianceAuditEvent,
  GmailComplianceEventType,
  GmailComplianceMetrics,
  GmailComplianceReport,
} from '../../../src/lib/gmail-compliance/types';
import { GMAIL_COMPLIANCE_REQUIRED_EVENT_TYPES } from '../../../src/lib/gmail-compliance/types';

export class GmailComplianceAudit {
  /**
   * Validate compliance events (schema + required coverage + safety: no secrets)
   */
  public validateEvents(events: ComplianceAuditEvent[]): {
    valid: boolean;
    issues: string[];
    riskFlags: string[];
  } {
    const issues: string[] = [];
    const riskFlags: string[] = [];

    if (!Array.isArray(events) || events.length === 0) {
      return { valid: false, issues: ['No compliance events provided'], riskFlags };
    }

    // 1) Required coverage
    for (const required of GMAIL_COMPLIANCE_REQUIRED_EVENT_TYPES) {
      if (!events.some(e => e.eventType === required)) {
        issues.push(`Missing required event: ${required}`);
        riskFlags.push('missing_required_event');
      }
    }

    // 2) Append-only / immutable + timestamp monotonic
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (!e.immutable) {
        issues.push(`Event ${e.id} is not immutable`);
        riskFlags.push('non_immutable_event');
      }
      if (!(e.timestamp instanceof Date) || Number.isNaN(e.timestamp.getTime())) {
        issues.push(`Invalid timestamp for event ${e.id}`);
      }
      if (i > 0 && e.timestamp.getTime() < events[i - 1].timestamp.getTime()) {
        issues.push('Events are not in chronological order');
        riskFlags.push('non_monotonic_timestamps');
        break;
      }
    }

    // 3) Token/secret safety: fail if details include obvious token-like keys.
    // NOTE: exporter performs final sanitization.
    for (const e of events) {
      const keys = Object.keys(e.details || {});
      // Only treat values as sensitive when they look like real credentials/token-like *values*.
      // Keys alone can be legitimate (e.g. `refreshSucceeded`).
      const suspicious = keys.filter(k => /token|secret|refresh|access/i.test(k) && /token|ya29\.|access_token|refresh_token|bearer/i.test(String(e.details?.[k] ?? '')));

      if (suspicious.length > 0) {
        issues.push(`Event ${e.id} details contain forbidden keys: ${suspicious.join(',')}`);
        riskFlags.push('token_exposure_risk');
      }

      for (const [k, v] of Object.entries(e.details || {})) {
        if (typeof v === 'string' && /ya29\.|access_token|refresh_token|bearer/i.test(v)) {
          issues.push(`Event ${e.id} details may contain token value for key ${k}`);
          riskFlags.push('token_value_exposure_risk');
        }
      }
    }

    return { valid: issues.length === 0, issues, riskFlags: unique(riskFlags) };
  }

  /**
   * Produce compliance report + scores.
   */
  public generateReport(params: {
    correlationId: string;
    operator: string;
    events: ComplianceAuditEvent[];
    generatedAt: Date;
  }): GmailComplianceReport {
    const { correlationId, operator, events, generatedAt } = params;

    const validation = this.validateEvents(events);
    const coverageByEventType = GMAIL_COMPLIANCE_REQUIRED_EVENT_TYPES.reduce((acc, t) => {
      acc[t as GmailComplianceEventType] = events.some(e => e.eventType === t);
      return acc;
    }, {} as Record<GmailComplianceEventType, boolean>);

    const auditEventCount = events.length;
    const auditCoverage =
      (GMAIL_COMPLIANCE_REQUIRED_EVENT_TYPES.filter(t => coverageByEventType[t]).length /
        GMAIL_COMPLIANCE_REQUIRED_EVENT_TYPES.length) *
      100;

    const integrityScore = clamp(Math.round(validation.valid ? 99 : 70), 0, 100);

    const riskFlagCount = validation.riskFlags.length;
    const riskPenalty = clamp(riskFlagCount * 6, 0, 60);

    const complianceScore = clamp(
      Math.round(auditCoverage * 0.55 + integrityScore * 0.45 - riskPenalty),
      0,
      100
    );

    const exportReadyCount = validation.valid ? 1 : 0;

    const healthScore = clamp(Math.round(complianceScore * 0.9 + (validation.valid ? 10 : 0)), 0, 100);

    const metrics: GmailComplianceMetrics = {
      auditEventCount,
      auditCoverage: Math.round(auditCoverage),
      integrityScore,
      complianceScore,
      exportReadyCount,
      riskFlagCount,
      healthScore,
    };

    return {
      id: `report_${correlationId}`,
      correlationId,
      generatedAt,
      metrics,
      coverageByEventType,
      events: [...events],
      integrity: {
        valid: validation.valid,
        issues: validation.issues,
        riskFlags: validation.riskFlags,
      },
    };
  }
}

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

