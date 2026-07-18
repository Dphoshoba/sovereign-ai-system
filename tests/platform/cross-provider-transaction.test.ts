import { describe, it, expect, beforeEach } from 'vitest';
import { TransactionCoordinatorImpl, TransactionCoordinatorError } from '../../lib/platform/execution/cross-provider-transaction-impl';

describe('TransactionCoordinatorImpl', () => {
  let coordinator: TransactionCoordinatorImpl;

  beforeEach(() => {
    coordinator = new TransactionCoordinatorImpl();
  });

  describe('create', () => {
    it('creates a PENDING transaction with given steps', () => {
      const tx = coordinator.create([
        { stepIndex: 0, providerId: 'google-calendar', operation: 'events.get', input: { eventId: '1' }, dependsOn: [] },
        { stepIndex: 1, providerId: 'google-calendar', operation: 'events.get', input: { eventId: '2' }, dependsOn: [] },
      ]);
      expect(tx.state).toBe('PENDING');
      expect(tx.steps).toHaveLength(2);
      expect(tx.transactionId).toBeDefined();
      expect(tx.correlationId).toBeDefined();
      expect(tx.createdAt).toBeDefined();
      expect(tx.completedAt).toBeNull();
    });

    it('assigns sequential transaction IDs', () => {
      const a = coordinator.create([{ stepIndex: 0, providerId: 'p1', operation: 'read', input: {}, dependsOn: [] }]);
      const b = coordinator.create([{ stepIndex: 0, providerId: 'p1', operation: 'read', input: {}, dependsOn: [] }]);
      expect(a.transactionId).not.toBe(b.transactionId);
    });

    it('throws for empty steps', () => {
      expect(() => coordinator.create([])).toThrow(TransactionCoordinatorError);
      expect(() => coordinator.create([])).toThrow('at least one step');
    });

    it('throws for duplicate step indices', () => {
      expect(() => coordinator.create([
        { stepIndex: 0, providerId: 'p1', operation: 'read', input: {}, dependsOn: [] },
        { stepIndex: 0, providerId: 'p1', operation: 'read', input: {}, dependsOn: [] },
      ])).toThrow(TransactionCoordinatorError);
    });
  });

  describe('start', () => {
    it('transitions to ACTIVE', () => {
      const tx = coordinator.create([{ stepIndex: 0, providerId: 'p1', operation: 'read', input: {}, dependsOn: [] }]);
      const started = coordinator.start(tx.transactionId);
      expect(started.state).toBe('ACTIVE');
    });

    it('throws if already started', () => {
      const tx = coordinator.create([{ stepIndex: 0, providerId: 'p1', operation: 'read', input: {}, dependsOn: [] }]);
      coordinator.start(tx.transactionId);
      expect(() => coordinator.start(tx.transactionId)).toThrow(TransactionCoordinatorError);
    });

    it('throws for unknown transaction', () => {
      expect(() => coordinator.start('unknown')).toThrow(TransactionCoordinatorError);
    });
  });

  describe('completeStep', () => {
    it('marks a step as COMPLETED', () => {
      const tx = coordinator.create([{ stepIndex: 0, providerId: 'p1', operation: 'read', input: {}, dependsOn: [] }]);
      coordinator.start(tx.transactionId);
      const updated = coordinator.completeStep(tx.transactionId, 0, { data: 'result' });
      expect(updated.stepResults[0].state).toBe('COMPLETED');
      expect(updated.stepResults[0].result).toEqual({ data: 'result' });
    });

    it('transitions to COMMITTED when all steps complete', () => {
      const tx = coordinator.create([
        { stepIndex: 0, providerId: 'p1', operation: 'read', input: {}, dependsOn: [] },
        { stepIndex: 1, providerId: 'p2', operation: 'write', input: {}, dependsOn: [0] },
      ]);
      coordinator.start(tx.transactionId);
      coordinator.completeStep(tx.transactionId, 0, {});
      const updated = coordinator.completeStep(tx.transactionId, 1, {});
      expect(updated.state).toBe('COMMITTED');
      expect(updated.completedAt).toBeDefined();
    });

    it('enforces dependency ordering', () => {
      const tx = coordinator.create([
        { stepIndex: 0, providerId: 'p1', operation: 'read', input: {}, dependsOn: [] },
        { stepIndex: 1, providerId: 'p2', operation: 'write', input: {}, dependsOn: [0] },
      ]);
      coordinator.start(tx.transactionId);
      expect(() => coordinator.completeStep(tx.transactionId, 1, {})).toThrow(TransactionCoordinatorError);
      expect(() => coordinator.completeStep(tx.transactionId, 1, {})).toThrow('depends on step 0');
    });

    it('throws for unknown step index', () => {
      const tx = coordinator.create([{ stepIndex: 0, providerId: 'p1', operation: 'read', input: {}, dependsOn: [] }]);
      coordinator.start(tx.transactionId);
      expect(() => coordinator.completeStep(tx.transactionId, 99, {})).toThrow(TransactionCoordinatorError);
    });
  });

  describe('failStep', () => {
    it('marks a step as FAILED', () => {
      const tx = coordinator.create([{ stepIndex: 0, providerId: 'p1', operation: 'read', input: {}, dependsOn: [] }]);
      coordinator.start(tx.transactionId);
      const updated = coordinator.failStep(tx.transactionId, 0, 'Something went wrong');
      expect(updated.stepResults[0].state).toBe('FAILED');
      expect(updated.stepResults[0].error).toBe('Something went wrong');
    });

    it('transitions to ABORTED when no steps completed', () => {
      const tx = coordinator.create([{ stepIndex: 0, providerId: 'p1', operation: 'read', input: {}, dependsOn: [] }]);
      coordinator.start(tx.transactionId);
      const updated = coordinator.failStep(tx.transactionId, 0, 'Error');
      expect(updated.state).toBe('ABORTED');
    });

    it('transitions to PARTIAL when some steps completed', () => {
      const tx = coordinator.create([
        { stepIndex: 0, providerId: 'p1', operation: 'read', input: {}, dependsOn: [] },
        { stepIndex: 1, providerId: 'p2', operation: 'write', input: {}, dependsOn: [] },
      ]);
      coordinator.start(tx.transactionId);
      coordinator.completeStep(tx.transactionId, 0, {});
      const updated = coordinator.failStep(tx.transactionId, 1, 'Error');
      expect(updated.state).toBe('PARTIAL');
    });

    it('throws for unknown step index', () => {
      const tx = coordinator.create([{ stepIndex: 0, providerId: 'p1', operation: 'read', input: {}, dependsOn: [] }]);
      coordinator.start(tx.transactionId);
      expect(() => coordinator.failStep(tx.transactionId, 99, '')).toThrow(TransactionCoordinatorError);
    });
  });

  describe('getState and getTransaction', () => {
    it('returns undefined for unknown transaction', () => {
      expect(coordinator.getState('unknown')).toBeUndefined();
      expect(coordinator.getTransaction('unknown')).toBeUndefined();
    });

    it('returns state for known transaction', () => {
      const tx = coordinator.create([{ stepIndex: 0, providerId: 'p1', operation: 'read', input: {}, dependsOn: [] }]);
      expect(coordinator.getState(tx.transactionId)).toBe('PENDING');
    });

    it('returns full transaction object', () => {
      const tx = coordinator.create([{ stepIndex: 0, providerId: 'p1', operation: 'read', input: {}, dependsOn: [] }]);
      const fetched = coordinator.getTransaction(tx.transactionId);
      expect(fetched).toBeDefined();
      expect(fetched!.transactionId).toBe(tx.transactionId);
    });
  });

  describe('lifecycle flow', () => {
    it('full successful transaction: PENDING → ACTIVE → COMMITTED', () => {
      const tx = coordinator.create([
        { stepIndex: 0, providerId: 'google-calendar', operation: 'events.get', input: { id: '1' }, dependsOn: [] },
        { stepIndex: 1, providerId: 'google-calendar', operation: 'events.get', input: { id: '2' }, dependsOn: [] },
      ]);
      expect(tx.state).toBe('PENDING');
      const active = coordinator.start(tx.transactionId);
      expect(active.state).toBe('ACTIVE');
      const s1 = coordinator.completeStep(tx.transactionId, 0, { id: '1' });
      expect(s1.state).toBe('ACTIVE');
      const s2 = coordinator.completeStep(tx.transactionId, 1, { id: '2' });
      expect(s2.state).toBe('COMMITTED');
      expect(s2.completedAt).toBeDefined();
    });

    it('failed transaction: PENDING → ACTIVE → PARTIAL', () => {
      const tx = coordinator.create([
        { stepIndex: 0, providerId: 'p1', operation: 'read', input: {}, dependsOn: [] },
        { stepIndex: 1, providerId: 'p2', operation: 'write', input: {}, dependsOn: [] },
      ]);
      coordinator.start(tx.transactionId);
      coordinator.completeStep(tx.transactionId, 0, {});
      const failed = coordinator.failStep(tx.transactionId, 1, 'Error');
      expect(failed.state).toBe('PARTIAL');
      expect(failed.completedAt).toBeDefined();
    });

    it('multi-provider transaction with dependency chain', () => {
      const tx = coordinator.create([
        { stepIndex: 0, providerId: 'google-calendar', operation: 'events.get', input: { id: '1' }, dependsOn: [] },
        { stepIndex: 1, providerId: 'google-calendar', operation: 'events.get', input: { id: '2' }, dependsOn: [0] },
        { stepIndex: 2, providerId: 'google-drive', operation: 'files.get', input: { id: '3' }, dependsOn: [0, 1] },
      ]);
      coordinator.start(tx.transactionId);
      coordinator.completeStep(tx.transactionId, 0, { id: '1' });
      coordinator.completeStep(tx.transactionId, 1, { id: '2' });
      const done = coordinator.completeStep(tx.transactionId, 2, { id: '3' });
      expect(done.state).toBe('COMMITTED');
    });
  });
});
