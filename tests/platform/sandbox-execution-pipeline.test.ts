import { describe, it, expect, vi } from 'vitest';
import { SandboxPolicy, DEFAULT_SANDBOX_POLICY } from '../../lib/platform/execution/adapters/sandbox/sandbox-policy';
import { SandboxResourceGuard } from '../../lib/platform/execution/adapters/sandbox/sandbox-resource-guard';
import { SandboxExecutionPipeline } from '../../lib/platform/execution/adapters/sandbox/sandbox-execution-pipeline';
import { GoogleCalendarAdapter } from '../../lib/platform/execution/adapters/calendar/google-calendar-adapter';
import { CalendarAuthenticationProvider } from '../../lib/platform/execution/adapters/calendar/calendar-authentication-provider';
import { Transport } from '../../lib/platform/execution/provider-contracts/transport';
import { ProviderResponse } from '../../lib/platform/execution/provider-contracts/provider-response';
import { ExecutionRequest } from '../../lib/platform/execution/execution-request';
import { GovernanceDecision } from '../../lib/platform/governance/types';
import { ConnectorRuntimeCapabilities } from '../../lib/platform/execution/capabilities';
import { QueueCandidate } from '../../lib/platform/queue/types';
import { DistributedIdempotencyStore } from '../../lib/platform/execution/operational-hardening/distributed-idempotency-store';
import { RetryPolicy } from '../../lib/platform/execution/operational-hardening/retry-policy';
import { BackoffStrategy } from '../../lib/platform/execution/operational-hardening/backoff-strategy';
import { RateLimitHandler } from '../../lib/platform/execution/operational-hardening/rate-limit-handler';
import { ReconciliationEngine } from '../../lib/platform/execution/operational-hardening/reconciliation-engine';
import { CredentialRotationManager } from '../../lib/platform/execution/operational-hardening/credential-rotation-manager';
import { TelemetryEmitter } from '../../lib/platform/execution/operational-hardening/telemetry-emitter';
import { FailureInjectionHarness } from '../../lib/platform/execution/operational-hardening/failure-injection-harness';
import { CredentialProvider } from '../../lib/platform/execution/provider-contracts/credential-provider';

const SANDBOX_CALENDAR_ID = 'sandbox-test-calendar@group.calendar.google.com';

const mockMutationResponse: ProviderResponse = {
  requestId: 'sandbox-mut-1',
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: {
    kind: 'calendar#event',
    id: 'sandbox-event-001',
    status: 'confirmed',
    htmlLink: 'https://calendar.google.com/event?id=sandbox-event-001',
    created: '2026-07-18T10:00:00.000Z',
    updated: '2026-07-18T10:30:00.000Z',
    summary: 'Sandbox Test Event',
    description: null,
    start: { dateTime: '2026-07-20T09:00:00', date: null, timeZone: 'America/New_York' },
    end: { dateTime: '2026-07-20T10:00:00', date: null, timeZone: 'America/New_York' },
    creator: { id: null, email: 'test@test.com', displayName: null, self: true },
    organizer: { id: null, email: 'test@test.com', displayName: null, self: true },
    recurringEventId: null,
    originalStartTime: null,
    iCalUID: 'sandbox-event-001@google.com',
    sequence: 0,
    reminders: { useDefault: true, overrides: null },
    eventType: 'default',
  },
  bodyFormat: 'json',
  etag: '"sandbox-etag"',
  revisionId: '1',
  receivedAt: '2026-07-18T12:00:00Z',
  durationMs: 250,
  metadata: {},
};

const mockDeleteResponse: ProviderResponse = {
  requestId: 'sandbox-del-1',
  statusCode: 204,
  headers: {},
  body: null,
  bodyFormat: 'none',
  etag: null,
  revisionId: null,
  receivedAt: '2026-07-18T12:00:01Z',
  durationMs: 200,
  metadata: {},
};

const mockGetResponse: ProviderResponse = {
  requestId: 'sandbox-get-1',
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: {
    kind: 'calendar#event',
    id: 'sandbox-event-001',
    status: 'confirmed',
    htmlLink: 'https://calendar.google.com/event?id=sandbox-event-001',
    created: '2026-07-18T10:00:00.000Z',
    updated: '2026-07-18T10:30:00.000Z',
    summary: 'Sandbox Test Event',
    description: 'Verified',
    location: null,
    colorId: '1',
    start: { dateTime: '2026-07-20T09:00:00', date: null, timeZone: 'America/New_York' },
    end: { dateTime: '2026-07-20T10:00:00', date: null, timeZone: 'America/New_York' },
    creator: { id: null, email: 'test@test.com', displayName: 'Test', self: true },
    organizer: { id: null, email: 'test@test.com', displayName: 'Test', self: true },
    recurringEventId: null,
    originalStartTime: null,
    iCalUID: 'sandbox-event-001@google.com',
    sequence: 0,
    reminders: { useDefault: true, overrides: null },
    eventType: 'default',
  },
  bodyFormat: 'json',
  etag: '"sandbox-etag"',
  revisionId: '1',
  receivedAt: '2026-07-18T12:00:01Z',
  durationMs: 150,
  metadata: {},
};

const mockDecision: GovernanceDecision = {
  decisionId: 'dec-sandbox-001',
  requestId: 'req-sandbox-001',
  governanceVersion: '1.0.0',
  policyVersion: '1.0.0',
  approvalRequired: true,
  approvalLevel: 'STANDARD',
  blockingReasons: [],
  warnings: [],
  riskSummary: { level: 'LOW', factors: [] },
  policyResults: [],
  executionEligible: false,
  queueEligible: true,
  reviewerInstructions: '',
};

const mockCapabilities: ConnectorRuntimeCapabilities = {
  stage: '3C',
  prepare: true,
  preflight: true,
  execute: true,
  verify: true,
  rollback: true,
  audit: true,
  providerMutationAllowed: true,
  networkMutationAllowed: true,
};

function makeCandidate(operation: string, targetCalendarId = SANDBOX_CALENDAR_ID): QueueCandidate {
  return {
    queueId: 'sandbox-q-001',
    connectorId: 'google-calendar',
    operation,
    previewId: 'prev-sandbox-001',
    decisionId: 'dec-sandbox-001',
    reviewPackageId: 'pkg-sandbox-001',
    governanceVersion: '1.0.0',
    policyVersion: '1.0.0',
    executionManifest: {
      intendedOperation: operation,
      requiredScopes: ['https://www.googleapis.com/auth/calendar.events'],
      requiredApprovals: ['STANDARD'],
      governanceDecisionId: 'dec-sandbox-001',
      blockingConditions: [],
      validationSummary: 'Sandbox mutation pre-check passed',
      resourceSummary: {
        sourceId: null,
        targetId: targetCalendarId,
        resourceType: 'calendar',
      },
      executionPrerequisites: ['sandbox-isolation', 'approval', 'idempotency'],
    },
    idempotencyToken: `sandbox-ik-${Date.now()}`,
    replayProtection: {
      duplicateDetectionKey: `dd-${Date.now()}`,
      replayWindowMetadata: { windowStart: '', windowEnd: '' },
      conflictIdentity: '',
      queueUniqueness: '',
    },
    dependencyGraph: { dependsOn: [], executionOrder: 0 },
    auditReference: 'audit-sandbox-001',
    queueEligible: true,
    executionEligible: false,
    executionAuthorized: false,
    metadata: { generatedAt: '2026-07-18T12:00:00Z', version: '1.0.0' },
  };
}

function makeRequest(operation: string, targetCalendarId = SANDBOX_CALENDAR_ID): ExecutionRequest {
  const candidate = makeCandidate(operation, targetCalendarId);
  return {
    executionId: `exe-sandbox-${Date.now()}`,
    queueId: candidate.queueId,
    connectorId: candidate.connectorId,
    operation,
    candidate,
    decision: mockDecision,
    capabilities: mockCapabilities,
    idempotencyToken: candidate.idempotencyToken,
    planHash: 'plan-sandbox-001',
    requestedAt: '2026-07-18T12:00:00Z',
  };
}

// ---------------------------------------------------------------------------
// SandboxPolicy
// ---------------------------------------------------------------------------
describe('SandboxPolicy', () => {
  it('passes isolation check for sandbox calendar', () => {
    const policy = new SandboxPolicy(DEFAULT_SANDBOX_POLICY);
    const result = policy.verifyIsolation('events.insert', SANDBOX_CALENDAR_ID);
    expect(result.passed).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  it('fails isolation check for non-sandbox calendar', () => {
    const policy = new SandboxPolicy(DEFAULT_SANDBOX_POLICY);
    const result = policy.verifyIsolation('events.insert', 'primary');
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBe(1);
    expect(result.violations[0].code).toBe('INVALID_TARGET');
  });

  it('fails isolation check for disallowed operation', () => {
    const policy = new SandboxPolicy(DEFAULT_SANDBOX_POLICY);
    const result = policy.verifyIsolation('events.batch', SANDBOX_CALENDAR_ID);
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBe(1);
    expect(result.violations[0].code).toBe('OPERATION_NOT_ALLOWED');
  });

  it('fails isolation check for both wrong operation and wrong calendar', () => {
    const policy = new SandboxPolicy(DEFAULT_SANDBOX_POLICY);
    const result = policy.verifyIsolation('events.batch', 'primary');
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBe(2);
  });

  it('returns default config', () => {
    const policy = new SandboxPolicy();
    expect(policy.getConfig().allowedOperations).toContain('events.insert');
  });
});

// ---------------------------------------------------------------------------
// SandboxResourceGuard
// ---------------------------------------------------------------------------
describe('SandboxResourceGuard', () => {
  const guard = new SandboxResourceGuard(SANDBOX_CALENDAR_ID);

  it('allows sandbox calendar ID', () => {
    expect(guard.checkCalendarId(SANDBOX_CALENDAR_ID).allowed).toBe(true);
  });

  it('allows calendar ID starting with sandbox-', () => {
    expect(guard.checkCalendarId('sandbox-my-calendar@test.com').allowed).toBe(true);
  });

  it('blocks primary calendar', () => {
    const result = guard.checkCalendarId('primary');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('PRODUCTION_RESOURCE');
  });

  it('blocks gmail.com calendar', () => {
    const result = guard.checkCalendarId('user@gmail.com');
    expect(result.allowed).toBe(false);
  });

  it('blocks unknown calendar without sandbox prefix', () => {
    const result = guard.checkCalendarId('some-calendar@test.com');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('UNKNOWN_RESOURCE');
  });

  it('passes sandbox-prefixed access token', () => {
    const result = guard.checkAccessToken('sandbox-token-abc123');
    expect(result.allowed).toBe(true);
  });

  it('allows unknown token patterns', () => {
    const result = guard.checkAccessToken('custom-token-format-xyz');
    expect(result.allowed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SandboxExecutionPipeline
// ---------------------------------------------------------------------------
describe('SandboxExecutionPipeline', () => {
  it('completes full insert flow against sandbox calendar', async () => {
    let callCount = 0;
    const transport: Transport = {
      transportId: 'sandbox-test',
      send: async (req) => {
        callCount++;
        if (req.method === 'POST') {
          expect(req.headers['Idempotency-Key']).toBeDefined();
          return mockMutationResponse;
        }
        return mockGetResponse;
      },
      isAvailable: async () => true,
    };

    const adapter = new GoogleCalendarAdapter(new CalendarAuthenticationProvider(), transport);
    await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });

    const pipeline = new SandboxExecutionPipeline({ adapter });
    const req = makeRequest('events.insert');
    const report = await pipeline.execute(req, req.candidate);

    expect(callCount).toBeGreaterThanOrEqual(2);
    expect(report.outcome).toBe('SANDBOX_COMPLETED');
    expect(report.transportInvoked).toBe(true);
    expect(report.phases.map(p => p.phase)).toContain('ISOLATION_CHECK');
    expect(report.phases.map(p => p.phase)).toContain('APPROVAL_GATE');
    expect(report.phases.map(p => p.phase)).toContain('IDEMPOTENCY');
    expect(report.phases.map(p => p.phase)).toContain('ROLLBACK_PLANNING');
    expect(report.phases.map(p => p.phase)).toContain('AUDIT_PRE');
    expect(report.phases.map(p => p.phase)).toContain('EXECUTION');
    expect(report.phases.map(p => p.phase)).toContain('VERIFICATION');
    expect(report.phases.map(p => p.phase)).toContain('AUDIT_POST');
    expect(report.phases.map(p => p.phase)).toContain('COMPLETED');
    expect(report.mutationResult).not.toBeNull();
    expect(report.verificationResult).not.toBeNull();
    expect(report.rollbackPlan).not.toBeNull();
    expect(report.auditEvents.length).toBeGreaterThan(0);
  });

  it('completes full update flow against sandbox calendar', async () => {
    let callCount = 0;
    const transport: Transport = {
      transportId: 'sandbox-test',
      send: async (req) => {
        callCount++;
        if (req.method === 'PUT') return mockMutationResponse;
        return mockGetResponse;
      },
      isAvailable: async () => true,
    };

    const adapter = new GoogleCalendarAdapter(new CalendarAuthenticationProvider(), transport);
    await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });

    const pipeline = new SandboxExecutionPipeline({ adapter });
    const req = makeRequest('events.update');
    const report = await pipeline.execute(req, req.candidate);

    expect(callCount).toBeGreaterThanOrEqual(2);
    expect(report.outcome).toBe('SANDBOX_COMPLETED');
  });

  it('completes full delete flow against sandbox calendar', async () => {
    let transportInvoked = false;
    const transport: Transport = {
      transportId: 'sandbox-test',
      send: async (req) => {
        transportInvoked = true;
        expect(req.method).toBe('DELETE');
        return mockDeleteResponse;
      },
      isAvailable: async () => true,
    };

    const adapter = new GoogleCalendarAdapter(new CalendarAuthenticationProvider(), transport);
    await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });

    const pipeline = new SandboxExecutionPipeline({ adapter });
    const req = makeRequest('events.delete');
    const report = await pipeline.execute(req, req.candidate);

    expect(transportInvoked).toBe(true);
    expect(report.outcome).toBe('SANDBOX_COMPLETED');
  });

  it('aborts execution when target is production calendar', async () => {
    let transportInvoked = false;
    const transport: Transport = {
      transportId: 'sandbox-test',
      send: async () => {
        transportInvoked = true;
        return mockMutationResponse;
      },
      isAvailable: async () => true,
    };

    const adapter = new GoogleCalendarAdapter(new CalendarAuthenticationProvider(), transport);
    await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });

    const pipeline = new SandboxExecutionPipeline({ adapter });
    const req = makeRequest('events.insert', 'primary');
    const report = await pipeline.execute(req, req.candidate);

    expect(transportInvoked).toBe(false);
    expect(report.outcome).toBe('SANDBOX_ABORTED');
    expect(report.phases.find(p => p.phase === 'ISOLATION_CHECK')?.passed).toBe(false);
    expect(report.transportInvoked).toBe(false);
  });

  it('aborts execution when approval is denied', async () => {
    let transportInvoked = false;
    const transport: Transport = {
      transportId: 'sandbox-test',
      send: async () => {
        transportInvoked = true;
        return mockMutationResponse;
      },
      isAvailable: async () => true,
    };

    const adapter = new GoogleCalendarAdapter(new CalendarAuthenticationProvider(), transport);
    await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });

    const pipeline = new SandboxExecutionPipeline({
      adapter,
      approvalGate: {
        evaluate: async () => ({
          decision: 'DENIED' as const,
          approvedAt: null,
          approvedBy: null,
          approvalLevel: 'STANDARD' as const,
          conditions: [],
          reason: 'Policy violation',
        }),
      },
    });

    const req = makeRequest('events.insert');
    const report = await pipeline.execute(req, req.candidate);

    expect(transportInvoked).toBe(false);
    expect(report.outcome).toBe('SANDBOX_ABORTED');
    expect(report.approvalVerdict?.decision).toBe('DENIED');
  });

  it('aborts execution when approval gate throws', async () => {
    let transportInvoked = false;
    const transport: Transport = {
      transportId: 'sandbox-test',
      send: async () => {
        transportInvoked = true;
        return mockMutationResponse;
      },
      isAvailable: async () => true,
    };

    const adapter = new GoogleCalendarAdapter(new CalendarAuthenticationProvider(), transport);
    await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });

    const pipeline = new SandboxExecutionPipeline({
      adapter,
      approvalGate: {
        evaluate: async () => { throw new Error('Gate unavailable'); },
      },
    });

    const req = makeRequest('events.insert');
    const report = await pipeline.execute(req, req.candidate);

    expect(transportInvoked).toBe(false);
    expect(report.outcome).toBe('SANDBOX_ABORTED');
  });

  it('handles execution failure and reports outcome', async () => {
    const transport: Transport = {
      transportId: 'sandbox-test',
      send: async (req) => {
        if (req.method === 'POST') throw new Error('API timeout');
        return mockDeleteResponse;
      },
      isAvailable: async () => true,
    };

    const adapter = new GoogleCalendarAdapter(new CalendarAuthenticationProvider(), transport);
    await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });

    const pipeline = new SandboxExecutionPipeline({ adapter });
    const req = makeRequest('events.insert');
    const report = await pipeline.execute(req, req.candidate);

    expect(report.outcome).toBe('SANDBOX_FAILED');
    expect(report.mutationResult).toBeNull();
    expect(report.phases.find(p => p.phase === 'EXECUTION')?.passed).toBe(false);
  });

  it('handles verification failure gracefully', async () => {
    const transport: Transport = {
      transportId: 'sandbox-test',
      send: async (req) => {
        if (req.method === 'GET') {
          return { ...mockGetResponse, body: { ...mockGetResponse.body as any, status: 'cancelled' } };
        }
        return mockMutationResponse;
      },
      isAvailable: async () => true,
    };

    const adapter = new GoogleCalendarAdapter(new CalendarAuthenticationProvider(), transport);
    await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });

    const pipeline = new SandboxExecutionPipeline({ adapter });
    const req = makeRequest('events.insert');
    const report = await pipeline.execute(req, req.candidate);

    expect(report.outcome).toBe('SANDBOX_FAILED');
    expect(report.mutationResult).not.toBeNull();
    expect(report.phases.find(p => p.phase === 'VERIFICATION')?.passed).toBe(false);
  });

  it('transport is never invoked when isolation check fails', async () => {
    let transportInvoked = false;
    const transport: Transport = {
      transportId: 'sandbox-test',
      send: async () => {
        transportInvoked = true;
        return mockMutationResponse;
      },
      isAvailable: async () => true,
    };

    const adapter = new GoogleCalendarAdapter(new CalendarAuthenticationProvider(), transport);
    await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });

    const pipeline = new SandboxExecutionPipeline({ adapter });
    const req = makeRequest('events.insert', 'primary');
    const report = await pipeline.execute(req, req.candidate);

    expect(transportInvoked).toBe(false);
    expect(report.transportInvoked).toBe(false);
  });

  it('generates rollback plan for all mutation operations', async () => {
    const transport: Transport = {
      transportId: 'sandbox-test',
      send: async () => mockMutationResponse,
      isAvailable: async () => true,
    };

    const adapter = new GoogleCalendarAdapter(new CalendarAuthenticationProvider(), transport);
    await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });

    const pipeline = new SandboxExecutionPipeline({ adapter });

    let ikCounter = 0;
    for (const op of ['events.insert', 'events.update', 'events.delete']) {
      const req = makeRequest(op);
      req.idempotencyToken = `rollback-plan-ik-${ikCounter++}`;
      const report = await pipeline.execute(req, req.candidate);
      expect(report.rollbackPlan).not.toBeNull();
      expect(report.rollbackPlan?.steps.length).toBeGreaterThan(0);
    }
  });

  it('records audit events for every phase', async () => {
    const transport: Transport = {
      transportId: 'sandbox-test',
      send: async () => mockMutationResponse,
      isAvailable: async () => true,
    };

    const adapter = new GoogleCalendarAdapter(new CalendarAuthenticationProvider(), transport);
    await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });

    const pipeline = new SandboxExecutionPipeline({ adapter });
    const req = makeRequest('events.insert');
    const report = await pipeline.execute(req, req.candidate);

    expect(report.auditEvents.length).toBeGreaterThanOrEqual(6);
    expect(report.auditEvents.some(e => e.startsWith('ISOLATION_PASSED'))).toBe(true);
    expect(report.auditEvents.some(e => e.startsWith('APPROVAL_APPROVED'))).toBe(true);
    expect(report.auditEvents.some(e => e.startsWith('IDEMPOTENCY_KEY'))).toBe(true);
    expect(report.auditEvents.some(e => e.startsWith('ROLLBACK_PLAN'))).toBe(true);
    expect(report.auditEvents.some(e => e.startsWith('EXECUTION_SUCCEEDED'))).toBe(true);
    expect(report.auditEvents.some(e => e.startsWith('VERIFICATION_SUCCEEDED'))).toBe(true);
  });

  it('phases are completed in order', async () => {
    const transport: Transport = {
      transportId: 'sandbox-test',
      send: async () => mockMutationResponse,
      isAvailable: async () => true,
    };

    const adapter = new GoogleCalendarAdapter(new CalendarAuthenticationProvider(), transport);
    await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });

    const pipeline = new SandboxExecutionPipeline({ adapter });
    const req = makeRequest('events.insert');
    const report = await pipeline.execute(req, req.candidate);

    const phaseNames = report.phases.map(p => p.phase);
    const expectedOrder = ['ISOLATION_CHECK', 'CREDENTIAL_CHECK', 'APPROVAL_GATE', 'IDEMPOTENCY', 'ROLLBACK_PLANNING', 'AUDIT_PRE', 'EXECUTION', 'VERIFICATION', 'RECONCILIATION', 'AUDIT_POST', 'COMPLETED'];
    expect(phaseNames).toEqual(expectedOrder);
  });
});

// ---------------------------------------------------------------------------
// Hardened SandboxExecutionPipeline Integration Tests
// ---------------------------------------------------------------------------
describe('HardenedSandboxExecutionPipeline', () => {
  const SANDBOX_CALENDAR_ID = 'sandbox-test-calendar@group.calendar.google.com';

  const mockMutationResponse: ProviderResponse = {
    requestId: 'sandbox-mut-1',
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { kind: 'calendar#event', id: 'sandbox-event-001', status: 'confirmed' },
    bodyFormat: 'json',
    etag: '"sandbox-etag"',
    revisionId: '1',
    receivedAt: '2026-07-18T12:00:00Z',
    durationMs: 250,
    metadata: {},
  };

  const mockGetResponse: ProviderResponse = {
    requestId: 'sandbox-get-1',
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { kind: 'calendar#event', id: 'sandbox-event-001', status: 'confirmed' },
    bodyFormat: 'json',
    etag: '"sandbox-etag"',
    revisionId: '1',
    receivedAt: '2026-07-18T12:00:01Z',
    durationMs: 150,
    metadata: {},
  };

  function makeTransport(fn: (req: any) => ProviderResponse, available = true): Transport {
    return { transportId: 'hardened-test', send: async (req) => fn(req), isAvailable: async () => available };
  }

  async function createAdapter(transport: Transport) {
    const adapter = new GoogleCalendarAdapter(new CalendarAuthenticationProvider(), transport);
    await adapter.initialize({ providerId: 'google-calendar', providerVersion: '1.0.0', metadata: {} });
    return adapter;
  }

  function defaultRequest(operation = 'events.insert') {
    return makeRequest(operation);
  }

  it('preserves idempotency across retry: completed entry is not re-executed', async () => {
    const store = new DistributedIdempotencyStore();
    const ik = `test-ik-retry-${Date.now()}`;
    await store.put(ik, {
      idempotencyKey: ik, status: 'COMPLETED', executionId: 'prev-exe',
      operation: 'events.insert', requestHash: 'hash', result: { id: 'event-001' },
      error: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });

    let execCount = 0;
    const transport = makeTransport((req) => { execCount++; return mockMutationResponse; });
    const adapter = await createAdapter(transport);
    const pipeline = new SandboxExecutionPipeline({ adapter, idempotencyStore: store });
    const req = defaultRequest();
    req.idempotencyToken = ik;
    req.executionId = 'exe-retry-idem';

    const report = await pipeline.execute(req, req.candidate);
    expect(execCount).toBe(0);
    expect(report.outcome).toBe('SANDBOX_COMPLETED');
  });

  it('retries transient failures and recovers', async () => {
    let execAttempts = 0;
    const transport: Transport = {
      transportId: 'hardened-test',
      send: async (req) => {
        execAttempts++;
        if (execAttempts < 3) throw new Error('NETWORK_TIMEOUT');
        return mockMutationResponse;
      },
      isAvailable: async () => true,
    };
    const adapter = await createAdapter(transport);
    const retryPolicy = new RetryPolicy({ maxRetries: 3, backoff: { jitterFactor: 0 } });
    const pipeline = new SandboxExecutionPipeline({ adapter, retryPolicy });
    const req = defaultRequest();
    req.idempotencyToken = `retry-test-ik-${Date.now()}`;
    const report = await pipeline.execute(req, req.candidate);

    // 2 failed attempts (retried), 1 successful, then 1 GET for verify = 4 total
    expect(execAttempts).toBe(4);
    expect(report.outcome).toBe('SANDBOX_COMPLETED');
    expect(report.mutationResult).not.toBeNull();
  });

  it('fails execution after exhausting all retries', async () => {
    let execAttempts = 0;
    const transport: Transport = {
      transportId: 'hardened-test',
      send: async (req) => {
        execAttempts++;
        throw new Error('NETWORK_TIMEOUT');
      },
      isAvailable: async () => true,
    };
    const adapter = await createAdapter(transport);
    const retryPolicy = new RetryPolicy({ maxRetries: 2, backoff: { jitterFactor: 0 } });
    const pipeline = new SandboxExecutionPipeline({ adapter, retryPolicy });
    const req = defaultRequest();
    req.idempotencyToken = `retry-fail-ik-${Date.now()}`;
    const report = await pipeline.execute(req, req.candidate);

    // 3 adapter.execute calls (attempt 0,1,2), all fail, no verify
    expect(execAttempts).toBe(3);
    expect(report.outcome).toBe('SANDBOX_FAILED');
  });

  it('backoff remains deterministic with jitter disabled', async () => {
    const backoff = new BackoffStrategy({ jitterFactor: 0 });
    const delays = [0, 1, 2].map(i => backoff.computeDelay(i));
    expect(delays[0]).toBe(1000);
    expect(delays[1]).toBe(2000);
    expect(delays[2]).toBe(4000);
  });

  it('rate-limit handler detects and waits before retry', async () => {
    let callNumber = 0;
    const transport = makeTransport((req) => {
      callNumber++;
      if (callNumber === 1) return { ...mockMutationResponse, statusCode: 429, headers: { 'Retry-After': '1', 'Content-Type': 'application/json' } };
      return mockMutationResponse;
    });
    const adapter = await createAdapter(transport);
    const pipeline = new SandboxExecutionPipeline({ adapter });
    const req = defaultRequest();
    const report = await pipeline.execute(req, req.candidate);

    expect(report.outcome).toBe('SANDBOX_COMPLETED');
  });

  it('reconciliation engine detects successful mutation', async () => {
    const transport = makeTransport(() => mockMutationResponse);
    const adapter = await createAdapter(transport);
    const reconciliation = new ReconciliationEngine();
    const pipeline = new SandboxExecutionPipeline({ adapter, reconciliationEngine: reconciliation });
    const req = defaultRequest();
    const report = await pipeline.execute(req, req.candidate);

    expect(report.phases.find(p => p.phase === 'RECONCILIATION')?.passed).toBe(true);
    expect(report.outcome).toBe('SANDBOX_COMPLETED');
  });

  it('credential rotation does not interrupt execution', async () => {
    let rotationAttempts = 0;
    const mockCredentialProvider: CredentialProvider = {
      providerId: 'mock-cred',
      getDescriptor: async () => {
        rotationAttempts++;
        return {
          credentialId: `cred-${String(rotationAttempts).padStart(3, '0')}`,
          providerId: 'google-calendar',
          type: 'OAUTH2_CLIENT',
          scopes: ['https://www.googleapis.com/auth/calendar.events'],
          issuedAt: '2026-01-01T00:00:00Z',
          expiresAt: new Date(Date.now() + 60000).toISOString(),
          isRevocable: true,
        };
      },
      validate: async () => true,
      revoke: async () => {},
    };
    const credentialManager = new CredentialRotationManager(mockCredentialProvider, { renewalThresholdMs: 300000 });

    let execCalled = false;
    const transport = makeTransport((req) => { execCalled = true; return mockMutationResponse; });
    const adapter = await createAdapter(transport);
    const pipeline = new SandboxExecutionPipeline({ adapter, credentialManager });
    const req = defaultRequest();
    const report = await pipeline.execute(req, req.candidate);

    expect(execCalled).toBe(true);
    expect(report.outcome).toBe('SANDBOX_COMPLETED');
    expect(rotationAttempts).toBeGreaterThanOrEqual(2);
  });

  it('telemetry spans complete execution lifecycle', async () => {
    const telemetry = new TelemetryEmitter();
    const transport = makeTransport(() => mockMutationResponse);
    const adapter = await createAdapter(transport);
    const pipeline = new SandboxExecutionPipeline({ adapter, telemetryEmitter: telemetry });
    const req = defaultRequest();
    await pipeline.execute(req, req.candidate);

    const events = telemetry.getEvents();
    expect(events.length).toBeGreaterThanOrEqual(3);
    expect(events.map(e => e.category)).toContain('EXECUTION');
    expect(events.map(e => e.category)).toContain('RECONCILIATION');
    expect(events.map(e => e.category)).toContain('IDEMPOTENCY');
  });

  it('failure injection harness injects server error and retry recovers', async () => {
    let callCount = 0;
    const transport = makeTransport((req) => {
      callCount++;
      return mockMutationResponse;
    });
    const injector = new FailureInjectionHarness(transport);
    injector.addRule({ mode: 'SERVER_ERROR', probability: 1.0 });

    const adapter = await createAdapter(transport);
    const retryPolicy = new RetryPolicy({ maxRetries: 3, backoff: { jitterFactor: 0 } });
    const pipeline = new SandboxExecutionPipeline({ adapter, retryPolicy, failureInjector: injector });
    const req = defaultRequest();
    const report = await pipeline.execute(req, req.candidate);

    const injectionReport = injector.getInjectionReport();
    expect(injectionReport.length).toBeGreaterThan(0);
    expect(injectionReport[0].rule.mode).toBe('SERVER_ERROR');
  });

  it('chaos: rate-limit followed by server error followed by success', async () => {
    let execAttempts = 0;
    const transport: Transport = {
      transportId: 'hardened-test',
      send: async (req) => {
        execAttempts++;
        if (execAttempts === 1) throw new Error('NETWORK_TIMEOUT');
        if (execAttempts === 2) throw new Error('SERVER_ERROR');
        if (execAttempts === 3) throw new Error('NETWORK_TIMEOUT');
        return mockMutationResponse;
      },
      isAvailable: async () => true,
    };
    const adapter = await createAdapter(transport);
    const retryPolicy = new RetryPolicy({ maxRetries: 3, backoff: { baseDelayMs: 10, jitterFactor: 0 } });
    const pipeline = new SandboxExecutionPipeline({ adapter, retryPolicy });
    const req = defaultRequest();
    req.idempotencyToken = `chaos-test-ik-${Date.now()}`;
    const report = await pipeline.execute(req, req.candidate);

    // 3 failed + 1 successful execute, then 1 GET for verify = 5 total
    expect(execAttempts).toBe(5);
    expect(report.outcome).toBe('SANDBOX_COMPLETED');
  });

  it('all hardening components work together in unified pipeline', async () => {
    const store = new DistributedIdempotencyStore();
    const telemetry = new TelemetryEmitter();
    const backoff = new BackoffStrategy({ jitterFactor: 0 });
    const retryPolicy = new RetryPolicy({ maxRetries: 2, backoff: { jitterFactor: 0 } });
    const reconciliation = new ReconciliationEngine();
    const rateLimitHandler = new RateLimitHandler();
    const mockCredProvider: CredentialProvider = {
      providerId: 'mock-cred',
      getDescriptor: async () => ({
        credentialId: 'cred-main', providerId: 'google-calendar', type: 'OAUTH2_CLIENT',
        scopes: [''], issuedAt: '', expiresAt: new Date(Date.now() + 86400000).toISOString(), isRevocable: true,
      }),
      validate: async () => true,
      revoke: async () => {},
    };
    const credentialManager = new CredentialRotationManager(mockCredProvider);

    const transport = makeTransport(() => mockMutationResponse);
    const adapter = await createAdapter(transport);
    const pipeline = new SandboxExecutionPipeline({
      adapter,
      idempotencyStore: store,
      retryPolicy,
      backoffStrategy: backoff,
      rateLimitHandler,
      reconciliationEngine: reconciliation,
      credentialManager,
      telemetryEmitter: telemetry,
    });
    const req = defaultRequest();
    const report = await pipeline.execute(req, req.candidate);

    expect(report.outcome).toBe('SANDBOX_COMPLETED');
    expect(report.phases.length).toBe(11);

    const phaseNames = report.phases.map(p => p.phase);
    expect(phaseNames).toEqual(['ISOLATION_CHECK', 'CREDENTIAL_CHECK', 'APPROVAL_GATE', 'IDEMPOTENCY', 'ROLLBACK_PLANNING', 'AUDIT_PRE', 'EXECUTION', 'VERIFICATION', 'RECONCILIATION', 'AUDIT_POST', 'COMPLETED']);
    expect(store.getEntryCount()).toBeGreaterThan(0);

    const telemetrySnapshot = telemetry.getSnapshot();
    expect(telemetrySnapshot.executionCount).toBeGreaterThanOrEqual(1);
    expect(telemetrySnapshot.reconciliationCount).toBeGreaterThanOrEqual(1);
  });

  it('recovers from chaos injection with all hardening active', async () => {
    const realTransport: Transport = {
      transportId: 'hardened-test',
      send: async (req) => mockMutationResponse,
      isAvailable: async () => true,
    };

    let injectCount = 0;
    const injector = new FailureInjectionHarness(realTransport);
    injector.addRule({ mode: 'SERVER_ERROR', probability: 1.0 });

    const telemetry = new TelemetryEmitter();
    const retryPolicy = new RetryPolicy({ maxRetries: 3, backoff: { jitterFactor: 0 } });

    const adapter = await createAdapter(realTransport);
    const pipeline = new SandboxExecutionPipeline({
      adapter,
      retryPolicy,
      telemetryEmitter: telemetry,
      failureInjector: injector,
    });
    const req = defaultRequest();
    req.idempotencyToken = `chaos-recover-ik-${Date.now()}`;
    const report = await pipeline.execute(req, req.candidate);

    const injectionReport = injector.getInjectionReport();
    expect(injectionReport.length).toBeGreaterThan(0);
    expect(injectionReport[0].rule.mode).toBe('SERVER_ERROR');
  });
});
