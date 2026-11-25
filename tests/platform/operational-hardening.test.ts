import { describe, it, expect, vi } from 'vitest';
import { BackoffStrategy, DEFAULT_BACKOFF } from '../../lib/platform/execution/operational-hardening/backoff-strategy';
import { RetryPolicy } from '../../lib/platform/execution/operational-hardening/retry-policy';
import { ProviderErrorInfo } from '../../lib/platform/execution/provider-contracts/provider-error';
import { RateLimitHandler } from '../../lib/platform/execution/operational-hardening/rate-limit-handler';
import type { ProviderResponse } from '../../lib/platform/execution/provider-contracts/provider-response';
import { ReconciliationEngine } from '../../lib/platform/execution/operational-hardening/reconciliation-engine';
import { ProviderMutationResult, ProviderVerificationResult } from '../../lib/platform/execution/connector-execution-adapter';
import { DistributedIdempotencyStore } from '../../lib/platform/execution/operational-hardening/distributed-idempotency-store';
import { CredentialRotationManager } from '../../lib/platform/execution/operational-hardening/credential-rotation-manager';
import { CredentialProvider, CredentialDescriptor } from '../../lib/platform/execution/provider-contracts/credential-provider';
import { TelemetryEmitter } from '../../lib/platform/execution/operational-hardening/telemetry-emitter';
import { FailureInjectionHarness } from '../../lib/platform/execution/operational-hardening/failure-injection-harness';
import { Transport } from '../../lib/platform/execution/provider-contracts/transport';
import { ProviderRequest } from '../../lib/platform/execution/provider-contracts/provider-request';

describe('BackoffStrategy', () => {
  it('produces deterministic delays in test mode', () => {
    const s = new BackoffStrategy({ jitterFactor: 0 });
    const delays = [0, 1, 2].map(i => s.computeDelay(i));
    expect(delays[0]).toBe(1000);
    expect(delays[1]).toBe(2000);
    expect(delays[2]).toBe(4000);
  });

  it('never exceeds maxDelayMs', () => {
    const s = new BackoffStrategy({ baseDelayMs: 100000, maxDelayMs: 5000, jitterFactor: 0 });
    expect(s.computeDelay(5)).toBeLessThanOrEqual(5000);
  });

  it('supports LINEAR algorithm', () => {
    const s = new BackoffStrategy({ algorithm: 'LINEAR', baseDelayMs: 1000, jitterFactor: 0 });
    expect(s.computeDelay(0)).toBe(1000);
    expect(s.computeDelay(1)).toBe(2000);
    expect(s.computeDelay(2)).toBe(3000);
  });

  it('supports FIXED algorithm', () => {
    const s = new BackoffStrategy({ algorithm: 'FIXED', baseDelayMs: 5000, jitterFactor: 0 });
    expect(s.computeDelay(0)).toBe(5000);
    expect(s.computeDelay(10)).toBe(5000);
  });

  it('applies jitter within configured factor', () => {
    const s = new BackoffStrategy({ jitterFactor: 0.5 });
    const delays = Array.from({ length: 100 }, () => s.computeDelay(2));
    const unique = new Set(delays);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('shouldRetry returns true within max attempts', () => {
    const s = new BackoffStrategy();
    expect(s.shouldRetry(0)).toBe(true);
    expect(s.shouldRetry(2)).toBe(true);
  });

  it('shouldRetry returns false beyond max attempts', () => {
    const s = new BackoffStrategy();
    expect(s.shouldRetry(3)).toBe(false);
  });

  it('getConfig returns a copy of the config', () => {
    const s = new BackoffStrategy({ baseDelayMs: 2000 });
    const cfg = s.getConfig();
    expect(cfg.baseDelayMs).toBe(2000);
  });
});

// ---------------------------------------------------------------------------
// RetryPolicy
// ---------------------------------------------------------------------------

describe('RetryPolicy', () => {
  const transientError: ProviderErrorInfo = {
    code: 'NETWORK_TIMEOUT',
    category: 'TRANSIENT',
    retryable: true,
    statusCode: null,
    providerCode: null,
    providerMessage: null,
    retryAfterMs: null,
    details: {},
  };

  const permanentError: ProviderErrorInfo = {
    code: 'BAD_REQUEST',
    category: 'PERMANENT',
    retryable: false,
    statusCode: 400,
    providerCode: null,
    providerMessage: 'Bad request',
    retryAfterMs: null,
    details: {},
  };

  it('retries transient errors within limits', () => {
    const policy = new RetryPolicy();
    const decision = policy.evaluate(transientError, 1);
    expect(decision.shouldRetry).toBe(true);
    expect(decision.delayMs).toBeGreaterThan(0);
    expect(decision.reason).toContain('RETRYING');
  });

  it('does not retry permanent errors', () => {
    const policy = new RetryPolicy();
    const decision = policy.evaluate(permanentError, 1);
    expect(decision.shouldRetry).toBe(false);
    expect(decision.reason).toContain('NON_RETRYABLE');
  });

  it('stops retrying after max retries', () => {
    const policy = new RetryPolicy({ maxRetries: 2 });
    const d1 = policy.evaluate(transientError, 1);
    expect(d1.shouldRetry).toBe(true);
    const d2 = policy.evaluate(transientError, 2);
    expect(d2.shouldRetry).toBe(false);
    expect(d2.reason).toContain('MAX_ATTEMPTS_REACHED');
  });

  it('exhausts budget and stops retrying', () => {
    const policy = new RetryPolicy({ maxRetries: 3, retryBudget: { maxRetryBudget: 1, budgetWindowMs: 60000 } });
    const d1 = policy.evaluate(transientError, 0);
    expect(d1.shouldRetry).toBe(true);
    const d2 = policy.evaluate(transientError, 1);
    expect(d2.shouldRetry).toBe(false);
    expect(d2.budgetExhausted).toBe(true);
  });

  it('records failure and reduces budget', () => {
    const policy = new RetryPolicy({ maxRetries: 5 });
    policy.recordFailure();
    expect(policy.getRemainingBudget()).toBe(4);
  });

  it('resetBudget restores full budget', () => {
    const policy = new RetryPolicy({ maxRetries: 5 });
    policy.recordFailure();
    policy.recordFailure();
    policy.resetBudget();
    expect(policy.getRemainingBudget()).toBe(5);
  });

  it('produces non-zero backoff delay for any attempt', () => {
    const policy = new RetryPolicy();
    expect(policy.getBackoffDelay(0)).toBeGreaterThan(0);
  });

  it('getConfig returns a copy', () => {
    const policy = new RetryPolicy({ maxRetries: 5 });
    expect(policy.getConfig().maxRetries).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// RateLimitHandler
// ---------------------------------------------------------------------------
describe('RateLimitHandler', () => {
  const makeResponse = (statusCode: number, headers: Record<string, string> = {}): ProviderResponse => ({
    requestId: 'test',
    statusCode,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: null,
    bodyFormat: 'none',
    etag: null,
    revisionId: null,
    receivedAt: '',
    durationMs: 0,
    metadata: {},
  });

  it('detects 429 as rate limited', () => {
    const h = new RateLimitHandler();
    const info = h.detectRateLimit(makeResponse(429));
    expect(info.isRateLimited).toBe(true);
  });

  it('detects 403 as rate limited', () => {
    const h = new RateLimitHandler();
    const info = h.detectRateLimit(makeResponse(403));
    expect(info.isRateLimited).toBe(true);
  });

  it('does not detect 200 as rate limited', () => {
    const h = new RateLimitHandler();
    const info = h.detectRateLimit(makeResponse(200));
    expect(info.isRateLimited).toBe(false);
  });

  it('parses Retry-After header as seconds', () => {
    const h = new RateLimitHandler();
    const info = h.detectRateLimit(makeResponse(429, { 'Retry-After': '30' }));
    expect(info.retryAfterMs).toBe(30000);
  });

  it('parses X-RateLimit headers', () => {
    const h = new RateLimitHandler();
    const info = h.detectRateLimit(makeResponse(429, { 'X-RateLimit-Limit': '100', 'X-RateLimit-Remaining': '0' }));
    expect(info.limit).toBe(100);
    expect(info.remaining).toBe(0);
  });

  it('computes wait time from retry-after', () => {
    const h = new RateLimitHandler();
    const info = h.detectRateLimit(makeResponse(429, { 'Retry-After': '10' }));
    const decision = h.computeWaitTime(info, 1);
    expect(decision.shouldWait).toBe(true);
    expect(decision.waitMs).toBeGreaterThan(10000);
  });

  it('return no wait for non-rate-limited response', () => {
    const h = new RateLimitHandler();
    const info = h.detectRateLimit(makeResponse(200));
    const decision = h.computeWaitTime(info, 1);
    expect(decision.shouldWait).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ReconciliationEngine
// ---------------------------------------------------------------------------

describe('ReconciliationEngine', () => {
  const mutationResult: ProviderMutationResult = {
    mutationId: 'mut-001',
    providerState: { body: { id: 'event-001', status: 'confirmed' } },
    mutatedAt: '2026-01-01T00:00:00Z',
  };

  const verifiedResult: ProviderVerificationResult = {
    verified: true,
    providerState: { body: { id: 'event-001', status: 'confirmed' } },
    drift: [],
    verifiedAt: '2026-01-01T00:00:01Z',
  };

  const failedVerification: ProviderVerificationResult = {
    verified: false,
    providerState: { body: { id: 'event-001', status: 'cancelled' } },
    drift: ['status mismatch'],
    verifiedAt: '2026-01-01T00:00:01Z',
  };

  it('returns MUTATION_APPLIED when verification passes', async () => {
    const engine = new ReconciliationEngine();
    const result = await engine.reconcileMutation('exe-001', 'events.insert', mutationResult, verifiedResult, null);
    expect(result.outcome).toBe('MUTATION_APPLIED');
    expect(result.appliedMutationId).toBe('mut-001');
  });

  it('returns RECONCILIATION_FAILED when verification fails with no provider', async () => {
    const engine = new ReconciliationEngine();
    const result = await engine.reconcileMutation('exe-001', 'events.insert', mutationResult, failedVerification, null);
    expect(result.outcome).toBe('RECONCILIATION_FAILED');
    expect(result.appliedMutationId).toBeNull();
  });

  it('reconcileByReadBack confirms matching IDs', async () => {
    const engine = new ReconciliationEngine();
    const result = await engine.reconcileByReadBack('exe-001', 'events.insert', mutationResult, { body: { id: 'event-001', status: 'confirmed' } });
    expect(result.outcome).toBe('MUTATION_APPLIED');
  });

  it('reconcileByReadBack detects ID mismatch', async () => {
    const engine = new ReconciliationEngine();
    const result = await engine.reconcileByReadBack('exe-001', 'events.insert', mutationResult, { body: { id: 'event-999', status: 'confirmed' } });
    expect(result.outcome).toBe('RECONCILIATION_FAILED');
  });

  it('reconcileByReadBack detects MUTATION_NOT_APPLIED', async () => {
    const engine = new ReconciliationEngine();
    const result = await engine.reconcileByReadBack('exe-001', 'events.insert', mutationResult, { body: {} });
    expect(result.outcome).toBe('MUTATION_NOT_APPLIED');
  });

  it('reconcileByReadBack detects cancelled event after non-delete', async () => {
    const engine = new ReconciliationEngine();
    const result = await engine.reconcileByReadBack('exe-001', 'events.insert', mutationResult, { body: { id: 'event-001', status: 'cancelled' } });
    expect(result.outcome).toBe('RECONCILIATION_FAILED');
  });
});

// ---------------------------------------------------------------------------
// DistributedIdempotencyStore
// ---------------------------------------------------------------------------

describe('DistributedIdempotencyStore', () => {
  it('returns NOT_SEEN for unknown key', async () => {
    const store = new DistributedIdempotencyStore();
    const result = await store.check('unknown-key');
    expect(result.status).toBe('NOT_SEEN');
    expect(result.isReplay).toBe(false);
  });

  it('returns COMPLETED for previously completed key', async () => {
    const store = new DistributedIdempotencyStore();
    await store.put('key-1', {
      idempotencyKey: 'key-1',
      status: 'COMPLETED',
      executionId: 'exe-1',
      operation: 'events.insert',
      requestHash: 'hash-1',
      result: { id: 'event-1' },
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
    const result = await store.check('key-1');
    expect(result.status).toBe('COMPLETED');
    expect(result.isReplay).toBe(true);
  });

  it('complete updates entry status', async () => {
    const store = new DistributedIdempotencyStore();
    await store.put('key-2', {
      idempotencyKey: 'key-2',
      status: 'EXECUTING',
      executionId: 'exe-2',
      operation: 'events.insert',
      requestHash: 'hash-2',
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
    await store.complete('key-2', { id: 'event-2' });
    const entry = await store.get('key-2');
    expect(entry?.status).toBe('COMPLETED');
    expect((entry?.result as any)?.id).toBe('event-2');
  });

  it('fail updates entry status', async () => {
    const store = new DistributedIdempotencyStore();
    await store.put('key-3', {
      idempotencyKey: 'key-3',
      status: 'EXECUTING',
      executionId: 'exe-3',
      operation: 'events.insert',
      requestHash: 'hash-3',
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
    await store.fail('key-3', 'API error');
    const entry = await store.get('key-3');
    expect(entry?.status).toBe('FAILED');
    expect(entry?.error).toBe('API error');
  });

  it('cleanup removes expired entries', async () => {
    const store = new DistributedIdempotencyStore();
    await store.put('old-key', {
      idempotencyKey: 'old-key',
      status: 'COMPLETED',
      executionId: 'exe-old',
      operation: 'events.insert',
      requestHash: 'hash-old',
      result: null,
      error: null,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
      expiresAt: new Date(Date.now() - 3600000).toISOString(),
    });
    const removed = await store.cleanup(new Date(Date.now() - 3600000).toISOString());
    expect(removed).toBe(1);
    const entry = await store.get('old-key');
    expect(entry).toBeNull();
  });

  it('returns null for expired entries on get', async () => {
    const store = new DistributedIdempotencyStore();
    await store.put('exp-key', {
      idempotencyKey: 'exp-key',
      status: 'COMPLETED',
      executionId: 'exe-exp',
      operation: 'events.insert',
      requestHash: 'hash-exp',
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    const entry = await store.get('exp-key');
    expect(entry).toBeNull();
  });

  it('reset clears all entries', () => {
    const store = new DistributedIdempotencyStore();
    store.put('k1', {
      idempotencyKey: 'k1',
      status: 'COMPLETED',
      executionId: 'e1',
      operation: 'events.insert',
      requestHash: 'h1',
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
    expect(store.getEntryCount()).toBe(1);
    store.reset();
    expect(store.getEntryCount()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// CredentialRotationManager
// ---------------------------------------------------------------------------

describe('CredentialRotationManager', () => {
  const validDescriptor: CredentialDescriptor = {
    credentialId: 'cred-001',
    providerId: 'google-calendar',
    type: 'OAUTH2_CLIENT',
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
    issuedAt: '2026-01-01T00:00:00Z',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    isRevocable: true,
  };

  const nearExpiryDescriptor: CredentialDescriptor = {
    credentialId: 'cred-002',
    providerId: 'google-calendar',
    type: 'OAUTH2_CLIENT',
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
    issuedAt: '2026-01-01T00:00:00Z',
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    isRevocable: true,
  };

  let counter = 0;

  const mockProvider: CredentialProvider = {
    providerId: 'mock-cred',
    getDescriptor: async () => {
      counter++;
      return {
        ...validDescriptor,
        credentialId: `cred-${String(counter).padStart(3, '0')}`,
      };
    },
    validate: async () => true,
    revoke: async () => {},
  };

  it('reports healthy credential as healthy', async () => {
    const mgr = new CredentialRotationManager(mockProvider);
    const health = await mgr.checkHealth('exe-001');
    expect(health.isValid).toBe(true);
    expect(health.needsRotation).toBe(false);
  });

  it('reports near-expiry credential as needing rotation', async () => {
    const nearExpiryProvider: CredentialProvider = {
      providerId: 'mock-cred',
      getDescriptor: async () => nearExpiryDescriptor,
      validate: async () => true,
      revoke: async () => {},
    };
    const mgr = new CredentialRotationManager(nearExpiryProvider, { renewalThresholdMs: 300000 });
    const health = await mgr.checkHealth('exe-002');
    expect(health.needsRotation).toBe(true);
  });

  it('rotates credential and validates', async () => {
    const mgr = new CredentialRotationManager(mockProvider);
    const result = await mgr.rotate('exe-003');
    expect(result.rotated).toBe(true);
    expect(result.previousCredentialId).toBe('cred-002');
    expect(result.newCredentialId).toBe('cred-003');
    expect(result.validationPassed).toBe(true);
  });

  it('stops rotating after max attempts', async () => {
    const mgr = new CredentialRotationManager(mockProvider, { maxRotationAttempts: 2 });
    await mgr.rotate('exe-004');
    await mgr.rotate('exe-004');
    const result = await mgr.rotate('exe-004');
    expect(result.rotated).toBe(false);
    expect(result.error).toContain('MAX_ROTATION_ATTEMPTS');
  });

  it('tracks rotation history', async () => {
    const mgr = new CredentialRotationManager(mockProvider);
    await mgr.rotate('exe-005');
    const history = mgr.getRotationHistory('exe-005');
    expect(history.length).toBe(1);
    expect(history[0].rotated).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TelemetryEmitter
// ---------------------------------------------------------------------------

describe('TelemetryEmitter', () => {
  it('emits and retrieves events', () => {
    const t = new TelemetryEmitter();
    t.emit({
      level: 'INFO',
      category: 'EXECUTION',
      correlationId: 'corr-1',
      executionId: 'exe-1',
      operation: 'events.insert',
      message: 'Mutation executed',
      metadata: {},
    });
    expect(t.getEvents().length).toBe(1);
    expect(t.getEvents()[0].correlationId).toBe('corr-1');
  });

  it('provides snapshot with correct counts', () => {
    const t = new TelemetryEmitter();
    t.emit({ level: 'INFO', category: 'EXECUTION', correlationId: 'c1', executionId: 'e1', operation: 'op', message: 'exec', durationMs: 100, metadata: {} });
    t.emit({ level: 'ERROR', category: 'RETRY', correlationId: 'c2', executionId: 'e1', operation: 'op', message: 'retry err', metadata: {} });
    t.emit({ level: 'WARN', category: 'RATE_LIMIT', correlationId: 'c3', executionId: 'e1', operation: 'op', message: 'rate limit', metadata: {} });
    const s = t.getSnapshot();
    expect(s.executionCount).toBe(1);
    expect(s.retryCount).toBe(1);
    expect(s.rateLimitCount).toBe(1);
    expect(s.errorCount).toBe(1);
    expect(s.averageExecutionMs).toBe(100);
  });

  it('filters events by correlation ID', () => {
    const t = new TelemetryEmitter();
    t.emit({ level: 'INFO', category: 'EXECUTION', correlationId: 'a', executionId: 'e1', operation: 'op', message: 'a', metadata: {} });
    t.emit({ level: 'INFO', category: 'EXECUTION', correlationId: 'b', executionId: 'e1', operation: 'op', message: 'b', metadata: {} });
    expect(t.getEventsByCorrelation('a').length).toBe(1);
  });

  it('filters events by category', () => {
    const t = new TelemetryEmitter();
    t.emit({ level: 'INFO', category: 'EXECUTION', correlationId: 'c', executionId: 'e1', operation: 'op', message: 'exec', metadata: {} });
    t.emit({ level: 'INFO', category: 'IDEMPOTENCY', correlationId: 'c', executionId: 'e1', operation: 'op', message: 'idem', metadata: {} });
    expect(t.getEventsByCategory('EXECUTION').length).toBe(1);
    expect(t.getEventsByCategory('IDEMPOTENCY').length).toBe(1);
  });

  it('clear resets all state', () => {
    const t = new TelemetryEmitter();
    t.emit({ level: 'INFO', category: 'EXECUTION', correlationId: 'c', executionId: 'e1', operation: 'op', message: 'exec', metadata: {} });
    t.clear();
    expect(t.getEvents().length).toBe(0);
    expect(t.getSnapshot().executionCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// FailureInjectionHarness
// ---------------------------------------------------------------------------

describe('FailureInjectionHarness', () => {
  const successResponse: ProviderResponse = {
    requestId: 'real-1',
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { kind: 'calendar#event', id: 'event-001', status: 'confirmed' },
    bodyFormat: 'json',
    etag: '"etag"',
    revisionId: '1',
    receivedAt: new Date().toISOString(),
    durationMs: 100,
    metadata: {},
  };

  const realTransport: Transport = {
    transportId: 'real',
    send: async () => successResponse,
    isAvailable: async () => true,
  };

  const testRequest: ProviderRequest = {
    requestId: 'req-1',
    executionId: 'exe-1',
    method: 'POST',
    url: 'https://www.googleapis.com/calendar/v3/calendars/sandbox/events',
    headers: { Authorization: 'Bearer token' },
    body: { summary: 'Test' },
    bodyFormat: 'json',
    idempotencyKey: 'ik-1',
    timeoutMs: 30000,
    retryAttempt: 0,
    maxRetries: 3,
    metadata: {},
  };

  it('passes through to real transport when no rules', async () => {
    const harness = new FailureInjectionHarness(realTransport);
    const response = await harness.send(testRequest);
    expect(response.statusCode).toBe(200);
  });

  it('injects 429 rate-limit when rule matches', async () => {
    const harness = new FailureInjectionHarness(realTransport);
    harness.addRule({ mode: 'RATE_LIMIT', probability: 1.0 });
    const response = await harness.send(testRequest);
    expect(response.statusCode).toBe(429);
  });

  it('injects 500 server error when rule matches', async () => {
    const harness = new FailureInjectionHarness(realTransport);
    harness.addRule({ mode: 'SERVER_ERROR', probability: 1.0 });
    const response = await harness.send(testRequest);
    expect(response.statusCode).toBe(500);
  });

  it('injects 200 with malformed body when rule matches', async () => {
    const harness = new FailureInjectionHarness(realTransport);
    harness.addRule({ mode: 'MALFORMED_RESPONSE', probability: 1.0 });
    const response = await harness.send(testRequest);
    expect(response.statusCode).toBe(200);
    expect((response.body as any).kind).toBe('unknown');
  });

  it('injects timeout error when rule matches', async () => {
    const harness = new FailureInjectionHarness(realTransport);
    harness.addRule({ mode: 'TIMEOUT', probability: 1.0 });
    await expect(harness.send(testRequest)).rejects.toThrow('INJECTED_TIMEOUT');
  });

  it('injects network partition on isAvailable', async () => {
    const harness = new FailureInjectionHarness(realTransport);
    harness.addRule({ mode: 'NETWORK_PARTITION', probability: 1.0 });
    const available = await harness.isAvailable();
    expect(available).toBe(false);
  });

  it('bypass skips all injection rules', async () => {
    const harness = new FailureInjectionHarness(realTransport);
    harness.addRule({ mode: 'SERVER_ERROR', probability: 1.0 });
    harness.setBypass(true);
    const response = await harness.send(testRequest);
    expect(response.statusCode).toBe(200);
  });

  it('tracks injection report', async () => {
    const harness = new FailureInjectionHarness(realTransport);
    harness.addRule({ mode: 'SERVER_ERROR', probability: 1.0 });
    await harness.send(testRequest);
    const report = harness.getInjectionReport();
    expect(report.length).toBe(1);
    expect(report[0].rule.mode).toBe('SERVER_ERROR');
  });

  it('clearReport resets tracking', async () => {
    const harness = new FailureInjectionHarness(realTransport);
    harness.addRule({ mode: 'SERVER_ERROR', probability: 1.0 });
    await harness.send(testRequest);
    harness.clearReport();
    expect(harness.getInjectionReport().length).toBe(0);
  });

  it('clearRules removes all rules', async () => {
    const harness = new FailureInjectionHarness(realTransport);
    harness.addRule({ mode: 'SERVER_ERROR', probability: 1.0 });
    harness.clearRules();
    const response = await harness.send(testRequest);
    expect(response.statusCode).toBe(200);
  });
});
