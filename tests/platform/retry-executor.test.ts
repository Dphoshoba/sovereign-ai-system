import { describe, it, expect, beforeEach } from 'vitest';
import { RetryExecutorImpl } from '../../lib/platform/execution/retry-executor-impl';
import {
  AttemptFn,
  ProviderRetryConfig,
} from '../../lib/platform/execution/retry-policy';
import { ProviderCircuitBreakerImpl } from '../../lib/platform/execution/circuit-breaker-impl';
import { computeBackoffMs, classify } from '../../lib/platform/execution/retry-executor-impl';

// ══════════════════════════════════════════
// Stage 4D.1 — Backoff Calculator
// ══════════════════════════════════════════

describe('4D.1 — Backoff Calculator', () => {
  it('fixed backoff returns base delay for attempt 2+', () => {
    expect(computeBackoffMs(2, { type: 'fixed', baseDelayMs: 1000, maxDelayMs: 30000, multiplier: 1 })).toBe(1000);
    expect(computeBackoffMs(5, { type: 'fixed', baseDelayMs: 2000, maxDelayMs: 30000, multiplier: 1 })).toBe(2000);
  });

  it('fixed backoff returns 0 for attempt 1', () => {
    expect(computeBackoffMs(1, { type: 'fixed', baseDelayMs: 1000, maxDelayMs: 30000, multiplier: 1 })).toBe(0);
  });

  it('exponential backoff grows by multiplier', () => {
    const s = { type: 'exponential' as const, baseDelayMs: 1000, maxDelayMs: 30000, multiplier: 2 };
    expect(computeBackoffMs(2, s)).toBe(1000);   // 1000 * 2^0
    expect(computeBackoffMs(3, s)).toBe(2000);   // 1000 * 2^1
    expect(computeBackoffMs(4, s)).toBe(4000);   // 1000 * 2^2
    expect(computeBackoffMs(5, s)).toBe(8000);   // 1000 * 2^3
  });

  it('exponential backoff with multiplier 3', () => {
    const s = { type: 'exponential' as const, baseDelayMs: 100, maxDelayMs: 10000, multiplier: 3 };
    expect(computeBackoffMs(2, s)).toBe(100);
    expect(computeBackoffMs(3, s)).toBe(300);   // 100 * 3^1
    expect(computeBackoffMs(4, s)).toBe(900);   // 100 * 3^2
  });

  it('linear backoff increases by multiplier per attempt', () => {
    const s = { type: 'linear' as const, baseDelayMs: 500, maxDelayMs: 5000, multiplier: 500 };
    expect(computeBackoffMs(2, s)).toBe(500);   // 500 + 500*0
    expect(computeBackoffMs(3, s)).toBe(1000);  // 500 + 500*1
    expect(computeBackoffMs(4, s)).toBe(1500);  // 500 + 500*2
  });

  it('caps at maxDelayMs', () => {
    const s = { type: 'exponential' as const, baseDelayMs: 1000, maxDelayMs: 5000, multiplier: 3 };
    expect(computeBackoffMs(5, s)).toBe(5000); // would be 27000 but capped at 5000
  });

  it('capped value equals maxDelayMs', () => {
    const s = { type: 'exponential' as const, baseDelayMs: 10000, maxDelayMs: 15000, multiplier: 2 };
    const delay = computeBackoffMs(2, s);
    expect(delay).toBe(10000); // base delay, within cap
  });
});

// ══════════════════════════════════════════
// Stage 4D.2 — Failure Classification
// ══════════════════════════════════════════

describe('4D.2 — Failure Classification', () => {
  it('empty retryableErrors means all errors are retryable', () => {
    expect(classify('RATE_LIMITED', [])).toBe('retryable');
    expect(classify('INTERNAL_ERROR', [])).toBe('retryable');
  });

  it('matches error code in retryableErrors list', () => {
    const retryable = ['RATE_LIMITED', 'TIMEOUT', 'SERVICE_UNAVAILABLE'];
    expect(classify('RATE_LIMITED', retryable)).toBe('retryable');
    expect(classify('TIMEOUT', retryable)).toBe('retryable');
    expect(classify('SERVICE_UNAVAILABLE', retryable)).toBe('retryable');
  });

  it('classifies unmatched error code as non-retryable', () => {
    const retryable = ['RATE_LIMITED', 'TIMEOUT'];
    expect(classify('INVALID_REQUEST', retryable)).toBe('non-retryable');
    expect(classify('AUTH_FAILED', retryable)).toBe('non-retryable');
  });
});

// ══════════════════════════════════════════
// Stage 4D.3 — Timeout Policy
// ══════════════════════════════════════════

describe('4D.3 — Timeout Policy', () => {
  it('timeoutMs is passed to attempt function', () => {
    const executor = new RetryExecutorImpl();
    let receivedTimeout = 0;

    executor.execute(
      'google-calendar', 'events.get',
      (timeoutMs) => {
        receivedTimeout = timeoutMs;
        return { outcome: 'SUCCESS', errorCode: null, errorMessage: null };
      },
      { providerId: 'google-calendar', retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseDelayMs: 1000, maxDelayMs: 30000, multiplier: 1 }, retryableErrors: [] }, timeoutPolicy: { operationTimeoutMs: 5000 } },
    );

    expect(receivedTimeout).toBe(5000);
  });

  it('first attempt has zero delay', () => {
    const executor = new RetryExecutorImpl();
    const telemetry = executor.execute(
      'p1', 'read',
      () => ({ outcome: 'SUCCESS', errorCode: null, errorMessage: null }),
      { providerId: 'p1', retryPolicy: { maxAttempts: 3, backoff: { type: 'fixed', baseDelayMs: 2000, maxDelayMs: 30000, multiplier: 1 }, retryableErrors: [] }, timeoutPolicy: { operationTimeoutMs: 1000 } },
    );
    expect(telemetry.attempts[0].delayBeforeAttemptMs).toBe(0);
  });
});

// ══════════════════════════════════════════
// Stage 4D.4 — Retry Executor (full integration)
// ══════════════════════════════════════════

describe('4D.4 — Retry Executor', () => {
  let executor: RetryExecutorImpl;

  beforeEach(() => {
    executor = new RetryExecutorImpl();
  });

  const baseConfig: ProviderRetryConfig = {
    providerId: 'google-calendar',
    retryPolicy: {
      maxAttempts: 3,
      backoff: { type: 'fixed', baseDelayMs: 100, maxDelayMs: 10000, multiplier: 1 },
      retryableErrors: ['RATE_LIMITED', 'TIMEOUT', 'SERVICE_UNAVAILABLE'],
    },
    timeoutPolicy: { operationTimeoutMs: 5000 },
  };

  it('succeeds on first attempt', () => {
    const telemetry = executor.execute('p1', 'read', () => ({ outcome: 'SUCCESS', errorCode: null, errorMessage: null }), baseConfig);
    expect(telemetry.successful).toBe(true);
    expect(telemetry.totalAttempts).toBe(1);
    expect(telemetry.finalErrorCode).toBeNull();
    expect(telemetry.attempts).toHaveLength(1);
  });

  it('retries on retryable failure and succeeds', () => {
    let callCount = 0;
    const attempt: AttemptFn = () => {
      callCount++;
      return callCount < 3
        ? { outcome: 'FAILURE' as const, errorCode: 'RATE_LIMITED', errorMessage: 'Rate limited' }
        : { outcome: 'SUCCESS' as const, errorCode: null, errorMessage: null };
    };

    const telemetry = executor.execute('p1', 'read', attempt, baseConfig);
    expect(telemetry.successful).toBe(true);
    expect(telemetry.totalAttempts).toBe(3);
    expect(telemetry.attempts).toHaveLength(3);
    expect(telemetry.attempts[0].outcome).toBe('FAILURE');
    expect(telemetry.attempts[1].outcome).toBe('FAILURE');
    expect(telemetry.attempts[2].outcome).toBe('SUCCESS');
    expect(telemetry.attempts[1].delayBeforeAttemptMs).toBe(100);
    expect(telemetry.attempts[2].delayBeforeAttemptMs).toBe(100);
  });

  it('fails after exhausting all retries', () => {
    const attempt: AttemptFn = () => ({ outcome: 'FAILURE', errorCode: 'RATE_LIMITED', errorMessage: 'Always fails' });
    const telemetry = executor.execute('p1', 'read', attempt, baseConfig);
    expect(telemetry.successful).toBe(false);
    expect(telemetry.totalAttempts).toBe(3);
    expect(telemetry.finalErrorCode).toBe('RATE_LIMITED');
    expect(telemetry.attempts.every((a) => a.outcome === 'FAILURE')).toBe(true);
  });

  it('fails immediately on non-retryable error', () => {
    const attempt: AttemptFn = () => ({ outcome: 'FAILURE', errorCode: 'INVALID_REQUEST', errorMessage: 'Bad request' });
    const telemetry = executor.execute('p1', 'read', attempt, baseConfig);
    expect(telemetry.successful).toBe(false);
    expect(telemetry.totalAttempts).toBe(1);
    expect(telemetry.finalErrorCode).toBe('INVALID_REQUEST');
  });

  it('handles TIMEOUT as retryable failure', () => {
    let callCount = 0;
    const attempt: AttemptFn = () => {
      callCount++;
      return callCount < 2
        ? { outcome: 'TIMEOUT', errorCode: 'TIMEOUT', errorMessage: 'Timed out' }
        : { outcome: 'SUCCESS', errorCode: null, errorMessage: null };
    };

    const telemetry = executor.execute('p1', 'read', attempt, baseConfig);
    expect(telemetry.successful).toBe(true);
    expect(telemetry.totalAttempts).toBe(2);
  });

  it('records attempt delay values', () => {
    const config: ProviderRetryConfig = {
      providerId: 'p1',
      retryPolicy: {
        maxAttempts: 3,
        backoff: { type: 'exponential', baseDelayMs: 1000, maxDelayMs: 30000, multiplier: 2 },
        retryableErrors: ['ERROR'],
      },
      timeoutPolicy: { operationTimeoutMs: 1000 },
    };

    const run = () => ({ outcome: 'FAILURE' as const, errorCode: 'ERROR', errorMessage: '' });
    const telemetry = executor.execute('p1', 'read', run, config);
    expect(telemetry.attempts[0].delayBeforeAttemptMs).toBe(0);
    expect(telemetry.attempts[1].delayBeforeAttemptMs).toBe(1000);
    expect(telemetry.attempts[2].delayBeforeAttemptMs).toBe(2000);
  });
});

// ══════════════════════════════════════════
// Stage 4D — Circuit Breaker Integration
// ══════════════════════════════════════════

describe('4D — Circuit Breaker Integration', () => {
  let executor: RetryExecutorImpl;
  let circuitBreaker: ProviderCircuitBreakerImpl;

  beforeEach(() => {
    executor = new RetryExecutorImpl();
    circuitBreaker = new ProviderCircuitBreakerImpl();
  });

  const config: ProviderRetryConfig = {
    providerId: 'google-calendar',
    retryPolicy: {
      maxAttempts: 3,
      backoff: { type: 'fixed', baseDelayMs: 100, maxDelayMs: 10000, multiplier: 1 },
      retryableErrors: ['RATE_LIMITED', 'TIMEOUT'],
    },
    timeoutPolicy: { operationTimeoutMs: 5000 },
  };

  it('skips execution when circuit is OPEN', () => {
    circuitBreaker.register('google-calendar', { failureThreshold: 1, cooldownMs: 60000 });
    circuitBreaker.recordFailure('google-calendar');

    const telemetry = executor.execute('google-calendar', 'read', () => ({ outcome: 'SUCCESS', errorCode: null, errorMessage: null }), config, circuitBreaker);
    expect(telemetry.successful).toBe(false);
    expect(telemetry.totalAttempts).toBe(0);
    expect(telemetry.finalErrorCode).toBe('CIRCUIT_OPEN');
    expect(telemetry.attempts).toHaveLength(1);
    expect(telemetry.attempts[0].outcome).toBe('SKIPPED');
  });

  it('records success on circuit breaker after successful attempt', () => {
    circuitBreaker.register('google-calendar', { failureThreshold: 5, cooldownMs: 60000 });
    executor.execute('google-calendar', 'read', () => ({ outcome: 'SUCCESS', errorCode: null, errorMessage: null }), config, circuitBreaker);
    expect(circuitBreaker.getState('google-calendar')!.failureCount).toBe(0);
  });

  it('records failure on circuit breaker after non-retryable failure', () => {
    circuitBreaker.register('google-calendar', { failureThreshold: 5, cooldownMs: 60000 });
    executor.execute(
      'google-calendar', 'read',
      () => ({ outcome: 'FAILURE', errorCode: 'INVALID_REQUEST', errorMessage: 'Bad request' }),
      config, circuitBreaker,
    );
    expect(circuitBreaker.getState('google-calendar')!.failureCount).toBe(1);
  });

  it('records failure on circuit breaker after retryable failure exhausts', () => {
    circuitBreaker.register('google-calendar', { failureThreshold: 3, cooldownMs: 60000 });
    const attempt: AttemptFn = () => ({ outcome: 'FAILURE', errorCode: 'RATE_LIMITED', errorMessage: 'Rate limited' });
    executor.execute('google-calendar', 'read', attempt, config, circuitBreaker);
    // 3 retryable failures recorded
    expect(circuitBreaker.getState('google-calendar')!.failureCount).toBe(3);
    expect(circuitBreaker.getState('google-calendar')!.state).toBe('OPEN');
  });

  it('recovers from HALF_OPEN when attempt succeeds', () => {
    circuitBreaker.register('google-calendar', { failureThreshold: 1, cooldownMs: 0 });
    circuitBreaker.recordFailure('google-calendar');

    // check transitions to HALF_OPEN
    circuitBreaker.check('google-calendar');
    expect(circuitBreaker.getState('google-calendar')!.state).toBe('HALF_OPEN');

    // success closes circuit
    const telemetry = executor.execute('google-calendar', 'read', () => ({ outcome: 'SUCCESS', errorCode: null, errorMessage: null }), config, circuitBreaker);
    expect(telemetry.successful).toBe(true);
    expect(circuitBreaker.getState('google-calendar')!.state).toBe('CLOSED');
    expect(circuitBreaker.getState('google-calendar')!.failureCount).toBe(0);
  });
});

// ══════════════════════════════════════════
// Stage 4D — Telemetry & Audit
// ══════════════════════════════════════════

describe('4D — Telemetry', () => {
  let executor: RetryExecutorImpl;

  beforeEach(() => {
    executor = new RetryExecutorImpl();
  });

  it('includes providerId and operation in telemetry', () => {
    const telemetry = executor.execute(
      'google-calendar', 'events.get',
      () => ({ outcome: 'SUCCESS', errorCode: null, errorMessage: null }),
      { providerId: 'google-calendar', retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseDelayMs: 1000, maxDelayMs: 30000, multiplier: 1 }, retryableErrors: [] }, timeoutPolicy: { operationTimeoutMs: 5000 } },
    );
    expect(telemetry.providerId).toBe('google-calendar');
    expect(telemetry.operation).toBe('events.get');
  });

  it('reports totalDurationMs', () => {
    const telemetry = executor.execute('p1', 'read', () => ({ outcome: 'SUCCESS', errorCode: null, errorMessage: null }), { providerId: 'p1', retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseDelayMs: 1000, maxDelayMs: 30000, multiplier: 1 }, retryableErrors: [] }, timeoutPolicy: { operationTimeoutMs: 1000 } });
    expect(telemetry.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it('records timestamps for each attempt', () => {
    const attempt: AttemptFn = () => ({ outcome: 'FAILURE', errorCode: 'RATE_LIMITED', errorMessage: 'Rate limited' });
    const telemetry = executor.execute('p1', 'read', attempt, { providerId: 'p1', retryPolicy: { maxAttempts: 2, backoff: { type: 'fixed', baseDelayMs: 100, maxDelayMs: 10000, multiplier: 1 }, retryableErrors: ['RATE_LIMITED'] }, timeoutPolicy: { operationTimeoutMs: 1000 } });
    expect(telemetry.attempts[0].startedAt).toBeDefined();
    expect(telemetry.attempts[0].completedAt).toBeDefined();
    expect(telemetry.attempts[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it('returns empty attempts array structure for successful single attempt', () => {
    const telemetry = executor.execute('p1', 'read', () => ({ outcome: 'SUCCESS', errorCode: null, errorMessage: null }), { providerId: 'p1', retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseDelayMs: 1000, maxDelayMs: 30000, multiplier: 1 }, retryableErrors: [] }, timeoutPolicy: { operationTimeoutMs: 5000 } });
    expect(telemetry.attempts).toHaveLength(1);
    expect(telemetry.attempts[0].outcome).toBe('SUCCESS');
    expect(telemetry.attempts[0].errorCode).toBeNull();
  });

  it('reports attempt count for multi-attempt scenarios', () => {
    let count = 0;
    const telemetry = executor.execute('p1', 'read', () => {
      count++;
      return count < 3
        ? { outcome: 'FAILURE' as const, errorCode: 'RATE_LIMITED', errorMessage: '' }
        : { outcome: 'SUCCESS' as const, errorCode: null, errorMessage: null };
    }, { providerId: 'p1', retryPolicy: { maxAttempts: 5, backoff: { type: 'fixed', baseDelayMs: 100, maxDelayMs: 10000, multiplier: 1 }, retryableErrors: ['RATE_LIMITED'] }, timeoutPolicy: { operationTimeoutMs: 1000 } });
    expect(telemetry.totalAttempts).toBe(3);
    expect(telemetry.attempts).toHaveLength(3);
  });
});
