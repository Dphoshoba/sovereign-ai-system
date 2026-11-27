import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderCircuitBreakerImpl, CircuitBreakerError } from '../../lib/platform/execution/circuit-breaker-impl';

describe('ProviderCircuitBreakerImpl', () => {
  let cb: ProviderCircuitBreakerImpl;

  beforeEach(() => {
    cb = new ProviderCircuitBreakerImpl();
  });

  // ── Stage 4C.1 — State Machine ──

  describe('4C.1 — Circuit Breaker State Machine', () => {
    it('register creates a CLOSED entry with defaults', () => {
      const entry = cb.register('google-calendar');
      expect(entry.providerId).toBe('google-calendar');
      expect(entry.state).toBe('CLOSED');
      expect(entry.failureThreshold).toBe(5);
      expect(entry.cooldownMs).toBe(30000);
      expect(entry.failureCount).toBe(0);
      expect(entry.manualOverride).toBeNull();
    });

    it('register accepts custom options', () => {
      const entry = cb.register('google-drive', { failureThreshold: 3, cooldownMs: 60000 });
      expect(entry.failureThreshold).toBe(3);
      expect(entry.cooldownMs).toBe(60000);
    });

    it('getState returns undefined for unknown provider', () => {
      expect(cb.getState('unknown')).toBeUndefined();
    });

    it('getState returns registered state', () => {
      cb.register('google-calendar');
      const state = cb.getState('google-calendar');
      expect(state).toBeDefined();
      expect(state!.state).toBe('CLOSED');
    });
  });

  // ── Stage 4C.2 — Failure Threshold Tracking ──

  describe('4C.2 — Failure Threshold Tracking', () => {
    it('recordFailure increments failure count', () => {
      cb.register('google-calendar', { failureThreshold: 3 });
      const after = cb.recordFailure('google-calendar');
      expect(after.failureCount).toBe(1);
      expect(after.state).toBe('CLOSED');
    });

    it('transitions to OPEN when failure threshold reached', () => {
      cb.register('google-calendar', { failureThreshold: 3 });
      cb.recordFailure('google-calendar');
      cb.recordFailure('google-calendar');
      const after = cb.recordFailure('google-calendar');
      expect(after.failureCount).toBe(3);
      expect(after.state).toBe('OPEN');
      expect(after.trippedAt).toBeDefined();
    });

    it('stays OPEN on further failures after tripping', () => {
      cb.register('google-calendar', { failureThreshold: 2 });
      cb.recordFailure('google-calendar');
      cb.recordFailure('google-calendar');
      const after = cb.recordFailure('google-calendar');
      expect(after.state).toBe('OPEN');
    });

    it('does not transition to OPEN below threshold', () => {
      cb.register('p1', { failureThreshold: 5 });
      for (let i = 0; i < 4; i++) cb.recordFailure('p1');
      expect(cb.getState('p1')!.state).toBe('CLOSED');
    });

    it('sets lastFailureAt on failure', () => {
      cb.register('p1');
      const after = cb.recordFailure('p1');
      expect(after.lastFailureAt).toBeDefined();
    });
  });

  // ── Stage 4C.3 — Automatic Recovery ──

  describe('4C.3 — Automatic Recovery', () => {
    it('recordSuccess resets failure count', () => {
      cb.register('google-calendar', { failureThreshold: 3 });
      cb.recordFailure('google-calendar');
      cb.recordFailure('google-calendar');
      const after = cb.recordSuccess('google-calendar');
      expect(after.failureCount).toBe(0);
      expect(after.state).toBe('CLOSED');
    });

    it('recordSuccess transitions HALF_OPEN to CLOSED', () => {
      cb.register('google-calendar', { failureThreshold: 1, cooldownMs: 0 });
      cb.recordFailure('google-calendar');
      expect(cb.getState('google-calendar')!.state).toBe('OPEN');

      // check transitions to HALF_OPEN when cooldown elapsed (cooldownMs=0)
      const checkResult = cb.check('google-calendar');
      expect(checkResult.state).toBe('HALF_OPEN');

      const after = cb.recordSuccess('google-calendar');
      expect(after.state).toBe('CLOSED');
      expect(after.failureCount).toBe(0);
    });

    it('recordFailure during HALF_OPEN transitions back to OPEN', () => {
      cb.register('google-calendar', { failureThreshold: 1, cooldownMs: 0 });
      cb.recordFailure('google-calendar');
      cb.check('google-calendar'); // opens to HALF_OPEN (cooldownMs=0)
      const after = cb.recordFailure('google-calendar');
      expect(after.state).toBe('OPEN');
      expect(after.lastFailureAt).toBeDefined();
    });

    it('check returns not allowed for OPEN provider', () => {
      cb.register('google-calendar', { failureThreshold: 1 });
      cb.recordFailure('google-calendar');
      const result = cb.check('google-calendar');
      expect(result.allowed).toBe(false);
      expect(result.state).toBe('OPEN');
    });

    it('check returns allowed for CLOSED provider', () => {
      cb.register('google-calendar');
      const result = cb.check('google-calendar');
      expect(result.allowed).toBe(true);
      expect(result.state).toBe('CLOSED');
    });

    it('check transitions OPEN to HALF_OPEN after cooldown', () => {
      cb.register('google-calendar', { failureThreshold: 1, cooldownMs: 0 });
      cb.recordFailure('google-calendar');
      const result = cb.check('google-calendar');
      expect(result.state).toBe('HALF_OPEN');
      expect(result.allowed).toBe(true);
    });

    it('check returns hal_fopen state and allowed for HALF_OPEN', () => {
      cb.register('p1', { failureThreshold: 1, cooldownMs: 0 });
      cb.recordFailure('p1');
      cb.check('p1'); // transitions to HALF_OPEN
      const result = cb.check('p1');
      expect(result.state).toBe('HALF_OPEN');
      expect(result.allowed).toBe(true);
    });

    it('check returns not allowed for unknown provider', () => {
      const result = cb.check('unknown');
      expect(result.allowed).toBe(false);
      expect(result.state).toBe('OPEN');
    });

    it('recordSuccess sets lastSuccessAt', () => {
      cb.register('p1');
      const after = cb.recordSuccess('p1');
      expect(after.lastSuccessAt).toBeDefined();
    });

    it('OPEN→HALF_OPEN transition only happens once check is called', () => {
      cb.register('p1', { failureThreshold: 1, cooldownMs: 0 });
      cb.recordFailure('p1');
      // State is still OPEN in storage until check triggers transition
      expect(cb.getState('p1')!.state).toBe('OPEN');
      cb.check('p1');
      expect(cb.getState('p1')!.state).toBe('HALF_OPEN');
    });
  });

  // ── Stage 4C.4 — Manual Override ──

  describe('4C.4 — Manual Override', () => {
    it('forceState sets state and override metadata', () => {
      cb.register('google-calendar');
      const after = cb.forceState('google-calendar', 'OPEN', 'Scheduled maintenance', 'operator-1');
      expect(after.state).toBe('OPEN');
      expect(after.manualOverride).toBeDefined();
      expect(after.manualOverride!.reason).toBe('Scheduled maintenance');
      expect(after.manualOverride!.setBy).toBe('operator-1');
      expect(after.manualOverride!.setAt).toBeDefined();
      expect(after.manualOverride!.state).toBe('OPEN');
    });

    it('check respects manual override to OPEN', () => {
      cb.register('google-calendar');
      cb.forceState('google-calendar', 'OPEN', 'Maintenance', 'op1');
      const result = cb.check('google-calendar');
      expect(result.allowed).toBe(false);
      expect(result.state).toBe('OPEN');
    });

    it('check respects manual override to CLOSED even when circuit is OPEN', () => {
      cb.register('google-calendar', { failureThreshold: 1 });
      cb.recordFailure('google-calendar');
      cb.forceState('google-calendar', 'CLOSED', 'Override', 'op1');
      const result = cb.check('google-calendar');
      expect(result.allowed).toBe(true);
      expect(result.state).toBe('CLOSED');
    });

    it('releaseOverride clears override and resets to CLOSED', () => {
      cb.register('google-calendar');
      cb.forceState('google-calendar', 'OPEN', 'Test', 'op1');
      const after = cb.releaseOverride('google-calendar');
      expect(after.state).toBe('CLOSED');
      expect(after.manualOverride).toBeNull();
    });

    it('releaseOverride throws when no override exists', () => {
      cb.register('google-calendar');
      expect(() => cb.releaseOverride('google-calendar')).toThrow(CircuitBreakerError);
      expect(() => cb.releaseOverride('google-calendar')).toThrow('No override to release');
    });

    it('check returns state from manual override even if different from internal', () => {
      cb.register('p1');
      cb.forceState('p1', 'HALF_OPEN', 'Testing', 'op1');
      const result = cb.check('p1');
      expect(result.state).toBe('HALF_OPEN');
    });

    it('forceState preserves trippedAt when forcing to OPEN', () => {
      cb.register('p1', { failureThreshold: 1 });
      cb.recordFailure('p1');
      const stateBefore = cb.getState('p1')!;
      const after = cb.forceState('p1', 'OPEN', 'Maintenance', 'op1');
      expect(after.trippedAt).toBe(stateBefore.trippedAt);
    });
  });

  // ── Cross-milestone integration ──

  describe('full lifecycle scenario', () => {
    it('tracks a provider through full circuit lifecycle', () => {
      cb.register('google-calendar', { failureThreshold: 3, cooldownMs: 60000 });
      expect(cb.check('google-calendar').allowed).toBe(true);

      // failures accumulate
      cb.recordFailure('google-calendar');
      expect(cb.check('google-calendar').allowed).toBe(true);
      cb.recordFailure('google-calendar');
      expect(cb.check('google-calendar').allowed).toBe(true);
      cb.recordFailure('google-calendar'); // trip
      expect(cb.getState('google-calendar')!.state).toBe('OPEN');

      // requests fail fast while cooldown hasn't elapsed
      expect(cb.check('google-calendar').allowed).toBe(false);

      // success resets failure count but circuit stays OPEN
      cb.recordSuccess('google-calendar');
      const afterSuccess = cb.getState('google-calendar')!;
      expect(afterSuccess.failureCount).toBe(0);
      expect(afterSuccess.state).toBe('OPEN');
    });

    it('supports multiple independent providers', () => {
      cb.register('google-calendar', { failureThreshold: 2 });
      cb.register('google-drive', { failureThreshold: 5 });

      for (let i = 0; i < 2; i++) cb.recordFailure('google-calendar');
      for (let i = 0; i < 3; i++) cb.recordFailure('google-drive');

      expect(cb.getState('google-calendar')!.state).toBe('OPEN');
      expect(cb.getState('google-drive')!.state).toBe('CLOSED');
    });

    it('override can be released mid-lifecycle', () => {
      cb.register('p1', { failureThreshold: 2 });
      cb.recordFailure('p1');
      cb.recordFailure('p1');
      expect(cb.check('p1').allowed).toBe(false);

      cb.forceState('p1', 'CLOSED', 'Emergency override', 'operator-2');
      expect(cb.check('p1').allowed).toBe(true);

      cb.releaseOverride('p1');
      // After releasing override, state resets to CLOSED
      expect(cb.getState('p1')!.state).toBe('CLOSED');
      expect(cb.getState('p1')!.manualOverride).toBeNull();
    });
  });
});
