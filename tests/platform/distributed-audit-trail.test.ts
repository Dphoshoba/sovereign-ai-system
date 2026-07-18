import { describe, it, expect, beforeEach } from 'vitest';
import { DistributedAuditTrailImpl } from '../../lib/platform/execution/distributed-audit-trail-impl';
import { AuditEventInput } from '../../lib/platform/execution/distributed-audit-trail';

describe('DistributedAuditTrailImpl', () => {
  let trail: DistributedAuditTrailImpl;

  beforeEach(() => {
    trail = new DistributedAuditTrailImpl();
  });

  const baseInput: AuditEventInput = {
    transactionId: 'tx-1',
    correlationId: 'corr-tx-1',
    providerId: 'google-calendar',
    stepIndex: 0,
    action: 'events.get',
    detail: { eventId: '123' },
    eventType: 'STEP_COMPLETED',
  };

  describe('record', () => {
    it('creates an AuditEvent with generated id and timestamp', () => {
      const event = trail.record(baseInput);
      expect(event.eventId).toBe('audit-1');
      expect(event.timestamp).toBeDefined();
      expect(event.transactionId).toBe('tx-1');
      expect(event.correlationId).toBe('corr-tx-1');
      expect(event.providerId).toBe('google-calendar');
      expect(event.stepIndex).toBe(0);
      expect(event.action).toBe('events.get');
      expect(event.eventType).toBe('STEP_COMPLETED');
      expect(event.detail).toEqual({ eventId: '123' });
    });

    it('assigns unique event IDs', () => {
      const a = trail.record(baseInput);
      const b = trail.record({ ...baseInput, transactionId: 'tx-2' });
      expect(a.eventId).toBeDefined();
      expect(b.eventId).toBeDefined();
      expect(a.eventId).not.toBe(b.eventId);
    });

    it('preserves all event types', () => {
      const types: AuditEventInput['eventType'][] = [
        'STEP_STARTED',
        'STEP_COMPLETED',
        'STEP_FAILED',
        'TRANSACTION_STARTED',
        'TRANSACTION_COMMITTED',
        'TRANSACTION_ABORTED',
        'COMPENSATION_EXECUTED',
        'COMPENSATION_FAILED',
      ];
      for (const eventType of types) {
        const event = trail.record({ ...baseInput, eventType });
        expect(event.eventType).toBe(eventType);
      }
    });
  });

  describe('getByTransactionId', () => {
    it('returns events for a specific transaction', () => {
      trail.record(baseInput);
      trail.record({ ...baseInput, stepIndex: 1 });
      trail.record({ ...baseInput, transactionId: 'tx-2' });
      const results = trail.getByTransactionId('tx-1');
      expect(results).toHaveLength(2);
      expect(results.every((e) => e.transactionId === 'tx-1')).toBe(true);
    });

    it('returns empty array for unknown transaction', () => {
      expect(trail.getByTransactionId('unknown')).toEqual([]);
    });
  });

  describe('getByCorrelationId', () => {
    it('returns events for a specific correlation', () => {
      trail.record(baseInput);
      trail.record({ ...baseInput, correlationId: 'corr-tx-2' });
      trail.record({ ...baseInput, correlationId: 'corr-tx-2' });
      const results = trail.getByCorrelationId('corr-tx-2');
      expect(results).toHaveLength(2);
      expect(results.every((e) => e.correlationId === 'corr-tx-2')).toBe(true);
    });
  });

  describe('getByProviderId', () => {
    it('returns events for a specific provider', () => {
      trail.record(baseInput);
      trail.record({ ...baseInput, providerId: 'google-drive', stepIndex: 1 });
      trail.record({ ...baseInput, providerId: 'google-drive', stepIndex: 2 });
      const results = trail.getByProviderId('google-drive');
      expect(results).toHaveLength(2);
      expect(results.every((e) => e.providerId === 'google-drive')).toBe(true);
    });
  });

  describe('getByEventType', () => {
    it('returns events of a specific type', () => {
      trail.record(baseInput);
      trail.record({ ...baseInput, eventType: 'STEP_FAILED', stepIndex: 0 });
      trail.record({ ...baseInput, eventType: 'STEP_FAILED', stepIndex: 1 });
      const results = trail.getByEventType('STEP_FAILED');
      expect(results).toHaveLength(2);
      expect(results.every((e) => e.eventType === 'STEP_FAILED')).toBe(true);
    });
  });

  describe('getByTimeRange', () => {
    it('returns events within time range', () => {
      const before = new Date(2020, 1, 1).toISOString();
      const now = new Date().toISOString();
      const after = new Date(2099, 1, 1).toISOString();

      trail.record(baseInput); // recorded now

      const inRange = trail.getByTimeRange(before, after);
      expect(inRange).toHaveLength(1);

      const noneBefore = trail.getByTimeRange(before, before);
      expect(noneBefore).toHaveLength(0);
    });
  });

  describe('multi-provider scenario', () => {
    it('records and queries a full cross-provider transaction audit trail', () => {
      const corrId = 'corr-full-tx';

      trail.record({ ...baseInput, correlationId: corrId, providerId: '__tx__', stepIndex: -1, eventType: 'TRANSACTION_STARTED', action: 'transaction.start' });
      trail.record({ ...baseInput, correlationId: corrId, providerId: 'google-calendar', stepIndex: 0, eventType: 'STEP_STARTED', action: 'events.get' });
      trail.record({ ...baseInput, correlationId: corrId, providerId: 'google-calendar', stepIndex: 0, eventType: 'STEP_COMPLETED', action: 'events.get' });
      trail.record({ ...baseInput, correlationId: corrId, providerId: 'google-drive', stepIndex: 1, eventType: 'STEP_STARTED', action: 'files.get' });
      trail.record({ ...baseInput, correlationId: corrId, providerId: 'google-drive', stepIndex: 1, eventType: 'STEP_COMPLETED', action: 'files.get' });
      trail.record({ ...baseInput, correlationId: corrId, providerId: '__tx__', stepIndex: -1, eventType: 'TRANSACTION_COMMITTED', action: 'transaction.commit' });

      expect(trail.getByCorrelationId(corrId)).toHaveLength(6);
      expect(trail.getByProviderId('google-calendar')).toHaveLength(2);
      expect(trail.getByProviderId('google-drive')).toHaveLength(2);
      expect(trail.getByEventType('STEP_COMPLETED')).toHaveLength(2);
      expect(trail.getByTransactionId('tx-1')).toHaveLength(6);
    });
  });
});
