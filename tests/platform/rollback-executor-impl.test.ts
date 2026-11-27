import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RollbackExecutorImpl } from '../../lib/platform/execution/rollback-executor-impl';
import { RollbackPlan, RollbackResult } from '../../lib/platform/execution/rollback-contract';
import { ExecutionRequest } from '../../lib/platform/execution/execution-request';
import { QueueCandidate } from '../../lib/platform/queue/types';
import { ConnectorExecutionAdapter } from '../../lib/platform/execution/connector-execution-adapter';
import { RollbackAudit } from '../../lib/platform/execution/rollback-engine/rollback-audit';
import { TelemetryEmitter } from '../../lib/platform/execution/operational-hardening/telemetry-emitter';
import { GovernanceDecision } from '../../lib/platform/governance/types';
import { ConnectorRuntimeCapabilities } from '../../lib/platform/execution/capabilities';

const mockDecision: GovernanceDecision = {
  decisionId: 'dec-1', requestId: 'req-1', governanceVersion: '1.0.0',
  policyVersion: '1.0.0', approvalRequired: true, approvalLevel: 'STANDARD',
  blockingReasons: [], warnings: [], riskSummary: { level: 'LOW', factors: [] },
  policyResults: [], executionEligible: false, queueEligible: true,
  reviewerInstructions: 'Review',
};

const mockCandidate: QueueCandidate = {
  queueId: 'q-1', connectorId: 'google-calendar', operation: 'events.insert',
  previewId: 'p-1', decisionId: 'dec-1', reviewPackageId: 'pkg-1',
  governanceVersion: '1.0.0', policyVersion: '1.0.0',
  executionManifest: {
    intendedOperation: 'events.insert', requiredScopes: ['scope1'],
    requiredApprovals: ['STANDARD'], governanceDecisionId: 'dec-1',
    blockingConditions: [], validationSummary: 'Test',
    resourceSummary: { sourceId: null, targetId: 't-1', resourceType: 'calendar' },
    executionPrerequisites: [],
  },
  idempotencyToken: 'token-1',
  replayProtection: { duplicateDetectionKey: 'dup-1', replayWindowMetadata: { windowStart: 'S', windowEnd: 'E' }, conflictIdentity: 'c-1', queueUniqueness: 'u-1' },
  dependencyGraph: { dependsOn: [], executionOrder: 1 },
  auditReference: 'audit-1', queueEligible: true, executionEligible: false,
  executionAuthorized: false,
  metadata: { generatedAt: 'now', version: '1.0.0' },
};

const mockCapabilities: ConnectorRuntimeCapabilities = {
  prepare: true, preflight: true, execute: true, verify: true,
  rollback: true, audit: true, stage: '3C',
  providerMutationAllowed: true, networkMutationAllowed: true,
};

const mockRequest: ExecutionRequest = {
  executionId: 'exe-1', queueId: 'q-1', connectorId: 'google-calendar',
  operation: 'events.insert', candidate: mockCandidate, decision: mockDecision,
  capabilities: mockCapabilities,
  idempotencyToken: 'token-1', planHash: 'plan-abc123',
  requestedAt: '2026-01-01T00:00:00Z',
};

const samplePlan: RollbackPlan = {
  rollbackId: 'rb-1', executionId: 'exe-1', connectorId: 'google-calendar',
  operation: 'events.insert', scope: 'FULL', strategy: 'REVERSE_ORDER',
  steps: [
    { stepIndex: 0, action: 'events.insert', compensatingOperation: 'events.delete', parameters: { eventId: 'evt-1' }, reversible: true },
  ],
  plannedAt: '2026-01-01T00:00:00Z', planHash: 'plan-hash-1',
};

describe('RollbackExecutorImpl', () => {
  let mockAdapter: ConnectorExecutionAdapter;
  let telemetry: TelemetryEmitter;
  let audit: RollbackAudit;

  beforeEach(() => {
    mockAdapter = {
      adapterId: 'test-adapter',
      supportedConnectorIds: ['google-calendar'],
      execute: vi.fn(),
      verify: vi.fn(),
      rollback: vi.fn().mockResolvedValue({
        rollbackApplied: true,
        providerState: {},
        rollbackId: 'rb-1',
        rolledBackAt: '2026-01-01T00:00:00Z',
      }),
      audit: vi.fn(),
    };
    telemetry = new TelemetryEmitter();
    audit = new RollbackAudit();
  });

  it('supports rollback', () => {
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter });
    expect(executor.supportsRollback).toBe(true);
    expect(executor.rollbackStrategies).toContain('REVERSE_ORDER');
  });

  it('generates a rollback plan', async () => {
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter });
    const plan = await executor.plan(mockRequest, mockCandidate);
    expect(plan.rollbackId).toBeDefined();
    expect(plan.steps.length).toBeGreaterThan(0);
  });

  it('executes all steps and returns COMPLETED', async () => {
    mockAdapter.rollback = vi.fn().mockResolvedValue({
      rollbackApplied: true, providerState: {}, rollbackId: 'rb-1', rolledBackAt: 'now',
    });
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, audit });
    const result = await executor.execute(mockRequest, mockCandidate, samplePlan);

    expect(result.status).toBe('COMPLETED');
    expect(result.stepsCompleted).toBe(1);
    expect(result.stepsTotal).toBe(1);
    expect(result.stepResults).toHaveLength(1);
    expect(result.stepResults[0].status).toBe('COMPLETED');
  });

  it('returns FAILED when plan validation fails', async () => {
    const invalidPlan = { ...samplePlan, planHash: '' };
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, audit });
    const result = await executor.execute(mockRequest, mockCandidate, invalidPlan);

    expect(result.status).toBe('FAILED');
    expect(result.stepsCompleted).toBe(0);
    expect(result.failureReason).toContain('Plan validation failed');
  });

  it('returns PARTIAL when some steps fail', async () => {
    const multiStepPlan: RollbackPlan = {
      ...samplePlan,
      steps: [
        { stepIndex: 0, action: 'events.insert', compensatingOperation: 'events.delete', parameters: {}, reversible: true },
        { stepIndex: 1, action: 'events.update', compensatingOperation: 'events.update', parameters: {}, reversible: false },
      ],
    };
    mockAdapter.rollback = vi.fn()
      .mockResolvedValueOnce({ rollbackApplied: true, providerState: {}, rollbackId: 'rb-1', rolledBackAt: 'now' })
      .mockRejectedValueOnce(new Error('Step failed'));
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, audit });
    const result = await executor.execute(mockRequest, mockCandidate, multiStepPlan);

    expect(result.status).toBe('PARTIAL');
    expect(result.stepsCompleted).toBe(1);
    expect(result.stepsTotal).toBe(2);
    expect(result.stepResults[0].status).toBe('COMPLETED');
    expect(result.stepResults[1].status).toBe('FAILED');
  });

  it('returns FAILED when all steps fail', async () => {
    mockAdapter.rollback = vi.fn().mockRejectedValue(new Error('All steps failed'));
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, audit });
    const result = await executor.execute(mockRequest, mockCandidate, samplePlan);

    expect(result.status).toBe('FAILED');
    expect(result.stepsCompleted).toBe(0);
    expect(result.failureReason).toBe('All rollback steps failed');
  });

  it('emits telemetry events during execution', async () => {
    mockAdapter.rollback = vi.fn().mockResolvedValue({
      rollbackApplied: true, providerState: {}, rollbackId: 'rb-1', rolledBackAt: 'now',
    });
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, telemetryEmitter: telemetry, audit });
    await executor.execute(mockRequest, mockCandidate, samplePlan);

    const rollbackEvents = telemetry.getEventsByCategory('ROLLBACK');
    expect(rollbackEvents.length).toBeGreaterThanOrEqual(3);
    expect(rollbackEvents.some(e => e.message.includes('started'))).toBe(true);
    expect(rollbackEvents.some(e => e.message.includes('completed'))).toBe(true);
  });

  it('records audit events during execution', async () => {
    mockAdapter.rollback = vi.fn().mockResolvedValue({
      rollbackApplied: true, providerState: {}, rollbackId: 'rb-1', rolledBackAt: 'now',
    });
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, audit });
    await executor.execute(mockRequest, mockCandidate, samplePlan);

    const events = audit.getEvents();
    expect(events.some(e => e.eventType === 'PLAN_GENERATED')).toBe(true);
    expect(events.some(e => e.eventType === 'COMPENSATION_STARTED')).toBe(true);
    expect(events.some(e => e.eventType === 'COMPENSATION_STEP_EXECUTED')).toBe(true);
    expect(events.some(e => e.eventType === 'COMPENSATION_COMPLETED')).toBe(true);
    expect(events.some(e => e.eventType === 'ROLLBACK_COMPLETED')).toBe(true);
  });

  it('retries transient failures during rollback execution', async () => {
    let callCount = 0;
    mockAdapter.rollback = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 2) throw new Error('NETWORK_TIMEOUT');
      return { rollbackApplied: true, providerState: {}, rollbackId: 'rb-1', rolledBackAt: 'now' };
    });
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, audit });
    const result = await executor.execute(mockRequest, mockCandidate, samplePlan);

    expect(result.status).toBe('COMPLETED');
    expect(callCount).toBeGreaterThan(1);
  });

  it('exposes audit and validator accessors', () => {
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, audit });
    expect(executor.getAudit()).toBe(audit);
    expect(executor.getValidator()).toBeDefined();
  });

  it('handles empty step plan gracefully', async () => {
    const emptyPlan: RollbackPlan = {
      ...samplePlan,
      steps: [],
    };
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, audit });
    const result = await executor.execute(mockRequest, mockCandidate, emptyPlan);

    expect(result.status).toBe('COMPLETED');
    expect(result.stepsCompleted).toBe(0);
    expect(result.stepsTotal).toBe(0);
  });

  it('handles adapter rollback returning rollbackApplied=false', async () => {
    mockAdapter.rollback = vi.fn().mockResolvedValue({
      rollbackApplied: false, providerState: {}, rollbackId: 'rb-1', rolledBackAt: 'now',
    });
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, audit });
    const result = await executor.execute(mockRequest, mockCandidate, samplePlan);

    expect(result.status).toBe('FAILED');
    expect(result.stepResults[0].status).toBe('FAILED');
    expect(result.stepResults[0].error).toContain('rollbackApplied=false');
  });

  it('produces consistent results for identical inputs', async () => {
    mockAdapter.rollback = vi.fn().mockResolvedValue({
      rollbackApplied: true, providerState: {}, rollbackId: 'rb-1', rolledBackAt: 'now',
    });
    const executor1 = new RollbackExecutorImpl({ adapter: mockAdapter });
    const executor2 = new RollbackExecutorImpl({ adapter: mockAdapter });

    const result1 = await executor1.execute(mockRequest, mockCandidate, samplePlan);
    const result2 = await executor2.execute(mockRequest, mockCandidate, samplePlan);

    expect(result1.status).toBe(result2.status);
    expect(result1.stepsCompleted).toBe(result2.stepsCompleted);
  });
});
