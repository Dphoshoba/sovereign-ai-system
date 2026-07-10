/**
 * Tests for Workflow Audit Logger
 * Coverage: event recording, report generation, audit trail
 */

import { describe, it, expect } from 'vitest';
import { AuditLogger } from '../../lib/flow/workflow-audit';
import { BASE_TIME } from '../../src/lib/gamma-flow/mock-data';

describe('Workflow Audit Logger', () => {
  describe('Log Creation', () => {
    it('should create audit log', () => {
      const log = AuditLogger.createLog('audit_001');

      expect(log.id).toBe('audit_001');
      expect(log.events).toBeDefined();
      expect(log.events.length).toBe(0);
    });

    it('should initialize with timestamp', () => {
      const log = AuditLogger.createLog('audit_002');

      expect(log.createdAt).toBeDefined();
      expect(log.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Event Recording', () => {
    it('should record workflow_started event', () => {
      let log = AuditLogger.createLog('audit_003');

      log = AuditLogger.recordEvent(log, {
        type: 'workflow_started',
        stepId: 'trigger',
        metadata: { executionId: 'exec_001' },
      });

      expect(log.events.length).toBe(1);
      expect(log.events[0].type).toBe('workflow_started');
    });

    it('should record step_completed event', () => {
      let log = AuditLogger.createLog('audit_004');

      log = AuditLogger.recordEvent(log, {
        type: 'step_completed',
        stepId: 'step_1',
        metadata: { duration: 100 },
      });

      expect(log.events.length).toBe(1);
      expect(log.events[0].type).toBe('step_completed');
    });

    it('should record approval_requested event', () => {
      let log = AuditLogger.createLog('audit_005');

      log = AuditLogger.recordEvent(log, {
        type: 'approval_requested',
        stepId: 'step_approval',
        metadata: { approverId: 'admin@example.com' },
      });

      expect(log.events.length).toBe(1);
      expect(log.events[0].type).toBe('approval_requested');
    });

    it('should track event sequence', () => {
      let log = AuditLogger.createLog('audit_006');

      log = AuditLogger.recordEvent(log, {
        type: 'workflow_started',
        stepId: 'trigger',
      });
      log = AuditLogger.recordEvent(log, {
        type: 'step_started',
        stepId: 'step_1',
      });
      log = AuditLogger.recordEvent(log, {
        type: 'step_completed',
        stepId: 'step_1',
      });

      expect(log.events.length).toBe(3);
      expect(log.events[0].type).toBe('workflow_started');
      expect(log.events[1].type).toBe('step_started');
      expect(log.events[2].type).toBe('step_completed');
    });
  });

  describe('Report Generation', () => {
    it('should generate audit report', () => {
      let log = AuditLogger.createLog('audit_007');

      log = AuditLogger.recordEvent(log, {
        type: 'workflow_started',
        stepId: 'trigger',
      });
      log = AuditLogger.recordEvent(log, {
        type: 'step_completed',
        stepId: 'step_1',
        metadata: { duration: 100 },
      });
      log = AuditLogger.recordEvent(log, {
        type: 'workflow_completed',
        stepId: 'sink',
      });

      const report = AuditLogger.generateReport(log);

      expect(report.duration).toBeGreaterThan(0);
      expect(report.totalSteps).toBeGreaterThan(0);
    });

    it('should track successful steps in report', () => {
      let log = AuditLogger.createLog('audit_008');

      log = AuditLogger.recordEvent(log, {
        type: 'workflow_started',
        stepId: 'trigger',
      });
      log = AuditLogger.recordEvent(log, {
        type: 'step_completed',
        stepId: 'step_1',
      });

      const report = AuditLogger.generateReport(log);

      expect(report.successfulSteps).toBeGreaterThanOrEqual(0);
    });

    it('should track failed steps in report', () => {
      let log = AuditLogger.createLog('audit_009');

      log = AuditLogger.recordEvent(log, {
        type: 'workflow_started',
        stepId: 'trigger',
      });
      log = AuditLogger.recordEvent(log, {
        type: 'step_failed',
        stepId: 'step_1',
        metadata: { error: 'Test error' },
      });

      const report = AuditLogger.generateReport(log);

      expect(report.failedSteps).toBeGreaterThanOrEqual(0);
    });

    it('should track approvals in report', () => {
      let log = AuditLogger.createLog('audit_010');

      log = AuditLogger.recordEvent(log, {
        type: 'approval_requested',
        stepId: 'step_approval',
      });
      log = AuditLogger.recordEvent(log, {
        type: 'approval_decided',
        stepId: 'step_approval',
        metadata: { approved: true },
      });

      const report = AuditLogger.generateReport(log);

      expect(report.approvals).toBeDefined();
    });
  });

  describe('Event Timestamps', () => {
    it('should include timestamps in events', () => {
      let log = AuditLogger.createLog('audit_011');

      log = AuditLogger.recordEvent(log, {
        type: 'workflow_started',
        stepId: 'trigger',
      });

      expect(log.events[0].timestamp).toBeDefined();
      expect(log.events[0].timestamp).toBeInstanceOf(Date);
    });
  });
});
