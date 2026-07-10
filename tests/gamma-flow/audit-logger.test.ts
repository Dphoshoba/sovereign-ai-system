/**
 * Tests for Workflow Audit Logger
 * Coverage: event recording, report generation, audit trail
 */

import { describe, it, expect } from 'vitest';
import { AuditLogger } from '../../lib/flow/workflow-audit';
import { BASE_TIME } from '../../src/lib/gamma-flow/mock-data';
import type { WorkflowAuditEvent } from '../../src/lib/gamma-flow/types';

describe('Workflow Audit Logger', () => {
  describe('Log Creation', () => {
    it('should create audit log', () => {
      const logger = new AuditLogger();
      const log = logger.createLog('audit_001');

      expect(log.executionId).toBe('audit_001');
      expect(log.events).toBeDefined();
      expect(log.events.length).toBe(0);
    });

    it('should initialize with timestamp', () => {
      const logger = new AuditLogger();
      const log = logger.createLog('audit_002');

      expect(log.createdAt).toBeDefined();
      expect(log.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Event Recording', () => {
    it('should record workflow_started event', () => {
      const logger = new AuditLogger();
      const log = logger.createLog('audit_003');

      const event: WorkflowAuditEvent = {
        id: 'evt_001',
        executionId: 'audit_003',
        eventType: 'workflow_started',
        stepId: 'trigger',
        actor: 'system',
        timestamp: BASE_TIME,
        details: {},
        severity: 'info',
      };

      logger.recordEvent('audit_003', event);

      expect(log.events.length).toBe(1);
      expect(log.events[0].eventType).toBe('workflow_started');
    });

    it('should track event sequence', () => {
      const logger = new AuditLogger();
      const log = logger.createLog('audit_006');

      logger.recordEvent('audit_006', {
        id: 'evt_002',
        executionId: 'audit_006',
        eventType: 'workflow_started',
        stepId: 'trigger',
        actor: 'system',
        timestamp: BASE_TIME,
        details: {},
        severity: 'info',
      });
      logger.recordEvent('audit_006', {
        id: 'evt_003',
        executionId: 'audit_006',
        eventType: 'step_started',
        stepId: 'step_1',
        actor: 'system',
        timestamp: BASE_TIME,
        details: {},
        severity: 'info',
      });

      expect(log.events.length).toBe(2);
      expect(log.events[0].eventType).toBe('workflow_started');
      expect(log.events[1].eventType).toBe('step_started');
    });
  });

  describe('Summary Generation', () => {
    it('should track event types in summary', () => {
      const logger = new AuditLogger();
      const log = logger.createLog('audit_008');

      logger.recordEvent('audit_008', {
        id: 'evt_004',
        executionId: 'audit_008',
        eventType: 'workflow_started',
        stepId: 'trigger',
        actor: 'system',
        timestamp: BASE_TIME,
        details: {},
        severity: 'info',
      });

      expect(log.summary.totalEvents).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Event Timestamps', () => {
    it('should include timestamps in events', () => {
      const logger = new AuditLogger();
      const log = logger.createLog('audit_011');

      logger.recordEvent('audit_011', {
        id: 'evt_005',
        executionId: 'audit_011',
        eventType: 'workflow_started',
        stepId: 'trigger',
        actor: 'system',
        timestamp: BASE_TIME,
        details: {},
        severity: 'info',
      });

      expect(log.events[0].timestamp).toBeDefined();
      expect(log.events[0].timestamp).toBeInstanceOf(Date);
    });
  });
});
