/**
 * Audit Integrity Checks (compliance projection)
 *
 * Build 138: deterministic integrity validation.
 */

import type { ComplianceAuditEvent, GmailComplianceReport } from '../../../src/lib/gmail-compliance/types';

export class GmailComplianceIntegrity {
  /**
   * Integrity score primarily used by UI/testing.
   * Deterministic: no Date.now/Math.random.
   */
  public computeIntegrity(events: ComplianceAuditEvent[]): {
    valid: boolean;
    score: number;
    issues: string[];
    riskFlags: string[];
  } {
    const issues: string[] = [];
    const riskFlags: string[] = [];

    if (!events.length) {
      return { valid: false, score: 0, issues: ['No events'], riskFlags: ['empty_event_set'] };
    }

    // Immutable + chronological
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (!e.immutable) {
        issues.push(`Event ${e.id} not immutable`);
        riskFlags.push('non_immutable_event');
      }
      if (!(e.timestamp instanceof Date) || Number.isNaN(e.timestamp.getTime())) {
        issues.push(`Invalid timestamp for ${e.id}`);
        riskFlags.push('invalid_timestamp');
      }
      if (i > 0 && e.timestamp.getTime() < events[i - 1].timestamp.getTime()) {
        issues.push('Non-monotonic timestamps');
        riskFlags.push('non_monotonic_timestamps');
        break;
      }

      // Details safety: keys should not look like tokens/refresh secrets
      const keys = Object.keys(e.details || {});
      if (keys.some(k => /token|secret|access|refresh/i.test(k))) {
        // This is a projection-level integrity heuristic.
        issues.push(`Forbidden details keys in ${e.id}`);
        riskFlags.push('token_exposure_risk');
      }
    }

    const penalty = clamp(issues.length * 7, 0, 60);
    const score = clamp(100 - penalty, 0, 100);

    return {
      valid: issues.length === 0,
      score,
      issues,
      riskFlags: unique(riskFlags),
    };
  }

  /**
   * Verify integrity and attach to report shape.
   */
  public attachToReport(report: GmailComplianceReport, result: ReturnType<GmailComplianceIntegrity['computeIntegrity']>) {
    // mutation for convenience; UI/tests rely on structure.
    report.integrity = {
      valid: result.valid,
      issues: result.issues,
      riskFlags: result.riskFlags,
    };
    return report;
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

