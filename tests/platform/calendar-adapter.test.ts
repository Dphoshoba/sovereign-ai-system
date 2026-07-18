import { describe, it, expect, vi } from 'vitest';
import { GoogleCalendarAdapter } from '../../lib/platform/execution/adapters/calendar/google-calendar-adapter';
import { CalendarAuthenticationProvider } from '../../lib/platform/execution/adapters/calendar/calendar-authentication-provider';
import { CalendarRequestBuilder } from '../../lib/platform/execution/adapters/calendar/calendar-request-builder';
import { CalendarResponseParser } from '../../lib/platform/execution/adapters/calendar/calendar-response-parser';
import { Transport } from '../../lib/platform/execution/provider-contracts/transport';
import { ProviderResponse } from '../../lib/platform/execution/provider-contracts/provider-response';
import { AuthenticationProvider, AuthToken } from '../../lib/platform/execution/provider-contracts/authentication-provider';
import { AdapterRegistry } from '../../lib/platform/execution/adapters/adapter-registry';
import { AdapterFactory } from '../../lib/platform/execution/adapters/adapter-factory';
import { AdapterLifecycle } from '../../lib/platform/execution/adapters/adapter-lifecycle';
import { AdapterValidator } from '../../lib/platform/execution/adapters/adapter-validator';
import { QueueCandidate } from '../../lib/platform/queue/types';
import { ConnectorRuntimeCapabilities } from '../../lib/platform/execution/capabilities';
import { GovernanceDecision } from '../../lib/platform/governance/types';
import { ExecutionRequest, createExecutionRequest } from '../../lib/platform/execution/execution-request';
import { VerificationProvider, VerificationResult, VerificationRequest } from '../../lib/platform/execution/provider-contracts/verification-provider';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const eventsListResponse200: ProviderResponse = {
  requestId: 'req-list-1',
  statusCode: 200,
  headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  body: {
    kind: 'calendar#events',
    etag: '"etag-list"',
    summary: 'test@example.com',
    timeZone: 'America/New_York',
    accessRole: 'reader',
    defaultReminders: [{ method: 'popup', minutes: 30 }],
    nextPageToken: null,
    nextSyncToken: 'sync-token',
    items: [
      {
        kind: 'calendar#event', id: 'event-001', status: 'confirmed',
        htmlLink: 'https://calendar.google.com/event?id=event-001',
        created: '2026-07-17T10:00:00.000Z', updated: '2026-07-17T10:30:00.000Z',
        summary: 'Team Standup', description: null, location: null, colorId: '1',
        creator: { id: null, email: 'creator@test.com', displayName: 'Creator', self: true },
        organizer: { id: null, email: 'org@test.com', displayName: 'Org', self: true },
        start: { dateTime: '2026-07-20T09:00:00', date: null, timeZone: 'America/New_York' },
        end: { dateTime: '2026-07-20T09:30:00', date: null, timeZone: 'America/New_York' },
        recurringEventId: null, originalStartTime: null,
        iCalUID: 'event-001@google.com', sequence: 0,
        reminders: { useDefault: true, overrides: null },
        eventType: 'default',
      },
    ],
  },
  bodyFormat: 'json',
  etag: '"etag-list"',
  revisionId: null,
  receivedAt: '2026-07-18T12:00:00Z',
  durationMs: 234,
  metadata: {},
};

const eventsGetResponse200: ProviderResponse = {
  requestId: 'req-get-1',
  statusCode: 200,
  headers: { 'Content-Type': 'application/json; charset=UTF-8', ETag: '"event-etag"' },
  body: {
    kind: 'calendar#event',
    etag: '"event-etag"',
    id: 'event-001',
    status: 'confirmed',
    htmlLink: 'https://calendar.google.com/event?id=event-001',
    created: '2026-07-17T10:00:00.000Z',
    updated: '2026-07-17T10:30:00.000Z',
    summary: 'Team Standup',
    description: 'Daily standup',
    location: null,
    colorId: '1',
    creator: { id: null, email: 'creator@test.com', displayName: 'Creator', self: true },
    organizer: { id: null, email: 'org@test.com', displayName: 'Org', self: true },
    start: { dateTime: '2026-07-20T09:00:00', date: null, timeZone: 'America/New_York' },
    end: { dateTime: '2026-07-20T09:30:00', date: null, timeZone: 'America/New_York' },
    recurringEventId: null,
    originalStartTime: null,
    iCalUID: 'event-001@google.com',
    sequence: 0,
    reminders: { useDefault: true, overrides: null },
    eventType: 'default',
  },
  bodyFormat: 'json',
  etag: '"event-etag"',
  revisionId: '1',
  receivedAt: '2026-07-18T12:00:01Z',
  durationMs: 150,
  metadata: {},
};

const calendarListResponse200: ProviderResponse = {
  requestId: 'req-cal-list-1',
  statusCode: 200,
  headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  body: {
    kind: 'calendar#calendarList',
    etag: '"cal-list-etag"',
    nextPageToken: null,
    nextSyncToken: null,
    items: [
      { id: 'primary', summary: 'My Calendar', description: null, timeZone: 'America/New_York',
        accessRole: 'owner', primary: true, backgroundColor: '#ffffff', foregroundColor: '#000000',
        selected: true, etag: '"cal-etag-1"' },
    ],
  },
  bodyFormat: 'json',
  etag: '"cal-list-etag"',
  revisionId: null,
  receivedAt: '2026-07-18T12:00:00Z',
  durationMs: 100,
  metadata: {},
};

const errorResponse404: ProviderResponse = {
  requestId: 'req-404',
  statusCode: 404,
  headers: {},
  body: { error: { code: 404, message: 'Not Found' } },
  bodyFormat: 'json',
  etag: null,
  revisionId: null,
  receivedAt: '2026-07-18T12:00:00Z',
  durationMs: 50,
  metadata: {},
};

const mockTransport: Transport = {
  transportId: 'mock-https',
  send: async (_req: any) => eventsListResponse200,
  isAvailable: async () => true,
};

const mockDecision: GovernanceDecision = {
  decisionId: 'dec-cal-1',
  requestId: 'req-cal-1',
  governanceVersion: '1.0.0',
  policyVersion: '1.0.0',
  approvalRequired: false,
  approvalLevel: 'NONE',
  blockingReasons: [],
  warnings: [],
  riskSummary: { level: 'LOW', factors: [] },
  policyResults: [],
  executionEligible: false,
  queueEligible: true,
  reviewerInstructions: '',
};

const mockCandidate: QueueCandidate = {
  queueId: 'q-cal-1',
  connectorId: 'google-calendar',
  operation: 'events.list',
  previewId: 'prev-1',
  decisionId: 'dec-cal-1',
  reviewPackageId: 'pkg-1',
  governanceVersion: '1.0.0',
  policyVersion: '1.0.0',
  executionManifest: {
    intendedOperation: 'events.list',
    requiredScopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    requiredApprovals: ['NONE'],
    governanceDecisionId: 'dec-cal-1',
    blockingConditions: [],
    validationSummary: 'Read-only calendar operation',
    resourceSummary: { sourceId: null, targetId: 'primary', resourceType: 'calendar' },
    executionPrerequisites: [],
  },
  idempotencyToken: 'idem-cal-1',
  replayProtection: {
    duplicateDetectionKey: 'dup-cal-1',
    replayWindowMetadata: { windowStart: 'S', windowEnd: 'E' },
    conflictIdentity: 'c-cal-1',
    queueUniqueness: 'u-cal-1',
  },
  dependencyGraph: { dependsOn: [], executionOrder: 1 },
  auditReference: 'audit-cal-1',
  queueEligible: true,
  executionEligible: false,
  executionAuthorized: false,
  metadata: { generatedAt: 'now', version: '1.0.0' },
};

const mockCapabilities: ConnectorRuntimeCapabilities = {
  prepare: true, preflight: true, execute: true, verify: true, rollback: false, audit: true,
  stage: '3C', providerMutationAllowed: false, networkMutationAllowed: false,
};

// ---------------------------------------------------------------------------
// CalendarRequestBuilder
// ---------------------------------------------------------------------------
describe('CalendarRequestBuilder', () => {
  const builder = new CalendarRequestBuilder();

  it('builds events.list request with correct URL', () => {
    const req = builder.buildListEvents('exe-1', { calendarId: 'primary' }, 'tok-123');
    expect(req.method).toBe('GET');
    expect(req.url).toContain('/calendars/primary/events');
    expect(req.headers['Authorization']).toBe('Bearer tok-123');
    expect(req.bodyFormat).toBe('none');
    expect(req.body).toBeNull();
    expect(req.idempotencyKey).toBeNull();
  });

  it('builds events.get request with event ID in URL', () => {
    const req = builder.buildGetEvent('exe-1', { calendarId: 'primary', eventId: 'event-001' }, 'tok-123');
    expect(req.method).toBe('GET');
    expect(req.url).toContain('/calendars/primary/events/event-001');
    expect(req.headers['Authorization']).toBe('Bearer tok-123');
  });

  it('builds calendarList.list request', () => {
    const req = builder.buildListCalendars('exe-1', { maxResults: 50 }, 'tok-123');
    expect(req.method).toBe('GET');
    expect(req.url).toContain('/users/me/calendarList');
    expect(req.url).toContain('maxResults=50');
  });

  it('encodes special characters in IDs', () => {
    const req = builder.buildGetEvent('exe-1', { calendarId: 'user@domain.com', eventId: 'event/id' }, 'tok-123');
    expect(req.url).toContain('user%40domain.com');
    expect(req.url).toContain('event%2Fid');
    expect(req.url).toContain('https://www.googleapis.com');
  });

  it('includes only non-null query parameters for events.list', () => {
    const req = builder.buildListEvents('exe-1', {
      calendarId: 'primary', timeMin: '2026-01-01T00:00:00Z', maxResults: 100, orderBy: 'startTime',
    }, 'tok-123');
    expect(req.url).toContain('timeMin=2026-01-01T00%3A00%3A00Z');
    expect(req.url).toContain('maxResults=100');
    expect(req.url).toContain('orderBy=startTime');
  });

  it('generates sequential request IDs', () => {
    const builder2 = new CalendarRequestBuilder();
    const req1 = builder2.buildListEvents('e1', { calendarId: 'primary' }, 'tok');
    const req2 = builder2.buildListEvents('e1', { calendarId: 'primary' }, 'tok');
    expect(req1.requestId).toBe('cal-req-1');
    expect(req2.requestId).toBe('cal-req-2');
  });
});

// ---------------------------------------------------------------------------
// CalendarResponseParser
// ---------------------------------------------------------------------------
describe('CalendarResponseParser', () => {
  const parser = new CalendarResponseParser();

  it('parses events.list success response', () => {
    const result = parser.parseEventList(eventsListResponse200);
    expect(result.success).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.data!.kind).toBe('calendar#events');
    expect(result.data!.items.length).toBe(1);
    expect(result.data!.items[0].summary).toBe('Team Standup');
  });

  it('parses events.get success response', () => {
    const result = parser.parseEventGet(eventsGetResponse200);
    expect(result.success).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.data!.id).toBe('event-001');
    expect(result.data!.summary).toBe('Team Standup');
  });

  it('rejects events.list with wrong kind', () => {
    const badKind: ProviderResponse = { ...eventsListResponse200, body: { kind: 'calendar#somethingElse', items: [] } };
    const result = parser.parseEventList(badKind);
    expect(result.success).toBe(false);
    expect(result.error).toContain('UNEXPECTED_KIND');
  });

  it('rejects events.list with missing items', () => {
    const noItems: ProviderResponse = { ...eventsListResponse200, body: { kind: 'calendar#events' } };
    const result = parser.parseEventList(noItems);
    expect(result.success).toBe(false);
    expect(result.error).toContain('MISSING_ITEMS');
  });

  it('rejects events.get with missing id', () => {
    const noId: ProviderResponse = { ...eventsGetResponse200, body: { kind: 'calendar#event' } };
    const result = parser.parseEventGet(noId);
    expect(result.success).toBe(false);
    expect(result.error).toContain('MISSING_EVENT_ID');
  });

  it('handles HTTP 404 in events.get', () => {
    const result = parser.parseEventGet(errorResponse404);
    expect(result.success).toBe(false);
    expect(result.error).toContain('NOT_FOUND');
  });

  it('parses calendarList.list success response', () => {
    const result = parser.parseCalendarList(calendarListResponse200);
    expect(result.success).toBe(true);
    expect(result.data!.items.length).toBe(1);
    expect(result.data!.items[0].accessRole).toBe('owner');
  });

  it('rejects calendarList.list with wrong kind', () => {
    const res: ProviderResponse = { ...calendarListResponse200, body: { kind: 'calendar#wrong', items: [] } };
    const result = parser.parseCalendarList(res);
    expect(result.success).toBe(false);
  });

  it('handles non-object body', () => {
    const res: ProviderResponse = { ...eventsListResponse200, body: null };
    const result = parser.parseEventList(res);
    expect(result.success).toBe(false);
    expect(result.error).toContain('INVALID_RESPONSE_BODY');
  });

  it('maps HTTP 401 to UNAUTHORIZED error', () => {
    const res: ProviderResponse = { ...errorResponse404, statusCode: 401 };
    const result = parser.parseEventGet(res);
    expect(result.error).toContain('UNAUTHORIZED');
  });

  it('maps HTTP 429 to RATE_LIMITED error', () => {
    const res: ProviderResponse = { ...errorResponse404, statusCode: 429 };
    const result = parser.parseEventGet(res);
    expect(result.error).toContain('RATE_LIMITED');
  });

  it('maps HTTP 500 to SERVER_ERROR', () => {
    const res: ProviderResponse = { ...errorResponse404, statusCode: 500 };
    const result = parser.parseEventGet(res);
    expect(result.error).toContain('SERVER_ERROR');
  });
});

// ---------------------------------------------------------------------------
// CalendarAuthenticationProvider
// ---------------------------------------------------------------------------
describe('CalendarAuthenticationProvider', () => {
  it('acquires token with readonly scope', async () => {
    const auth = new CalendarAuthenticationProvider();
    const token = await auth.acquireToken('exe-1', []);
    expect(token.tokenType).toBe('BEARER');
    expect(token.accessToken).toContain('ya29.calendar-');
    expect(token.scopes).toContain('https://www.googleapis.com/auth/calendar.readonly');
  });

  it('merges provided scopes with default read scopes', async () => {
    const auth = new CalendarAuthenticationProvider();
    const token = await auth.acquireToken('exe-1', ['https://www.googleapis.com/auth/calendar']);
    expect(token.scopes.length).toBe(2);
  });

  it('refreshToken returns new token', async () => {
    const auth = new CalendarAuthenticationProvider();
    const old = await auth.acquireToken('exe-1', []);
    const refreshed = await auth.refreshToken('exe-1', old);
    expect(refreshed.accessToken).not.toBe(old.accessToken);
    expect(refreshed.accessToken).toContain('ya29.refreshed-');
  });

  it('isExpired returns true for near-expiry token', () => {
    const auth = new CalendarAuthenticationProvider();
    const expired: AuthToken = {
      tokenType: 'BEARER',
      accessToken: 'tok',
      expiresAt: new Date(Date.now() + 60 * 1000).toISOString(),
      scopes: [],
    };
    expect(auth.isExpired(expired)).toBe(true);
  });

  it('isExpired returns false for far-future token', () => {
    const auth = new CalendarAuthenticationProvider();
    const valid: AuthToken = {
      tokenType: 'BEARER',
      accessToken: 'tok',
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      scopes: [],
    };
    expect(auth.isExpired(valid)).toBe(false);
  });

  it('revoke clears stored token', async () => {
    const auth = new CalendarAuthenticationProvider();
    await auth.acquireToken('exe-1', []);
    await auth.revoke('exe-1');
    const token = await auth.acquireToken('exe-1', []);
    expect(token.accessToken).toBeTruthy();
  });

  it('supports API_KEY token type', () => {
    const auth = new CalendarAuthenticationProvider('API_KEY');
    expect(auth.providerId).toBe('google-calendar-auth');
  });
});

// ---------------------------------------------------------------------------
// GoogleCalendarAdapter
// ---------------------------------------------------------------------------
describe('GoogleCalendarAdapter', () => {
  const createAdapter = (transport?: Transport, verificationProvider?: VerificationProvider) => {
    const auth = new CalendarAuthenticationProvider();
    const t = transport ?? { ...mockTransport };
    return new GoogleCalendarAdapter(auth, t, verificationProvider);
  };

  const createExecutionRequest = (operation: string): ExecutionRequest => ({
    executionId: `exe-cal-${Date.now()}`,
    queueId: 'q-cal-1',
    connectorId: 'google-calendar',
    operation,
    candidate: { ...mockCandidate, operation },
    decision: mockDecision,
    capabilities: mockCapabilities,
    idempotencyToken: 'idem-token',
    planHash: 'plan-hash-abc',
    requestedAt: '2026-07-18T12:00:00Z',
  });

  describe('initialization and lifecycle', () => {
    it('has correct identity properties', () => {
      const adapter = createAdapter();
      expect(adapter.providerId).toBe('google-calendar');
      expect(adapter.providerVersion).toBe('1.0.0');
      expect(adapter.adapterId).toBe('google-calendar-adapter');
      expect(adapter.supportedOperations).toContain('events.list');
      expect(adapter.supportedOperations).toContain('events.get');
      expect(adapter.supportedConnectorIds).toEqual(['google-calendar']);
    });

    it('initialize sets adapter state', async () => {
      const adapter = createAdapter();
      const validationBefore = await adapter.validate();
      expect(validationBefore.valid).toBe(false);
      expect(validationBefore.errors.some(e => e.startsWith('NOT_INITIALIZED'))).toBe(true);

      await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });
      const validationAfter = await adapter.validate();
      expect(validationAfter.valid).toBe(true);
    });

    it('dispose clears state', async () => {
      const adapter = createAdapter();
      await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });
      await adapter.dispose();
      const validation = await adapter.validate();
      expect(validation.valid).toBe(false);
    });

    it('throws if execute called before initialize', async () => {
      const adapter = createAdapter();
      const req = createExecutionRequest('events.list');
      await expect(adapter.execute(req, mockCandidate)).rejects.toThrow('ADAPTER_NOT_INITIALIZED');
    });
  });

  describe('capability profile', () => {
    it('returns correct risk levels per operation', () => {
      const adapter = createAdapter();
      const profile = adapter.getCapabilityProfile();
      expect(profile.connectorId).toBe('google-calendar');
      expect(profile.supportedOperations.length).toBe(7);
      for (const op of profile.supportedOperations) {
        if (['events.list', 'events.get', 'calendarList.list', 'calendars.get'].includes(op.operation)) {
          expect(op.riskLevel).toBe('READ');
          expect(op.canRollback).toBe(false);
          expect(op.requiredApprovalLevel).toBe('NONE');
        }
        if (op.operation === 'events.insert') {
          expect(op.riskLevel).toBe('MODIFY');
          expect(op.canRollback).toBe(true);
          expect(op.requiredApprovalLevel).toBe('STANDARD');
        }
        if (op.operation === 'events.update') {
          expect(op.riskLevel).toBe('MODIFY');
          expect(op.canRollback).toBe(true);
          expect(op.requiredApprovalLevel).toBe('STANDARD');
        }
        if (op.operation === 'events.delete') {
          expect(op.riskLevel).toBe('DESTRUCTIVE');
          expect(op.canRollback).toBe(true);
          expect(op.requiredApprovalLevel).toBe('HEIGHTENED');
        }
      }
    });

    it('getDescriptor returns correct metadata', () => {
      const adapter = createAdapter();
      const desc = adapter.getDescriptor();
      expect(desc.providerId).toBe('google-calendar');
      expect(desc.riskLevel).toBe('DESTRUCTIVE');
      expect(desc.requiresAuthentication).toBe(true);
    });
  });

  describe('events.list', () => {
    it('sends correct GET request and returns provider state', async () => {
      const transport: Transport = {
        transportId: 'test',
        send: async (req) => {
          expect(req.method).toBe('GET');
          expect(req.url).toContain('/calendars/primary/events');
          expect(req.headers['Authorization']).toContain('Bearer ya29.calendar-');
          return eventsListResponse200;
        },
        isAvailable: async () => true,
      };
      const adapter = createAdapter(transport);
      await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });
      const req = createExecutionRequest('events.list');
      const result = await adapter.execute(req, mockCandidate);
      expect(result.providerState.operation).toBe('events.list');
      expect(result.providerState.statusCode).toBe(200);
      expect(result.etag).toBe('"etag-list"');
    });
  });

  describe('events.get', () => {
    it('sends correct GET request with event ID', async () => {
      const transport: Transport = {
        transportId: 'test',
        send: async (req) => {
          expect(req.method).toBe('GET');
          expect(req.url).toContain('/calendars/primary/events/');
          return eventsGetResponse200;
        },
        isAvailable: async () => true,
      };
      const adapter = createAdapter(transport);
      await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });
      const req = createExecutionRequest('events.get');
      const result = await adapter.execute(req, mockCandidate);
      expect(result.providerState.operation).toBe('events.get');
      expect(result.etag).toBe('"event-etag"');
    });
  });

  describe('rollback', () => {
    it('returns no-op for read-only adapter', async () => {
      const adapter = createAdapter();
      await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });
      const req = createExecutionRequest('events.list');
      const result = await adapter.rollback(req, new Error('test'), mockCandidate);
      expect(result.rollbackApplied).toBe(false);
    });
  });

  describe('audit', () => {
    it('returns execution result with adapter info', async () => {
      const adapter = createAdapter();
      await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });
      const req = createExecutionRequest('events.list');
      const mutationResult = {
        mutationId: 'mut-1',
        providerState: { operation: 'events.list' },
        mutatedAt: '2026-07-18T12:00:00Z',
      };
      const result = await adapter.audit(req, mutationResult, mockCandidate);
      expect(result.adapterId).toBe('google-calendar-adapter');
      expect(result.mutationId).toBe('mut-1');
      expect(result.mutationAttempted).toBe(false);
      expect(result.executionOutcome).toBe('EXECUTION_SUCCEEDED');
    });
  });

  describe('verify', () => {
    it('performs read-back verification for events.list', async () => {
      let callCount = 0;
      const transport: Transport = {
        transportId: 'test',
        send: async (req) => {
          callCount++;
          expect(req.method).toBe('GET');
          return eventsListResponse200;
        },
        isAvailable: async () => true,
      };
      const adapter = createAdapter(transport);
      await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });
      const req = createExecutionRequest('events.list');
      const mutationResult = {
        mutationId: 'mut-1',
        providerState: { operation: 'events.list', body: eventsListResponse200.body, statusCode: 200 },
        mutatedAt: '2026-07-18T12:00:00Z',
      };
      const result = await adapter.verify(req, mutationResult, mockCandidate);
      expect(result.verified).toBe(true);
      expect(callCount).toBeGreaterThanOrEqual(1);
    });

    it('delegates to VerificationProvider if provided', async () => {
      const vp: VerificationProvider = {
        verify: async (_req: VerificationRequest): Promise<VerificationResult> => ({
          outcome: 'VERIFIED', verifiedAt: 'now', drift: [], actualState: {}, durationMs: 10,
        }),
        isVerificationSupported: () => true,
      };
      const adapter = createAdapter(mockTransport, vp);
      await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });
      const req = createExecutionRequest('events.list');
      const mutationResult = {
        mutationId: 'mut-1',
        providerState: { operation: 'events.list', body: eventsListResponse200.body, statusCode: 200 },
        mutatedAt: 'now',
      };
      const result = await adapter.verify(req, mutationResult, mockCandidate);
      expect(result.verified).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Adapter Registry Integration
// ---------------------------------------------------------------------------
describe('Adapter registry integration', () => {
  it('adapter registers successfully through AdapterRegistry', () => {
    const registry = new AdapterRegistry();
    const auth = new CalendarAuthenticationProvider();
    const adapter = new GoogleCalendarAdapter(auth, mockTransport);
    registry.register(adapter);
    expect(registry.isRegistered('google-calendar')).toBe(true);
    expect(registry.get('google-calendar')).toBe(adapter);
    expect(registry.count()).toBe(1);
  });

  it('adapter can be created through AdapterFactory and registered', async () => {
    const registry = new AdapterRegistry();
    const lifecycle = new AdapterLifecycle();
    const validator = new AdapterValidator();
    const factory = new AdapterFactory(registry, lifecycle, validator);

    factory.registerProviderType('google-calendar', (config) => {
      const auth = new CalendarAuthenticationProvider();
      return new GoogleCalendarAdapter(auth, mockTransport);
    });

    const adapter = await factory.createAndRegister('google-calendar', {
      providerId: 'google-calendar',
      providerVersion: '1.0.0',
      metadata: {},
    });

    expect(adapter.providerId).toBe('google-calendar');
    expect(registry.isRegistered('google-calendar')).toBe(true);
    expect(lifecycle.getState(adapter)).toBe('INITIALIZED');
  });

  it('adapter validator validates Calendar adapter structure', () => {
    const validator = new AdapterValidator();
    const auth = new CalendarAuthenticationProvider();
    const adapter = new GoogleCalendarAdapter(auth, mockTransport);
    const result = validator.validate(adapter);
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Mutation capability (Stage 3C.4)
// ---------------------------------------------------------------------------
describe('Mutation capability', () => {
  it('adapter capability profile declares mutation operations', () => {
    const adapter = new GoogleCalendarAdapter(
      new CalendarAuthenticationProvider(),
      mockTransport,
    );
    const profile = adapter.getCapabilityProfile();
    const mutationOps = profile.supportedOperations.filter(
      op => ['events.insert', 'events.update', 'events.delete'].includes(op.operation),
    );
    expect(mutationOps.length).toBe(3);
    for (const op of mutationOps) {
      expect(op.canExecute).toBe(true);
      expect(op.canVerify).toBe(true);
      expect(op.canRollback).toBe(true);
      expect(op.supportsIdempotency).toBe(true);
    }
  });

  it('supported operations include insert, update, delete', () => {
    const adapter = new GoogleCalendarAdapter(
      new CalendarAuthenticationProvider(),
      mockTransport,
    );
    expect(adapter.supportedOperations).toContain('events.insert');
    expect(adapter.supportedOperations).toContain('events.update');
    expect(adapter.supportedOperations).toContain('events.delete');
  });

  it('mutation operations require write scopes', () => {
    const adapter = new GoogleCalendarAdapter(
      new CalendarAuthenticationProvider(),
      mockTransport,
    );
    const profile = adapter.getCapabilityProfile();
    for (const op of profile.supportedOperations) {
      if (['events.insert', 'events.update', 'events.delete'].includes(op.operation)) {
        expect(op.requiredScopes).toContain('https://www.googleapis.com/auth/calendar.events');
      }
    }
  });
});
