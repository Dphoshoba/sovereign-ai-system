import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RollbackExecutionPhase } from '../../lib/platform/execution/adapters/sandbox/rollback-execution-phase';
import { RollbackExecutorImpl } from '../../lib/platform/execution/rollback-executor-impl';
import { RollbackPlan } from '../../lib/platform/execution/rollback-contract';
import { ExecutionRequest } from '../../lib/platform/execution/execution-request';
import { QueueCandidate } from '../../lib/platform/queue/types';
import { ConnectorExecutionAdapter } from '../../lib/platform/execution/connector-execution-adapter';
import { TelemetryEmitter } from '../../lib/platform/execution/operational-hardening/telemetry-emitter';
import { GovernanceDecision } from '../../lib/platform/governance/types';
import { ConnectorRuntimeCapabilities } from '../../lib/platform/execution/capabilities';

const mockDecision: GovernanceDecision = {
  decisionId: 'dec-1', requestId: 'req-1', governanceVersion: '1.0.0',
  policyVersion: '1.0.0', approvalRequired: true, approvalLevel: 'STANDARD',
  blockingReasons: [], warnings: [], riskSummary: { level: 'LOW', factors: [] },
  policyResults: [], executionEligible: false, queueEligible: true,
  reviewerInstructions: '',
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
    { stepIndex: 0, action: 'events.insert', compensatingOperation: 'events.delete', parameters: {}, reversible: true },
  ],
  plannedAt: '2026-01-01T00:00:00Z', planHash: 'plan-hash-1',
};

describe('RollbackExecutionPhase', () => {
  let mockAdapter: ConnectorExecutionAdapter;
  let telemetry: TelemetryEmitter;
  let executor: RollbackExecutorImpl;
  let phase: RollbackExecutionPhase;

  beforeEach(() => {
    mockAdapter = {
      adapterId: 'test-adapter',
      supportedConnectorIds: ['google-calendar'],
      execute: vi.fn(),
      verify: vi.fn(),
      rollback: vi.fn().mockResolvedValue({ rollbackApplied: true, providerState: {}, rollbackId: 'rb-1', rolledBackAt: 'now' }),
      audit: vi.fn(),
    };
    telemetry = new TelemetryEmitter();
    executor = new RollbackExecutorImpl({ adapter: mockAdapter, telemetryEmitter: telemetry });
    phase = new RollbackExecutionPhase({ executor, telemetryEmitter: telemetry });
  });

  it('returns ROLLBACK_COMPLETED for successful rollback', async () => {
    const result = await phase.execute(mockRequest, mockCandidate, samplePlan);
    expect(result.outcome).toBe('ROLLBACK_COMPLETED');
    expect(result.rollbackResult?.status).toBe('COMPLETED');
    expect(result.phaseResult.passed).toBe(true);
    expect(result.phaseResult.phase).toBe('ROLLBACK_EXECUTION');
  });

  it('returns ROLLBACK_FAILED when rollback fails', async () => {
    mockAdapter.rollback = vi.fn().mockRejectedValue(new Error('Rollback failed'));
    const result = await phase.execute(mockRequest, mockCandidate, samplePlan);
    expect(result.outcome).toBe('ROLLBACK_FAILED');
    expect(result.phaseResult.passed).toBe(false);
  });

  it('emits telemetry for phase start and completion', async () => {
    await phase.execute(mockRequest, mockCandidate, samplePlan);
    const rollbackEvents = telemetry.getEventsByCategory('ROLLBACK');
    expect(rollbackEvents.length).toBeGreaterThanOrEqual(2);
    expect(rollbackEvents.some(e => e.message === 'Rollback phase started')).toBe(true);
    expect(rollbackEvents.some(e => e.message.startsWith('Rollback phase:'))).toBe(true);
  });

  it('provides access to the underlying executor', () => {
    expect(phase.getExecutor()).toBe(executor);
  });

  it('returns phase result with correct structure', async () => {
    const result = await phase.execute(mockRequest, mockCandidate, samplePlan);
    expect(result.phaseResult).toHaveProperty('phase');
    expect(result.phaseResult).toHaveProperty('passed');
    expect(result.phaseResult).toHaveProperty('durationMs');
    expect(result.phaseResult).toHaveProperty('details');
    expect(result.phaseResult.details).toHaveProperty('outcome');
    expect(result.phaseResult.details).toHaveProperty('rollbackId');
    expect(result.phaseResult.details).toHaveProperty('stepsCompleted');
    expect(result.phaseResult.details).toHaveProperty('stepsTotal');
  });

  it('returns rollback result with proper structure', async () => {
    const result = await phase.execute(mockRequest, mockCandidate, samplePlan);
    expect(result.rollbackResult).toHaveProperty('rollbackId');
    expect(result.rollbackResult).toHaveProperty('executionId');
    expect(result.rollbackResult).toHaveProperty('status');
    expect(result.rollbackResult).toHaveProperty('stepsCompleted');
    expect(result.rollbackResult).toHaveProperty('stepsTotal');
    expect(result.rollbackResult).toHaveProperty('stepResults');
  });
});
