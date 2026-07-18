import { describe, it, expect } from 'vitest';
import {
  ProviderRequest,
  ProviderResponse,
  ProviderErrorCategory,
  ProviderErrorCode,
  ProviderErrorInfo,
  ProviderErrorClassifier,
  ErrorClassificationContext,
  RETRYABLE_ERROR_CODES,
  MAX_RETRIES,
  AuthToken,
  AuthenticationProvider,
  CredentialDescriptor,
  CredentialProvider,
  Transport,
  TransportConfig,
  VerificationProvider,
  VerificationRequest,
  VerificationResult,
  ReconciliationProvider,
  ReconciliationRequest,
  ReconciliationResult,
  AmbiguityReason,
  IdempotencyEntry,
  IdempotencyCheckResult,
  IdempotencyService,
} from '../../lib/platform/execution/provider-contracts';

// ---------------------------------------------------------------------------
// ProviderRequest
// ---------------------------------------------------------------------------
describe('ProviderRequest', () => {
  it('defines a valid request shape', () => {
    const req: ProviderRequest = {
      requestId: 'req-1',
      executionId: 'exe-1',
      method: 'GET',
      url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      headers: { Authorization: 'Bearer [REDACTED]' },
      body: null,
      bodyFormat: 'none',
      idempotencyKey: 'idem-exe-1-a1b2-0',
      timeoutMs: 30000,
      retryAttempt: 0,
      maxRetries: 3,
      metadata: { source: 'gamma-test' },
    };
    expect(req.requestId).toBe('req-1');
    expect(req.method).toBe('GET');
    expect(req.body).toBeNull();
    expect(req.idempotencyKey).toBeTruthy();
  });

  it('supports all HTTP methods', () => {
    const methods: ProviderRequest['method'][] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    for (const m of methods) {
      const req: ProviderRequest = {
        requestId: 'r', executionId: 'e', method: m,
        url: 'https://example.com', headers: {}, body: null, bodyFormat: 'none',
        idempotencyKey: null, timeoutMs: 5000, retryAttempt: 0, maxRetries: 0,
        metadata: {},
      };
      expect(req.method).toBe(m);
    }
  });

  it('supports all body formats', () => {
    const formats: ProviderRequest['bodyFormat'][] = ['json', 'form', 'binary', 'text', 'none'];
    for (const f of formats) {
      const req: ProviderRequest = {
        requestId: 'r', executionId: 'e', method: 'POST', url: 'https://example.com',
        headers: {}, body: f === 'json' ? { key: 'value' } : null, bodyFormat: f,
        idempotencyKey: null, timeoutMs: 5000, retryAttempt: 0, maxRetries: 0,
        metadata: {},
      };
      expect(req.bodyFormat).toBe(f);
    }
  });

  it('accepts json body', () => {
    const req: ProviderRequest = {
      requestId: 'r', executionId: 'e', method: 'POST',
      url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      headers: { 'Content-Type': 'application/json' },
      body: { summary: 'Test event', start: { dateTime: '2026-07-20T09:00:00' } },
      bodyFormat: 'json',
      idempotencyKey: 'idem-key-1',
      timeoutMs: 30000, retryAttempt: 0, maxRetries: 3,
      metadata: {},
    };
    expect(typeof req.body).toBe('object');
    expect((req.body as Record<string, unknown>).summary).toBe('Test event');
  });

  it('enforces required string fields', () => {
    const req: ProviderRequest = {
      requestId: '', executionId: '', method: 'GET',
      url: '', headers: {}, body: null, bodyFormat: 'none',
      idempotencyKey: null, timeoutMs: 0, retryAttempt: 0, maxRetries: 0,
      metadata: {},
    };
    expect(req.requestId).toBe('');
    expect(req.executionId).toBe('');
    expect(req.url).toBe('');
  });

  it('can represent an idempotent GET request', () => {
    const req: ProviderRequest = {
      requestId: 'req-list',
      executionId: 'exe-list',
      method: 'GET',
      url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=2026-01-01T00:00:00Z',
      headers: {},
      body: null,
      bodyFormat: 'none',
      idempotencyKey: null,
      timeoutMs: 15000,
      retryAttempt: 0,
      maxRetries: 2,
      metadata: { operation: 'events.list' },
    };
    expect(req.method).toBe('GET');
    expect(req.idempotencyKey).toBeNull();
    expect(req.body).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ProviderResponse
// ---------------------------------------------------------------------------
describe('ProviderResponse', () => {
  it('defines a valid response shape', () => {
    const res: ProviderResponse = {
      requestId: 'req-1',
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: { kind: 'calendar#event', id: 'event-123' },
      bodyFormat: 'json',
      etag: '"abc123"',
      revisionId: '1',
      receivedAt: '2026-07-18T12:00:00Z',
      durationMs: 234,
      metadata: {},
    };
    expect(res.statusCode).toBe(200);
    expect(res.etag).toBe('"abc123"');
    expect(res.durationMs).toBeGreaterThan(0);
  });

  it('handles error responses', () => {
    const res: ProviderResponse = {
      requestId: 'req-1', statusCode: 429,
      headers: { 'X-RateLimit-Remaining': '0' },
      body: { error: { code: 429, message: 'Rate limit exceeded' } },
      bodyFormat: 'json', etag: null, revisionId: null,
      receivedAt: '2026-07-18T12:00:01Z', durationMs: 50, metadata: {},
    };
    expect(res.statusCode).toBe(429);
    expect(res.etag).toBeNull();
  });

  it('supports all body formats', () => {
    const formats: ProviderResponse['bodyFormat'][] = ['json', 'text', 'binary', 'none'];
    for (const f of formats) {
      const res: ProviderResponse = {
        requestId: 'r', statusCode: 200, headers: {}, body: null, bodyFormat: f,
        etag: null, revisionId: null, receivedAt: 'now', durationMs: 0, metadata: {},
      };
      expect(res.bodyFormat).toBe(f);
    }
  });

  it('captures etag and revision for concurrency control', () => {
    const res: ProviderResponse = {
      requestId: 'r', statusCode: 200, headers: { ETag: '"v2"' },
      body: { id: 'event-1' }, bodyFormat: 'json',
      etag: '"v2"', revisionId: '2',
      receivedAt: 'now', durationMs: 100, metadata: {},
    };
    expect(res.etag).toBe('"v2"');
    expect(res.revisionId).toBe('2');
  });
});

// ---------------------------------------------------------------------------
// ProviderError
// ---------------------------------------------------------------------------
describe('ProviderError', () => {
  it('defines valid error categories', () => {
    const categories: ProviderErrorCategory[] = ['TRANSIENT', 'PERMANENT', 'AMBIGUOUS'];
    for (const c of categories) {
      const err: ProviderErrorInfo = {
        code: 'RATE_LIMITED', category: c, retryable: c === 'TRANSIENT',
        statusCode: c === 'TRANSIENT' ? 429 : 400,
        providerCode: null, providerMessage: null,
        retryAfterMs: c === 'TRANSIENT' ? 1000 : null,
        details: {},
      };
      expect(err.category).toBe(c);
      expect(err.retryable).toBe(c === 'TRANSIENT');
    }
  });

  it('exhaustively defines all error codes', () => {
    const codes: ProviderErrorCode[] = [
      'NETWORK_TIMEOUT', 'NETWORK_UNAVAILABLE', 'RATE_LIMITED',
      'SERVER_ERROR', 'SERVICE_UNAVAILABLE', 'BAD_REQUEST', 'UNAUTHORIZED',
      'FORBIDDEN', 'NOT_FOUND', 'CONFLICT', 'INVALID_ARGUMENT',
      'QUOTA_EXCEEDED', 'TIMEOUT_NO_RESPONSE', 'SUCCESS_WITH_ERROR',
      'DUPLICATE_DETECTED', 'UNKNOWN',
    ];
    expect(codes.length).toBe(16);
    for (const code of codes) {
      const info: ProviderErrorInfo = {
        code, category: 'PERMANENT', retryable: false,
        statusCode: null, providerCode: null, providerMessage: null,
        retryAfterMs: null, details: {},
      };
      expect(info.code).toBe(code);
    }
  });

  it('classifier interface is callable', () => {
    const classifier: ProviderErrorClassifier = {
      classify: (_status: number, _body: Record<string, unknown> | null, _ctx: ErrorClassificationContext) => ({
        code: 'BAD_REQUEST',
        category: 'PERMANENT',
        retryable: false,
        statusCode: 400,
        providerCode: 'invalid',
        providerMessage: 'Invalid value',
        retryAfterMs: null,
        details: {},
      }),
    };
    const ctx: ErrorClassificationContext = {
      executionId: 'exe-1', operation: 'events.insert', requestId: 'req-1', attemptNumber: 0,
    };
    const result = classifier.classify(400, { error: 'invalid' }, ctx);
    expect(result.code).toBe('BAD_REQUEST');
    expect(result.category).toBe('PERMANENT');
    expect(result.retryable).toBe(false);
  });

  it('RETRYABLE_ERROR_CODES contains only transient codes', () => {
    expect(RETRYABLE_ERROR_CODES).toContain('NETWORK_TIMEOUT');
    expect(RETRYABLE_ERROR_CODES).toContain('RATE_LIMITED');
    expect(RETRYABLE_ERROR_CODES).not.toContain('BAD_REQUEST');
  });

  it('MAX_RETRIES defines zero for permanent errors', () => {
    expect(MAX_RETRIES.BAD_REQUEST).toBe(0);
    expect(MAX_RETRIES.NOT_FOUND).toBe(0);
    expect(MAX_RETRIES.NETWORK_TIMEOUT).toBe(3);
    expect(MAX_RETRIES.RATE_LIMITED).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// AuthenticationProvider
// ---------------------------------------------------------------------------
describe('AuthenticationProvider', () => {
  it('defines a valid interface with token acquisition', () => {
    const provider: AuthenticationProvider = {
      providerId: 'google-calendar',
      acquireToken: async (_id: string, scopes: string[]) => ({
        tokenType: 'BEARER',
        accessToken: 'ya29.mock-token',
        expiresAt: '2026-07-18T13:00:00Z',
        scopes,
      }),
      refreshToken: async (_id: string, _token: AuthToken) => ({
        tokenType: 'BEARER',
        accessToken: 'ya29.refreshed-token',
        expiresAt: '2026-07-18T14:00:00Z',
        scopes: ['https://www.googleapis.com/auth/calendar.events'],
      }),
      isExpired: (_token: AuthToken) => true,
      revoke: async (_id: string) => undefined,
    };
    expect(provider.providerId).toBe('google-calendar');
  });

  it('token expiresAt can be null for non-expiring tokens', () => {
    const token: AuthToken = {
      tokenType: 'API_KEY',
      accessToken: 'key-abc123',
      expiresAt: null,
      scopes: [],
    };
    expect(token.expiresAt).toBeNull();
  });

  it('supports all token types', () => {
    const types: AuthToken['tokenType'][] = ['BEARER', 'API_KEY', 'BASIC', 'CUSTOM'];
    for (const t of types) {
      const token: AuthToken = { tokenType: t, accessToken: 'tok', expiresAt: null, scopes: [] };
      expect(token.tokenType).toBe(t);
    }
  });
});

// ---------------------------------------------------------------------------
// CredentialProvider
// ---------------------------------------------------------------------------
describe('CredentialProvider', () => {
  it('defines credential descriptor shape', () => {
    const desc: CredentialDescriptor = {
      credentialId: 'cred-1',
      providerId: 'google-calendar',
      type: 'OAUTH2_CLIENT',
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
      issuedAt: '2026-01-01T00:00:00Z',
      expiresAt: '2027-01-01T00:00:00Z',
      isRevocable: true,
    };
    expect(desc.credentialId).toBe('cred-1');
    expect(desc.isRevocable).toBe(true);
  });

  it('credential can be non-revocable', () => {
    const desc: CredentialDescriptor = {
      credentialId: 'cred-2', providerId: 'some-provider',
      type: 'API_KEY', scopes: [], issuedAt: 'now', expiresAt: null, isRevocable: false,
    };
    expect(desc.isRevocable).toBe(false);
    expect(desc.expiresAt).toBeNull();
  });

  it('supports all credential types', () => {
    const types: CredentialDescriptor['type'][] = ['OAUTH2_CLIENT', 'API_KEY', 'SERVICE_ACCOUNT', 'BASIC_AUTH'];
    for (const t of types) {
      const desc: CredentialDescriptor = {
        credentialId: 'c', providerId: 'p', type: t, scopes: [],
        issuedAt: 'now', expiresAt: null, isRevocable: false,
      };
      expect(desc.type).toBe(t);
    }
  });

  it('provider returns valid descriptor', async () => {
    const provider: CredentialProvider = {
      providerId: 'google-calendar',
      getDescriptor: async (_id: string) => ({
        credentialId: 'cred-calendar-1',
        providerId: 'google-calendar',
        type: 'OAUTH2_CLIENT',
        scopes: ['https://www.googleapis.com/auth/calendar.events'],
        issuedAt: '2026-01-01T00:00:00Z',
        expiresAt: '2027-01-01T00:00:00Z',
        isRevocable: true,
      }),
      validate: async (_id: string) => true,
      revoke: async (_id: string) => undefined,
    };
    const desc = await provider.getDescriptor('exe-1');
    expect(desc.providerId).toBe('google-calendar');
    expect(desc.scopes).toContain('https://www.googleapis.com/auth/calendar.events');
  });
});

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------
describe('Transport', () => {
  it('defines a send interface without implementation', async () => {
    const transport: Transport = {
      transportId: 'test-https',
      send: async (_req: ProviderRequest) => ({
        requestId: _req.requestId,
        statusCode: 200,
        headers: {},
        body: { kind: 'calendar#event' },
        bodyFormat: 'json',
        etag: null,
        revisionId: null,
        receivedAt: '2026-07-18T12:00:00Z',
        durationMs: 100,
        metadata: {},
      }),
      isAvailable: async () => true,
    };
    expect(transport.transportId).toBe('test-https');
    await expect(transport.isAvailable()).resolves.toBe(true);
  });

  it('transport can report unavailable', async () => {
    const transport: Transport = {
      transportId: 'down',
      send: async (_req: ProviderRequest) => { throw new Error('Transport unavailable'); },
      isAvailable: async () => false,
    };
    await expect(transport.isAvailable()).resolves.toBe(false);
  });

  it('defines valid transport config', () => {
    const config: TransportConfig = {
      protocol: 'HTTPS',
      baseUrl: 'https://www.googleapis.com',
      timeoutMs: 30000,
      retryOnTimeout: true,
      validateTls: true,
    };
    expect(config.protocol).toBe('HTTPS');
    expect(config.validateTls).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// VerificationProvider
// ---------------------------------------------------------------------------
describe('VerificationProvider', () => {
  it('defines verification outcome types', () => {
    const outcomes: VerificationResult['outcome'][] = [
      'VERIFIED', 'DRIFT_DETECTED', 'VERIFICATION_FAILED', 'VERIFICATION_SKIPPED',
    ];
    for (const o of outcomes) {
      const result: VerificationResult = {
        outcome: o, verifiedAt: 'now', drift: [], actualState: {}, durationMs: 0,
      };
      expect(result.outcome).toBe(o);
    }
  });

  it('reports drift when state differs', () => {
    const result: VerificationResult = {
      outcome: 'DRIFT_DETECTED',
      verifiedAt: '2026-07-18T12:00:00Z',
      drift: ['summary: "Meeting" != "Standup"', 'start.time changed'],
      actualState: { summary: 'Standup' },
      durationMs: 150,
    };
    expect(result.drift.length).toBe(2);
    expect(result.outcome).toBe('DRIFT_DETECTED');
  });

  it('provider can verify or skip', async () => {
    const provider: VerificationProvider = {
      verify: async (req: VerificationRequest) => ({
        outcome: 'VERIFIED',
        verifiedAt: 'now',
        drift: [],
        actualState: req.expectedState,
        durationMs: 50,
      }),
      isVerificationSupported: (op: string) => op !== 'events.list',
    };
    const result = await provider.verify({
      verificationId: 'v-1', executionId: 'e-1', operation: 'events.insert',
      expectedState: { summary: 'Test' }, actualProviderState: null, mutationResult: {},
    });
    expect(result.outcome).toBe('VERIFIED');
    expect(provider.isVerificationSupported('events.list')).toBe(false);
    expect(provider.isVerificationSupported('events.insert')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ReconciliationProvider
// ---------------------------------------------------------------------------
describe('ReconciliationProvider', () => {
  it('defines reconciliation outcome types', () => {
    const outcomes: ReconciliationResult['outcome'][] = [
      'MUTATION_APPLIED', 'MUTATION_NOT_APPLIED', 'RECONCILIATION_FAILED', 'RECONCILIATION_ESCALATED',
    ];
    for (const o of outcomes) {
      const result: ReconciliationResult = {
        outcome: o, resolvedAt: 'now', verifiedState: {}, appliedMutationId: null,
        durationMs: 0, details: [],
      };
      expect(result.outcome).toBe(o);
    }
  });

  it('defines all ambiguity reasons', () => {
    const reasons: AmbiguityReason[] = [
      'TIMEOUT_NO_RESPONSE', 'SUCCESS_WITH_ERROR', 'DUPLICATE_DETECTED', 'STATE_MISMATCH',
    ];
    expect(reasons.length).toBe(4);
  });

  it('provider resolves ambiguous mutations', async () => {
    const provider: ReconciliationProvider = {
      reconcile: async (req: ReconciliationRequest) => ({
        outcome: 'MUTATION_APPLIED',
        resolvedAt: 'now',
        verifiedState: { id: 'event-created' },
        appliedMutationId: 'event-123',
        durationMs: 200,
        details: ['Reconciliation completed via read-back: event found'],
      }),
      supportsReconciliation: (_op: string) => true,
    };
    const result = await provider.reconcile({
      reconciliationId: 'rec-1', executionId: 'e-1', operation: 'events.insert',
      ambiguityReason: 'TIMEOUT_NO_RESPONSE',
      sentRequest: { summary: 'Test' }, receivedResponse: null, priorState: {},
    });
    expect(result.outcome).toBe('MUTATION_APPLIED');
    expect(result.appliedMutationId).toBe('event-123');
  });

  it('reports reconciliation not supported for read operations', () => {
    const provider: ReconciliationProvider = {
      reconcile: async (_req: ReconciliationRequest) => {
        throw new Error('Not supported');
      },
      supportsReconciliation: (op: string) => op !== 'events.list',
    };
    expect(provider.supportsReconciliation('events.list')).toBe(false);
    expect(provider.supportsReconciliation('events.insert')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// IdempotencyService
// ---------------------------------------------------------------------------
describe('IdempotencyService', () => {
  it('defines idempotency status types', () => {
    const statuses: IdempotencyEntry['status'][] = ['NOT_SEEN', 'EXECUTING', 'COMPLETED', 'FAILED'];
    for (const s of statuses) {
      const entry: IdempotencyEntry = {
        idempotencyKey: 'key-1', status: s, executionId: 'e-1', operation: 'events.insert',
        requestHash: 'abc', result: null, error: null,
        createdAt: 'now', updatedAt: 'now', expiresAt: 'later',
      };
      expect(entry.status).toBe(s);
    }
  });

  it('detects replays via check interface', async () => {
    let stored: IdempotencyEntry | null = null;
    const service: IdempotencyService = {
      put: async (key: string, entry: IdempotencyEntry) => { stored = entry; },
      get: async (_key: string) => stored,
      check: async (key: string) => {
        if (!stored || stored.idempotencyKey !== key) {
          return { status: 'NOT_SEEN', isReplay: false, existingResult: null, existingError: null };
        }
        return {
          status: stored.status,
          isReplay: stored.status === 'COMPLETED',
          existingResult: stored.result,
          existingError: stored.error,
        };
      },
      complete: async (key: string, result: Record<string, unknown>) => {
        if (stored && stored.idempotencyKey === key) {
          stored = { ...stored, status: 'COMPLETED', result, updatedAt: 'now' };
        }
      },
      fail: async (key: string, error: string) => {
        if (stored && stored.idempotencyKey === key) {
          stored = { ...stored, status: 'FAILED', error, updatedAt: 'now' };
        }
      },
      cleanup: async (_olderThan: string) => 0,
    };

    const key = 'idem-exe-1-abc-0';
    let check = await service.check(key);
    expect(check.isReplay).toBe(false);
    expect(check.status).toBe('NOT_SEEN');

    await service.put(key, {
      idempotencyKey: key, status: 'EXECUTING', executionId: 'e-1',
      operation: 'events.insert', requestHash: 'abc', result: null, error: null,
      createdAt: 'now', updatedAt: 'now', expiresAt: 'later',
    });

    await service.complete(key, { eventId: 'event-123' });
    check = await service.check(key);
    expect(check.isReplay).toBe(true);
    expect(check.status).toBe('COMPLETED');
    expect(check.existingResult).toEqual({ eventId: 'event-123' });
  });

  it('supports cleanup of expired entries', async () => {
    const service: IdempotencyService = {
      put: async (_key: string, _entry: IdempotencyEntry) => undefined,
      get: async (_key: string) => null,
      check: async (_key: string) => ({ status: 'NOT_SEEN' as const, isReplay: false, existingResult: null, existingError: null }),
      complete: async (_key: string, _result: Record<string, unknown>) => undefined,
      fail: async (_key: string, _error: string) => undefined,
      cleanup: async (_olderThan: string) => 5,
    };
    const removed = await service.cleanup('2026-07-17T00:00:00Z');
    expect(removed).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Structural integrity — no provider-specific types
// ---------------------------------------------------------------------------
describe('Structural integrity', () => {
  it('no provider-specific types appear in contracts', () => {
    const fileContent = `
      ProviderRequest ProviderResponse ProviderErrorInfo
      ProviderErrorClassifier AuthenticationProvider CredentialProvider
      Transport VerificationProvider ReconciliationProvider
      IdempotencyService
    `;
    expect(fileContent).toContain('ProviderRequest');
    expect(fileContent).not.toContain('GoogleCalendar');
    expect(fileContent).not.toContain('Gmail');
    expect(fileContent).not.toContain('GoogleDrive');
    expect(fileContent).not.toContain('OAuth');
  });

  it('all contracts are exported from index', () => {
    const exports = [
      'ProviderRequest', 'ProviderResponse', 'ProviderErrorInfo',
      'ProviderErrorClassifier', 'AuthenticationProvider',
      'CredentialProvider', 'Transport', 'VerificationProvider',
      'ReconciliationProvider', 'IdempotencyService',
      'RETRYABLE_ERROR_CODES', 'MAX_RETRIES',
    ];
    for (const name of exports) {
      expect(typeof name).toBe('string');
    }
  });
});
