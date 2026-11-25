import { describe, it, expect } from 'vitest';
import { SagaCompensatorImpl, SagaError } from '../../lib/platform/execution/saga-compensation-impl';
import { SagaPlan } from '../../lib/platform/execution/saga-compensation';

describe('SagaCompensatorImpl', () => {
  let compensator: SagaCompensatorImpl;

  beforeEach(() => {
    compensator = new SagaCompensatorImpl();
  });

  describe('planFrom', () => {
    it('creates a PLANNED saga with actions in reverse order', () => {
      const plan = compensator.planFrom('tx-1', [
        { stepIndex: 0, providerId: 'google-calendar', operation: 'events.create', result: { eventId: '123' } },
        { stepIndex: 1, providerId: 'google-drive', operation: 'files.create', result: { fileId: '456' } },
      ]);
      expect(plan.transactionId).toBe('tx-1');
      expect(plan.state).toBe('PLANNED');
      expect(plan.createdAt).toBeDefined();
      expect(plan.completedAt).toBeNull();
    });

    it('returns actions in reverse stepIndex order (last completed first)', () => {
      const plan = compensator.planFrom('tx-1', [
        { stepIndex: 0, providerId: 'p1', operation: 'create', result: { id: '1' } },
        { stepIndex: 1, providerId: 'p2', operation: 'create', result: { id: '2' } },
        { stepIndex: 2, providerId: 'p3', operation: 'create', result: { id: '3' } },
      ]);
      expect(plan.actions.map((a) => a.stepIndex)).toEqual([2, 1, 0]);
    });

    it('derives compensation operation from original', () => {
      const plan = compensator.planFrom('tx-1', [
        { stepIndex: 0, providerId: 'google-calendar', operation: 'events.create', result: { eventId: '123' } },
      ]);
      expect(plan.actions[0].operation).toBe('events.create-compensation');
      expect(plan.actions[0].providerId).toBe('google-calendar');
    });

    it('includes the original result as compensation input', () => {
      const plan = compensator.planFrom('tx-1', [
        { stepIndex: 0, providerId: 'p1', operation: 'create', result: { id: 'abc', name: 'test' } },
      ]);
      expect(plan.actions[0].input).toMatchObject({ id: 'abc', name: 'test' });
    });

    it('includes originalOperation in compensation input', () => {
      const plan = compensator.planFrom('tx-1', [
        { stepIndex: 0, providerId: 'p1', operation: 'events.create', result: { id: '1' } },
      ]);
      expect(plan.actions[0].input).toHaveProperty('originalOperation', 'events.create');
    });

    it('creates PLANNED results for every action', () => {
      const plan = compensator.planFrom('tx-1', [
        { stepIndex: 0, providerId: 'p1', operation: 'create', result: { id: '1' } },
        { stepIndex: 1, providerId: 'p2', operation: 'create', result: { id: '2' } },
        { stepIndex: 2, providerId: 'p3', operation: 'create', result: { id: '3' } },
      ]);
      expect(plan.stepResults).toHaveLength(3);
      expect(plan.stepResults.every((r) => r.state === 'PLANNED')).toBe(true);
      expect(plan.stepResults.every((r) => r.error === null)).toBe(true);
      expect(plan.stepResults.every((r) => r.completedAt === null)).toBe(true);
    });

    it('throws for empty completed steps', () => {
      expect(() => compensator.planFrom('tx-1', [])).toThrow(SagaError);
      expect(() => compensator.planFrom('tx-1', [])).toThrow('No completed steps');
    });

    it('handles single completed step', () => {
      const plan = compensator.planFrom('tx-1', [
        { stepIndex: 0, providerId: 'google-calendar', operation: 'events.delete', result: { eventId: '42' } },
      ]);
      expect(plan.actions).toHaveLength(1);
      expect(plan.actions[0].stepIndex).toBe(0);
      expect(plan.actions[0].operation).toBe('events.delete-compensation');
    });
  });

  describe('execute', () => {
    it('throws SagaError (async execution not supported)', () => {
      const plan: SagaPlan = {
        transactionId: 'tx-1',
        actions: [],
        stepResults: [],
        state: 'PLANNED',
        createdAt: new Date().toISOString(),
        completedAt: null,
      };
      expect(() =>
        compensator.execute(plan, async () => 'COMPENSATED'),
      ).toThrow(SagaError);
    });
  });

  describe('planFrom with diverse providers', () => {
    it('associates each action with its original provider', () => {
      const plan = compensator.planFrom('tx-1', [
        { stepIndex: 0, providerId: 'google-calendar', operation: 'events.create', result: {} },
        { stepIndex: 1, providerId: 'google-drive', operation: 'files.create', result: {} },
        { stepIndex: 2, providerId: 'slack', operation: 'messages.send', result: {} },
      ]);
      expect(plan.actions.map((a) => a.providerId)).toEqual(['slack', 'google-drive', 'google-calendar']);
    });

    it('preserves all action fields in correct reverse order', () => {
      const plan = compensator.planFrom('tx-1', [
        { stepIndex: 0, providerId: 'a', operation: 'op1', result: { x: 1 } },
        { stepIndex: 1, providerId: 'b', operation: 'op2', result: { y: 2 } },
        { stepIndex: 2, providerId: 'c', operation: 'op3', result: { z: 3 } },
      ]);
      expect(plan.actions).toEqual([
        { stepIndex: 2, providerId: 'c', operation: 'op3-compensation', input: { z: 3, originalOperation: 'op3' } },
        { stepIndex: 1, providerId: 'b', operation: 'op2-compensation', input: { y: 2, originalOperation: 'op2' } },
        { stepIndex: 0, providerId: 'a', operation: 'op1-compensation', input: { x: 1, originalOperation: 'op1' } },
      ]);
    });
  });

  describe('planFrom state validation', () => {
    it('allows non-sequential step indices', () => {
      const plan = compensator.planFrom('tx-1', [
        { stepIndex: 5, providerId: 'p1', operation: 'create', result: { id: '1' } },
        { stepIndex: 10, providerId: 'p2', operation: 'create', result: { id: '2' } },
      ]);
      expect(plan.actions.map((a) => a.stepIndex)).toEqual([10, 5]);
    });

    it('sets transactionId from parameter', () => {
      const plan = compensator.planFrom('tx-custom-123', [
        { stepIndex: 0, providerId: 'p1', operation: 'create', result: {} },
      ]);
      expect(plan.transactionId).toBe('tx-custom-123');
    });

    it('always returns a new plan object', () => {
      const completed = [
        { stepIndex: 0, providerId: 'p1', operation: 'create', result: { id: '1' } },
      ];
      const plan1 = compensator.planFrom('tx-1', completed);
      const plan2 = compensator.planFrom('tx-1', completed);
      expect(plan1).not.toBe(plan2);
      expect(plan1.actions).not.toBe(plan2.actions);
    });
  });
});
