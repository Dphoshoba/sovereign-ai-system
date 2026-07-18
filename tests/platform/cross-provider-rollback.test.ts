import { describe, it, expect, beforeEach } from 'vitest';
import { CrossProviderRollbackImpl, RollbackError } from '../../lib/platform/execution/cross-provider-rollback-impl';
import { CompensatorFn } from '../../lib/platform/execution/cross-provider-rollback';

describe('CrossProviderRollbackImpl', () => {
  let rollback: CrossProviderRollbackImpl;

  beforeEach(() => {
    rollback = new CrossProviderRollbackImpl();
  });

  describe('rollback', () => {
    it('returns FULLY_COMPENSATED when all compensations succeed', () => {
      const alwaysSucceed: CompensatorFn = () => 'COMPENSATED';
      const result = rollback.rollback(
        'tx-1',
        [
          { stepIndex: 0, providerId: 'google-calendar', operation: 'events.create', result: { eventId: '1' } },
          { stepIndex: 1, providerId: 'google-drive', operation: 'files.create', result: { fileId: '2' } },
        ],
        alwaysSucceed,
      );
      expect(result.transactionId).toBe('tx-1');
      expect(result.state).toBe('FULLY_COMPENSATED');
      expect(result.compensatedSteps).toEqual([1, 0]);
      expect(result.failedCompensations).toEqual([]);
      expect(result.completedAt).toBeDefined();
    });

    it('executes compensations in reverse step order', () => {
      const order: number[] = [];
      const trackingCompensator: CompensatorFn = (providerId, op, input) => {
        order.push(input.originalStepIndex as number);
        return 'COMPENSATED';
      };

      rollback.rollback(
        'tx-1',
        [
          { stepIndex: 0, providerId: 'p1', operation: 'create', result: { originalStepIndex: 0 } },
          { stepIndex: 1, providerId: 'p2', operation: 'create', result: { originalStepIndex: 1 } },
          { stepIndex: 2, providerId: 'p3', operation: 'create', result: { originalStepIndex: 2 } },
        ],
        trackingCompensator,
      );
      expect(order).toEqual([2, 1, 0]);
    });

    it('returns PARTIALLY_COMPENSATED when some compensations fail', () => {
      let callCount = 0;
      const partiallyFail: CompensatorFn = () => {
        callCount++;
        return callCount === 1 ? 'COMPENSATION_FAILED' : 'COMPENSATED';
      };

      const result = rollback.rollback(
        'tx-1',
        [
          { stepIndex: 0, providerId: 'p1', operation: 'create', result: {} },
          { stepIndex: 1, providerId: 'p2', operation: 'create', result: {} },
        ],
        partiallyFail,
      );
      expect(result.state).toBe('PARTIALLY_COMPENSATED');
      // Reverse order: step 1 processed first (fails), then step 0 (succeeds)
      expect(result.failedCompensations).toEqual([1]);
      expect(result.compensatedSteps).toEqual([0]);
    });

    it('returns ROLLBACK_FAILED when all compensations fail', () => {
      const alwaysFail: CompensatorFn = () => 'COMPENSATION_FAILED';
      const result = rollback.rollback(
        'tx-1',
        [
          { stepIndex: 0, providerId: 'p1', operation: 'create', result: {} },
        ],
        alwaysFail,
      );
      expect(result.state).toBe('ROLLBACK_FAILED');
      expect(result.compensatedSteps).toEqual([]);
      expect(result.failedCompensations).toEqual([0]);
    });

    it('passes correct providerId, operation, and input to compensator', () => {
      const captured: Array<{ providerId: string; operation: string; input: Record<string, unknown> }> = [];
      const captureCompensator: CompensatorFn = (providerId, operation, input) => {
        captured.push({ providerId, operation, input });
        return 'COMPENSATED';
      };

      rollback.rollback(
        'tx-1',
        [
          { stepIndex: 0, providerId: 'google-calendar', operation: 'events.create', result: { eventId: '123' } },
        ],
        captureCompensator,
      );
      expect(captured).toHaveLength(1);
      expect(captured[0].providerId).toBe('google-calendar');
      expect(captured[0].operation).toBe('events.create-compensation');
      expect(captured[0].input).toMatchObject({ eventId: '123', originalOperation: 'events.create' });
    });

    it('throws RollbackError for empty completed steps', () => {
      expect(() =>
        rollback.rollback('tx-1', [], () => 'COMPENSATED'),
      ).toThrow(RollbackError);
      expect(() =>
        rollback.rollback('tx-1', [], () => 'COMPENSATED'),
      ).toThrow('No completed steps');
    });

    it('continues compensations after a failure', () => {
      let callCount = 0;
      const failMiddle: CompensatorFn = () => {
        callCount++;
        if (callCount === 2) return 'COMPENSATION_FAILED';
        return 'COMPENSATED';
      };

      rollback.rollback(
        'tx-1',
        [
          { stepIndex: 0, providerId: 'p1', operation: 'create', result: {} },
          { stepIndex: 1, providerId: 'p2', operation: 'create', result: {} },
          { stepIndex: 2, providerId: 'p3', operation: 'create', result: {} },
        ],
        failMiddle,
      );
      expect(callCount).toBe(3);
    });

    it('handles single step rollback', () => {
      const result = rollback.rollback(
        'tx-1',
        [
          { stepIndex: 5, providerId: 'slack', operation: 'messages.send', result: { messageId: 'm-1' } },
        ],
        () => 'COMPENSATED',
      );
      expect(result.state).toBe('FULLY_COMPENSATED');
      expect(result.compensatedSteps).toEqual([5]);
    });

    it('passes originalOperation in input for identity', () => {
      const captured: Array<{ operation: string; originalOp: string }> = [];
      rollback.rollback(
        'tx-1',
        [
          { stepIndex: 0, providerId: 'p1', operation: 'events.delete', result: { id: '1' } },
          { stepIndex: 1, providerId: 'p2', operation: 'files.delete', result: { id: '2' } },
        ],
        (providerId, operation, input) => {
          captured.push({ operation, originalOp: input.originalOperation as string });
          return 'COMPENSATED';
        },
      );
      expect(captured[0].originalOp).toBe('files.delete');
      expect(captured[0].operation).toBe('files.delete-compensation');
      expect(captured[1].originalOp).toBe('events.delete');
      expect(captured[1].operation).toBe('events.delete-compensation');
    });
  });
});
