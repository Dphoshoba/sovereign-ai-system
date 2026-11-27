import { beforeEach, describe, it, expect, vi } from 'vitest';
import { ExecutionOrchestrator, S3BOrchestrationResult } from '../../lib/platform/execution/execution-orchestrator';
import { ExecutionContext, ExecutionContextManager } from '../../lib/platform/execution/execution-context';
import { ConnectorRuntimeCapabilities } from '../../lib/platform/execution/capabilities';
import { QueueCandidate } from '../../lib/platform/queue/types';
import { GovernanceDecision } from '../../lib/platform/governance/types';
import { ConnectorRuntimeRegistry } from '../../lib/platform/execution/connector-runtime-registry';
import { ExecutionFailureCode } from '../../lib/platform/execution/failure-classifier';
import { ExecutionLifecycle, S3BPhase, S3B_PHASE_TRANSITIONS } from '../../lib/platform/execution/execution-lifecycle';
import { ApprovalGate, ApprovalRequest, ApprovalVerdict } from '../../lib/platform/execution/approval-contract';
import { RollbackExecutor, RollbackPlan } from '../../lib/platform/execution/rollback-contract';

const mockDecision: GovernanceDecision = {
  decisionId: 'dec-1',
  requestId: 'req-1',
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
  reviewerInstructions: 'Review',
};

const mockCandidate: QueueCandidate = {
  queueId: 'q-1',
  connectorId: 'google-drive',
  operation: 'upload',
  previewId: 'p-1',
  decisionId: 'dec-1',
  reviewPackageId: 'pkg-1',
  governanceVersion: '1.0.0',
  policyVersion: '1.0.0',
  executionManifest: {
    intendedOperation: 'upload',
    requiredScopes: ['scope1'],
    requiredApprovals: ['STANDARD'],
    governanceDecisionId: 'dec-1',
    blockingConditions: [],
    validationSummary: 'Test',
    resourceSummary: { sourceId: null, targetId: 't-1', resourceType: 'file' },
    executionPrerequisites: [],
  },
  idempotencyToken: 'token-1',
  replayProtection: {
    duplicateDetectionKey: 'dup-1',
    replayWindowMetadata: { windowStart: 'S', windowEnd: 'E' },
    conflictIdentity: 'c-1',
    queueUniqueness: 'u-1',
  },
  dependencyGraph: { dependsOn: [], executionOrder: 1 },
  auditReference: 'audit-1',
  queueEligible: true,
  executionEligible: false,
  executionAuthorized: false,
  metadata: { generatedAt: 'now', version: '1.0.0' },
};

const s3aCapabilities: ConnectorRuntimeCapabilities = {
  prepare: true,
  preflight: true,
  execute: false,
  verify: false,
  rollback: false,
  audit: true,
  stage: '3A',
  providerMutationAllowed: false,
  networkMutationAllowed: false,
};

function registerRuntime(connectorId = 'google-drive') {
  const runtime = {
    prepare: vi.fn(async () => {}),
    execute: vi.fn(async () => ({})),
    verify: vi.fn(async () => ({})),
    rollback: vi.fn(async () => {}),
    audit: vi.fn(async () => ({})),
  };
  ConnectorRuntimeRegistry.register(connectorId, runtime);
  return runtime;
}

function createS3BContext(): ExecutionContext {
  const candidate = JSON.parse(JSON.stringify(mockCandidate)) as QueueCandidate;
  return ExecutionContextManager.create(candidate, mockDecision, s3aCapabilities);
}

function createCorruptedS3BContext(overrides: Partial<QueueCandidate>): ExecutionContext {
  const candidate = JSON.parse(JSON.stringify(mockCandidate)) as QueueCandidate;
  Object.assign(candidate, overrides);
  return ExecutionContextManager.create(candidate, mockDecision, s3aCapabilities);
}

// ============================================================
// ExecutionLifecycle
// ============================================================

describe('ExecutionLifecycle', () => {
  it('starts in S3B_INITIAL phase', () => {
    const lifecycle = new ExecutionLifecycle();
    expect(lifecycle.getPhase()).toBe('S3B_INITIAL');
  });

  it('transitions through the canonical S3B sequence', () => {
    const lifecycle = new ExecutionLifecycle();
    expect(lifecycle.transitionTo('S3B_APPROVAL')).toBe(true);
    expect(lifecycle.transitionTo('S3B_EXECUTION')).toBe(true);
    expect(lifecycle.transitionTo('S3B_VERIFICATION')).toBe(true);
    expect(lifecycle.transitionTo('S3B_AUDIT')).toBe(true);
    expect(lifecycle.transitionTo('S3B_COMPLETED')).toBe(true);
    expect(lifecycle.getPhase()).toBe('S3B_COMPLETED');
  });

  it('rejects illegal transitions', () => {
    const lifecycle = new ExecutionLifecycle();
    expect(lifecycle.transitionTo('S3B_COMPLETED')).toBe(false);
    expect(lifecycle.getPhase()).toBe('S3B_INITIAL');
  });

  it('rejects transition from COMPLETED', () => {
    const lifecycle = new ExecutionLifecycle();
    lifecycle.transitionTo('S3B_APPROVAL');
    lifecycle.transitionTo('S3B_EXECUTION');
    lifecycle.transitionTo('S3B_VERIFICATION');
    lifecycle.transitionTo('S3B_AUDIT');
    lifecycle.transitionTo('S3B_COMPLETED');
    expect(lifecycle.transitionTo('S3B_APPROVAL')).toBe(false);
  });

  it('rejects transition from FAILED', () => {
    const lifecycle = new ExecutionLifecycle();
    lifecycle.transitionTo('S3B_APPROVAL');
    lifecycle.transitionTo('S3B_FAILED');
    expect(lifecycle.transitionTo('S3B_AUDIT')).toBe(false);
  });

  it('records all phase transitions', () => {
    const lifecycle = new ExecutionLifecycle();
    lifecycle.transitionTo('S3B_APPROVAL');
    lifecycle.transitionTo('S3B_EXECUTION');
    const transitions = lifecycle.getTransitions();
    expect(transitions).toHaveLength(2);
    expect(transitions[0].from).toBe('S3B_INITIAL');
    expect(transitions[0].to).toBe('S3B_APPROVAL');
    expect(transitions[1].from).toBe('S3B_APPROVAL');
    expect(transitions[1].to).toBe('S3B_EXECUTION');
  });

  it('records audit events with current phase', () => {
    const lifecycle = new ExecutionLifecycle();
    lifecycle.transitionTo('S3B_APPROVAL');
    lifecycle.recordEvent('APPROVAL_PASSED', 'Gate approved');
    const events = lifecycle.getPhaseEvents();
    expect(events).toHaveLength(1);
    expect(events[0].phase).toBe('S3B_APPROVAL');
    expect(events[0].event).toBe('APPROVAL_PASSED');
  });

  it('detects COMPLETED as terminal', () => {
    const lifecycle = new ExecutionLifecycle();
    lifecycle.transitionTo('S3B_APPROVAL');
    lifecycle.transitionTo('S3B_EXECUTION');
    lifecycle.transitionTo('S3B_VERIFICATION');
    lifecycle.transitionTo('S3B_AUDIT');
    lifecycle.transitionTo('S3B_COMPLETED');
    expect(lifecycle.isTerminal()).toBe(true);
  });

  it('detects FAILED as terminal', () => {
    const lifecycle = new ExecutionLifecycle();
    lifecycle.transitionTo('S3B_APPROVAL');
    lifecycle.transitionTo('S3B_FAILED');
    expect(lifecycle.isTerminal()).toBe(true);
  });

  it('detects initial phase as non-terminal', () => {
    const lifecycle = new ExecutionLifecycle();
    expect(lifecycle.isTerminal()).toBe(false);
  });

  it('supports rollback transition path', () => {
    const lifecycle = new ExecutionLifecycle();
    lifecycle.transitionTo('S3B_APPROVAL');
    lifecycle.transitionTo('S3B_ROLLBACK');
    expect(lifecycle.getPhase()).toBe('S3B_ROLLBACK');
    lifecycle.transitionTo('S3B_FAILED');
    expect(lifecycle.getPhase()).toBe('S3B_FAILED');
  });

  it('reset returns to initial state', () => {
    const lifecycle = new ExecutionLifecycle();
    lifecycle.transitionTo('S3B_APPROVAL');
    lifecycle.recordEvent('test', 'detail');
    lifecycle.reset();
    expect(lifecycle.getPhase()).toBe('S3B_INITIAL');
    expect(lifecycle.getTransitions()).toHaveLength(0);
    expect(lifecycle.getPhaseEvents()).toHaveLength(0);
  });

  it('defines complete phase transition matrix', () => {
    const allPhases: S3BPhase[] = [
      'S3B_INITIAL', 'S3B_APPROVAL', 'S3B_EXECUTION',
      'S3B_VERIFICATION', 'S3B_AUDIT', 'S3B_ROLLBACK',
      'S3B_COMPLETED', 'S3B_FAILED',
    ];
    for (const phase of allPhases) {
      expect(S3B_PHASE_TRANSITIONS[phase]).toBeDefined();
      expect(Array.isArray(S3B_PHASE_TRANSITIONS[phase])).toBe(true);
    }
  });
});

// ============================================================
// ExecutionOrchestrator
// ============================================================

describe('ExecutionOrchestrator', () => {
  let orchestrator: ExecutionOrchestrator;

  beforeEach(() => {
    ConnectorRuntimeRegistry.clear();
    orchestrator = new ExecutionOrchestrator();
  });

  it('passes through non-S3A results unchanged', async () => {
    registerRuntime();

    const context = createCorruptedS3BContext({ queueId: undefined });
    const result = await orchestrator.orchestrate(context);

    expect(result.outcome).toBe('S3B_PASS_THROUGH');
    expect(result.runtimeResult.status).toBe('FAILED');
    expect(result.runtimeResult.executionAttempted).toBe(false);
    expect(result.runtimeResult.failureClassification).toBe(ExecutionFailureCode.QUEUE_INVALID);
    expect(result.s3bPhases).toHaveLength(0);
  });

  it('executes the full S3B pipeline for an eligible S3A result', async () => {
    registerRuntime();

    const context = createS3BContext();
    const result = await orchestrator.orchestrate(context);

    expect(result.outcome).toBe('S3B_COMPLETED');
    expect(result.runtimeResult.status).toBe('SUCCESS');
    expect(result.runtimeResult.executionAttempted).toBe(true);
    expect(result.runtimeResult.providerMutationAttempted).toBe(false);
    expect(result.runtimeResult.providerMutationCompleted).toBe(false);
    expect(result.s3bPhases.length).toBeGreaterThan(0);
  });

  it('records S3B phase events in the result', async () => {
    registerRuntime();

    const context = createS3BContext();
    const result = await orchestrator.orchestrate(context);

    expect(result.s3bAuditEvents.length).toBeGreaterThan(0);
    expect(result.lifecycleCompleted).toBe(true);
  });

  it('passes through when approval gate denies execution', async () => {
    registerRuntime();

    const denyingGate: ApprovalGate = {
      evaluate: async (request: ApprovalRequest): Promise<ApprovalVerdict> => ({
        decision: 'DENIED',
        approvedAt: null,
        approvedBy: null,
        approvalLevel: 'STANDARD',
        conditions: [],
        reason: 'Not authorized for this risk level',
      }),
    };

    const context = createS3BContext();
    const result = await orchestrator.orchestrate(context, denyingGate);

    expect(result.outcome).toBe('S3B_FAILED');
    expect(result.runtimeResult.status).toBe('FAILED');
    expect(result.runtimeResult.failureClassification).toBe(ExecutionFailureCode.APPROVAL_MISSING);
    expect(result.runtimeResult.blockingReasons).toContain('APPROVAL_DENIED');
  });

  it('passes through when approval gate approves execution', async () => {
    registerRuntime();

    const approvingGate: ApprovalGate = {
      evaluate: async (request: ApprovalRequest): Promise<ApprovalVerdict> => ({
        decision: 'APPROVED',
        approvedAt: '2026-01-01T00:00:00Z',
        approvedBy: 'governance-board',
        approvalLevel: 'STANDARD',
        conditions: [],
        reason: 'Approved for execution',
      }),
    };

    const context = createS3BContext();
    const result = await orchestrator.orchestrate(context, approvingGate);

    expect(result.outcome).toBe('S3B_COMPLETED');
    expect(result.runtimeResult.status).toBe('SUCCESS');
  });

  it('triggers rollback when approval gate throws', async () => {
    registerRuntime();

    const throwingGate: ApprovalGate = {
      evaluate: async () => { throw new Error('Gate unavailable'); },
    };

    const context = createS3BContext();
    const result = await orchestrator.orchestrate(context, throwingGate);

    expect(result.outcome).toBe('S3B_FAILED');
    expect(result.runtimeResult.blockingReasons).toContain('APPROVAL_DENIED');
  });

  it('invokes rollback executor on approval denial', async () => {
    registerRuntime();

    const denyingGate: ApprovalGate = {
      evaluate: async () => ({
        decision: 'DENIED',
        approvedAt: null,
        approvedBy: null,
        approvalLevel: 'STANDARD',
        conditions: [],
        reason: 'Denied',
      }),
    };

    let rollbackCalled = false;
    const mockRollbackExecutor: RollbackExecutor = {
      supportsRollback: true,
      rollbackStrategies: ['REVERSE_ORDER'],
      plan: async () => {
        rollbackCalled = true;
        return {
          rollbackId: 'rb-1',
          executionId: 'exe-1',
          connectorId: 'google-drive',
          operation: 'upload',
          scope: 'FULL',
          strategy: 'REVERSE_ORDER',
          steps: [],
          plannedAt: '2026-01-01T00:00:00Z',
          planHash: 'rb-hash',
        };
      },
    };

    const context = createS3BContext();
    const result = await orchestrator.orchestrate(context, denyingGate, mockRollbackExecutor);

    expect(rollbackCalled).toBe(true);
  });

  it('completes successfully even without a rollback executor', async () => {
    registerRuntime();

    const context = createS3BContext();
    const result = await orchestrator.orchestrate(context);

    expect(result.outcome).toBe('S3B_COMPLETED');
    expect(result.runtimeResult.warnings).toContain('No approval gate configured');
  });

  it('never invokes connector runtime methods', async () => {
    const runtime = registerRuntime();

    const context = createS3BContext();
    await orchestrator.orchestrate(context);

    expect(runtime.prepare).not.toHaveBeenCalled();
    expect(runtime.execute).not.toHaveBeenCalled();
    expect(runtime.verify).not.toHaveBeenCalled();
    expect(runtime.rollback).not.toHaveBeenCalled();
    expect(runtime.audit).not.toHaveBeenCalled();
  });

  it('returns deterministic results for identical inputs', async () => {
    registerRuntime();

    const context = createS3BContext();
    const result1 = await orchestrator.orchestrate(context);
    const result2 = await orchestrator.orchestrate(createS3BContext());

    expect(result1.outcome).toBe(result2.outcome);
    expect(result1.runtimeResult.deterministicHashes.pipelineHash).toBeDefined();
    expect(result2.runtimeResult.deterministicHashes.pipelineHash).toBeDefined();
  });

  it('records S3B lifecycle transitions in the result', async () => {
    registerRuntime();

    const context = createS3BContext();
    const result = await orchestrator.orchestrate(context);

    expect(result.s3bPhases.length).toBeGreaterThanOrEqual(4);
    expect(result.s3bPhases[0]).toContain('S3B_INITIAL->S3B_APPROVAL');
  });

  it('round-trips orchestration result through JSON', async () => {
    registerRuntime();

    const context = createS3BContext();
    const result = await orchestrator.orchestrate(context);

    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });

  it('produces a RuntimeResult with executionAttempted=true', async () => {
    registerRuntime();

    const context = createS3BContext();
    const result = await orchestrator.orchestrate(context);

    expect(result.runtimeResult.executionAttempted).toBe(true);
  });

  it('produces a RuntimeResult with providerMutationAttempted=false', async () => {
    registerRuntime();

    const context = createS3BContext();
    const result = await orchestrator.orchestrate(context);

    expect(result.runtimeResult.providerMutationAttempted).toBe(false);
    expect(result.runtimeResult.providerMutationCompleted).toBe(false);
  });
});
