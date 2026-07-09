/**
 * Gmail Compliance Reader (GAMMA)
 *
 * Deterministic projection layer: given input correlationId/events,
 * returns compliance report + dashboard metrics.
 *
 * Build 138: compliance reader uses deterministic scoring/integrity.
 */

import type { ComplianceAuditEvent, GmailComplianceMetrics, GmailComplianceReport } from '../../src/lib/gmail-compliance/types';
import { GmailComplianceAudit } from '../connectors/gmail/compliance-audit';
import { GmailComplianceIntegrity } from '../connectors/gmail/audit-integrity';
import { GmailAuditExporter } from '../connectors/gmail/audit-exporter';
import { buildComplianceEventsForCorrelation, buildComplianceMetrics, buildComplianceReport } from '../../src/lib/gmail-compliance/mock-data';

export class GmailComplianceReader {
  private audit: GmailComplianceAudit;
  private integrity: GmailComplianceIntegrity;
  private exporter: GmailAuditExporter;

  // For deterministic testing, store by correlationId.
  private reports: Map<string, GmailComplianceReport> = new Map();

  constructor() {
    this.audit = new GmailComplianceAudit();
    this.integrity = new GmailComplianceIntegrity();
    this.exporter = new GmailAuditExporter();
  }

  /**
   * Build a report from events (deterministic; no Date.now/Math.random).
   */
  public buildReportFromEvents(params: {
    correlationId: string;
    operator: string;
    events: ComplianceAuditEvent[];
    generatedAt: Date;
  }): GmailComplianceReport {
    const report = this.audit.generateReport({
      correlationId: params.correlationId,
      operator: params.operator,
      events: params.events,
      generatedAt: params.generatedAt,
    });

    const integrityResult = this.integrity.computeIntegrity(params.events);
    // Update report.integrity deterministically.
    report.integrity = {
      valid: integrityResult.valid,
      issues: integrityResult.issues,
      riskFlags: integrityResult.riskFlags,
    };

    this.reports.set(report.correlationId, report);
    return report;
  }

  /**
   * Deterministic default report generator using fixed mock data.
   */
  public getReportById(correlationId: string): GmailComplianceReport {
    const existing = this.reports.get(correlationId);
    if (existing) return existing;

    // Use deterministic mock data
    const events = buildComplianceEventsForCorrelation(correlationId);
    const report = buildComplianceReport(correlationId);

    // Ensure integrity is consistent with actual validator
    report.integrity = this.integrity.computeIntegrity(events);

    this.reports.set(correlationId, report);
    return report;
  }

  public getMetrics(correlationId: string): GmailComplianceMetrics {
    return this.getReportById(correlationId).metrics;
  }

  public getAuditEventTimeline(correlationId: string): ComplianceAuditEvent[] {
    return this.getReportById(correlationId).events;
  }

  public exportReport(correlationId: string): ReturnType<GmailAuditExporter['exportReport']> {
    return this.exporter.exportReport(this.getReportById(correlationId));
  }

  public exportEvents(correlationId: string): ReturnType<GmailAuditExporter['exportEvents']> {
    return this.exporter.exportEvents(this.getAuditEventTimeline(correlationId));
  }

  public clear(): void {
    this.reports.clear();
  }
}

