import { beforeEach, describe, it, expect, vi } from 'vitest';
import { ExecutionRuntime } from '../../lib/platform/execution/execution-runtime';
import { ExecutionContextManager } from '../../lib/platform/execution/execution-context';
import { ConnectorRuntimeCapabilities } from '../../lib/platform/execution/capabilities';
import { QueueCandidate } from '../../lib/platform/queue/types';
import { GovernanceDecision } from '../../lib/platform/governance/types';
import { ConnectorRuntimeRegistry } from '../../lib/platform/execution/connector-runtime-registry';
import { StateMachine } from '../../lib/platform/execution/state-machine';
import { SafetyGauntlet } from '../../lib/platform/execution/safety-gauntlet';
import { ExecutionFailureCode } from '../../lib/platform/execution/failure-classifier';
import { SnapshotValidator } from '../../lib/platform/execution/snapshot-validator';
import { FAILURE_TAXONOMY } from '../../lib/platform/execution/failure-classifier';
import { RUNTIME_TRANSITION_MATRIX } from '../../lib/platform/execution/transition-matrix';
import { RuntimeSnapshot } from '../../lib/platform/execution/capabilities';

describe('Platform Execution Stage 3A - Production Grade Certification', () => {
  beforeEach(() => {
    ConnectorRuntimeRegistry.clear();
  });

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

  async function runCandidate(
    candidate: QueueCandidate = mockCandidate,
    decision: GovernanceDecision = mockDecision,
    capabilities: ConnectorRuntimeCapabilities = s3aCapabilities,
  ) {
    registerRuntime(candidate.connectorId);
    return ExecutionRuntime.run(
      ExecutionContextManager.create(candidate, decision, capabilities),
    );
  }

  it('maintains strict immutability of the initial context throughout the pipeline', async () => {
    registerRuntime();

    const initialContext = ExecutionContextManager.create(mockCandidate, mockDecision, s3aCapabilities);
    const contextClone = JSON.parse(JSON.stringify(initialContext));

    await ExecutionRuntime.run(initialContext);

    expect(initialContext).toEqual(contextClone);
    expect(initialContext.auditLog.length).toBe(0);
  });

  it('produces a deterministic result with matching pipeline hashes for identical inputs', async () => {
    registerRuntime();

    const context = ExecutionContextManager.create(mockCandidate, mockDecision, s3aCapabilities);
    const result1 = await ExecutionRuntime.run(context);
    const result2 = await ExecutionRuntime.run(context);

    expect(result1).toEqual(result2);
    expect(result1.deterministicHashes.pipelineHash).toBeDefined();
    expect(result1.finalState).toBe('COMPLETED');
  });

  it('terminates in COMPLETED state via EXECUTION_BLOCKED for all 3A connectors', async () => {
    registerRuntime();

    const context = ExecutionContextManager.create(mockCandidate, mockDecision, s3aCapabilities);
    const result = await ExecutionRuntime.run(context);

    expect(result.finalState).toBe('COMPLETED');
    expect(result.blockingReasons).toContain('S3A_EXECUTION_BLOCKED');
  });

  it('rejects invalid transitions using the Transition Matrix', () => {
    const sm = new StateMachine();
    expect(() => sm.transitionTo('COMPLETED')).toThrow(/INVALID_STATE_TRANSITION/);
  });

  it('correctly identifies failure codes from the Failure Taxonomy', async () => {
    const candidate = { ...mockCandidate, queueId: undefined as any };
    const context = ExecutionContextManager.create(candidate, mockDecision, s3aCapabilities);
    const result = await ExecutionRuntime.run(context);

    expect(result.failureClassification).toBe('QUEUE_INVALID');
  });

  it('blocks Stage 3A even when unsafe capabilities are supplied', () => {
    const unsafeCapabilities: ConnectorRuntimeCapabilities = {
      ...s3aCapabilities,
      execute: true,
      verify: true,
      rollback: true,
      providerMutationAllowed: true,
      networkMutationAllowed: true,
    };

    expect(SafetyGauntlet.check(mockCandidate, mockDecision, unsafeCapabilities)).toBe(
      ExecutionFailureCode.S3A_EXECUTION_BLOCKED,
    );
  });

  it('never invokes connector runtime methods', async () => {
    const runtime = registerRuntime();
    const context = ExecutionContextManager.create(mockCandidate, mockDecision, s3aCapabilities);

    await ExecutionRuntime.run(context);

    expect(runtime.prepare).not.toHaveBeenCalled();
    expect(runtime.execute).not.toHaveBeenCalled();
    expect(runtime.verify).not.toHaveBeenCalled();
    expect(runtime.rollback).not.toHaveBeenCalled();
    expect(runtime.audit).not.toHaveBeenCalled();
  });

  it('deep-freezes runtime snapshots', () => {
    const context = ExecutionContextManager.create(mockCandidate, mockDecision, s3aCapabilities);
    const snapshot = ExecutionContextManager.createSnapshot(context, 0, 'Package Validation');

    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.context)).toBe(true);
    expect(Object.isFrozen(snapshot.context.candidate)).toBe(true);
    expect(Object.isFrozen(snapshot.context.auditLog)).toBe(true);
    expect(SnapshotValidator.validate(snapshot)).toEqual({ valid: true, errors: [] });
  });

  it('creates identical snapshots for identical inputs', () => {
    const context = ExecutionContextManager.create(mockCandidate, mockDecision, s3aCapabilities);

    const first = ExecutionContextManager.createSnapshot(context, 0, 'Package Validation');
    const second = ExecutionContextManager.createSnapshot(context, 0, 'Package Validation');

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it('round-trips runtime results through JSON', async () => {
    registerRuntime();
    const context = ExecutionContextManager.create(mockCandidate, mockDecision, s3aCapabilities);
    const result = await ExecutionRuntime.run(context);

    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });

  it('does not emit Date instances or functions in the runtime result', async () => {
    registerRuntime();
    const context = ExecutionContextManager.create(mockCandidate, mockDecision, s3aCapabilities);
    const result = await ExecutionRuntime.run(context);

    const values: unknown[] = [result];
    while (values.length > 0) {
      const value = values.pop();
      expect(value).not.toBeInstanceOf(Date);
      expect(typeof value).not.toBe('function');
      if (value && typeof value === 'object') {
        values.push(...Object.values(value));
      }
    }
  });

  it('returns CONNECTOR_NOT_REGISTERED for an unknown connector', async () => {
    const context = ExecutionContextManager.create(mockCandidate, mockDecision, s3aCapabilities);
    const result = await ExecutionRuntime.run(context);

    expect(result.failureClassification).toBe(ExecutionFailureCode.CONNECTOR_NOT_REGISTERED);
    expect(result.finalState).toBe('FAILED');
  });

  it('rejects incompatible governance versions before execution', async () => {
    registerRuntime();
    const candidate = { ...mockCandidate, governanceVersion: '2.0.0' };
    const context = ExecutionContextManager.create(candidate, mockDecision, s3aCapabilities);
    const result = await ExecutionRuntime.run(context);

    expect(result.failureClassification).toBe(ExecutionFailureCode.GOVERNANCE_VERSION_MISMATCH);
    expect(result.executionAttempted).toBe(false);
  });

  it('forbids transitioning from EXECUTION_BLOCKED to EXECUTING', () => {
    const stateMachine = new StateMachine('EXECUTION_BLOCKED');

    expect(() => stateMachine.transitionTo('EXECUTING')).toThrow(/INVALID_STATE_TRANSITION/);
  });

  it('returns registered connector IDs in stable order', () => {
    registerRuntime('slack');
    registerRuntime('google-drive');
    registerRuntime('github');

    expect(ConnectorRuntimeRegistry.getAllRegisteredConnectors()).toEqual([
      'github',
      'google-drive',
      'slack',
    ]);
  });

  it('records false execution and provider mutation flags in the audit', async () => {
    registerRuntime();
    const context = ExecutionContextManager.create(mockCandidate, mockDecision, s3aCapabilities);
    const result = await ExecutionRuntime.run(context);

    expect(result.auditProjection).toMatchObject({
      executionAttempted: false,
      providerMutationAttempted: false,
      providerMutationCompleted: false,
    });
  });

  it('rejects a package without a decision ID', async () => {
    const result = await runCandidate({ ...mockCandidate, decisionId: '' });
    expect(result.failureClassification).toBe(ExecutionFailureCode.QUEUE_INVALID);
  });

  it('rejects a package without a preview ID', async () => {
    const result = await runCandidate({ ...mockCandidate, previewId: '' });
    expect(result.failureClassification).toBe(ExecutionFailureCode.QUEUE_INVALID);
  });

  it('rejects a package without an idempotency token', async () => {
    const result = await runCandidate({ ...mockCandidate, idempotencyToken: '' });
    expect(result.failureClassification).toBe(ExecutionFailureCode.QUEUE_INVALID);
  });

  it('rejects a package without replay duplicate detection metadata', async () => {
    const candidate = {
      ...mockCandidate,
      replayProtection: {
        ...mockCandidate.replayProtection,
        duplicateDetectionKey: '',
      },
    };
    const result = await runCandidate(candidate);
    expect(result.failureClassification).toBe(ExecutionFailureCode.QUEUE_INVALID);
  });

  it('rejects a package without replay conflict identity', async () => {
    const candidate = {
      ...mockCandidate,
      replayProtection: {
        ...mockCandidate.replayProtection,
        conflictIdentity: '',
      },
    };
    const result = await runCandidate(candidate);
    expect(result.failureClassification).toBe(ExecutionFailureCode.QUEUE_INVALID);
  });

  it('rejects a package without queue uniqueness metadata', async () => {
    const candidate = {
      ...mockCandidate,
      replayProtection: {
        ...mockCandidate.replayProtection,
        queueUniqueness: '',
      },
    };
    const result = await runCandidate(candidate);
    expect(result.failureClassification).toBe(ExecutionFailureCode.QUEUE_INVALID);
  });

  it('rejects a package without an execution manifest', async () => {
    const candidate = { ...mockCandidate, executionManifest: undefined } as unknown as QueueCandidate;
    const result = await runCandidate(candidate);
    expect(result.failureClassification).toBe(ExecutionFailureCode.QUEUE_INVALID);
  });

  it('rejects a queue candidate that enables execution eligibility', async () => {
    const candidate = { ...mockCandidate, executionEligible: true } as unknown as QueueCandidate;
    const result = await runCandidate(candidate);
    expect(result.failureClassification).toBe(ExecutionFailureCode.QUEUE_INVALID);
  });

  it('rejects a queue candidate that enables execution authorization', async () => {
    const candidate = { ...mockCandidate, executionAuthorized: true } as unknown as QueueCandidate;
    const result = await runCandidate(candidate);
    expect(result.failureClassification).toBe(ExecutionFailureCode.QUEUE_INVALID);
  });

  it('rejects an unsupported policy version on the queue candidate', async () => {
    const result = await runCandidate({ ...mockCandidate, policyVersion: '2.0.0' });
    expect(result.failureClassification).toBe(ExecutionFailureCode.POLICY_VERSION_MISMATCH);
  });

  it('rejects a policy version mismatch between queue and decision', async () => {
    const decision = { ...mockDecision, policyVersion: '0.9.0' };
    const result = await runCandidate(mockCandidate, decision);
    expect(result.failureClassification).toBe(ExecutionFailureCode.POLICY_VERSION_MISMATCH);
  });

  it('rejects a governance version mismatch between queue and decision', async () => {
    const decision = { ...mockDecision, governanceVersion: '0.9.0' };
    const result = await runCandidate(mockCandidate, decision);
    expect(result.failureClassification).toBe(ExecutionFailureCode.GOVERNANCE_VERSION_MISMATCH);
  });

  it('rejects a governance decision reference mismatch', async () => {
    const decision = { ...mockDecision, decisionId: 'dec-other' };
    const result = await runCandidate(mockCandidate, decision);
    expect(result.failureClassification).toBe(ExecutionFailureCode.GOVERNANCE_REVALIDATION_FAILED);
  });

  it('rejects a governance decision that is not queue eligible', async () => {
    const decision = { ...mockDecision, queueEligible: false };
    const result = await runCandidate(mockCandidate, decision);
    expect(result.failureClassification).toBe(ExecutionFailureCode.GOVERNANCE_REVALIDATION_FAILED);
  });

  it('rejects a governance decision with blocking reasons', async () => {
    const decision = { ...mockDecision, blockingReasons: ['POLICY_PUBLIC_SHARING'] };
    const result = await runCandidate(mockCandidate, decision);
    expect(result.failureClassification).toBe(ExecutionFailureCode.GOVERNANCE_REVALIDATION_FAILED);
  });

  it('rejects a manifest without declared OAuth scopes', async () => {
    const candidate = {
      ...mockCandidate,
      executionManifest: {
        ...mockCandidate.executionManifest,
        requiredScopes: [],
      },
    };
    const result = await runCandidate(candidate);
    expect(result.failureClassification).toBe(ExecutionFailureCode.SCOPE_MISSING);
  });

  it('changes the pipeline hash when replay identity changes', async () => {
    const first = await runCandidate();
    const changed = {
      ...mockCandidate,
      replayProtection: {
        ...mockCandidate.replayProtection,
        conflictIdentity: 'c-2',
      },
    };
    const second = await runCandidate(changed);
    expect(first.deterministicHashes.pipelineHash).not.toBe(second.deterministicHashes.pipelineHash);
  });

  it('changes the snapshot hash when candidate input changes', () => {
    const firstContext = ExecutionContextManager.create(mockCandidate, mockDecision, s3aCapabilities);
    const changedContext = ExecutionContextManager.create(
      { ...mockCandidate, operation: 'rename' },
      mockDecision,
      s3aCapabilities,
    );
    const first = ExecutionContextManager.createSnapshot(firstContext, 0, 'Package Validation');
    const changed = ExecutionContextManager.createSnapshot(changedContext, 0, 'Package Validation');
    expect(first.snapshotHash).not.toBe(changed.snapshotHash);
  });

  it('detaches snapshot data from later source mutations', () => {
    const candidate = JSON.parse(JSON.stringify(mockCandidate)) as QueueCandidate;
    const context = ExecutionContextManager.create(candidate, mockDecision, s3aCapabilities);
    const snapshot = ExecutionContextManager.createSnapshot(context, 0, 'Package Validation');
    candidate.operation = 'rename';
    expect(snapshot.context.candidate.operation).toBe('upload');
  });

  it('reports a missing snapshot hash deterministically', () => {
    const context = ExecutionContextManager.create(mockCandidate, mockDecision, s3aCapabilities);
    const snapshot = ExecutionContextManager.createSnapshot(context, 0, 'Package Validation');
    const invalid = { ...snapshot, snapshotHash: '' } as RuntimeSnapshot;
    expect(SnapshotValidator.validate(invalid).errors).toEqual(['MISSING_SNAPSHOT_HASH']);
  });

  it('reports a missing snapshot step name deterministically', () => {
    const context = ExecutionContextManager.create(mockCandidate, mockDecision, s3aCapabilities);
    const snapshot = ExecutionContextManager.createSnapshot(context, 0, 'Package Validation');
    const invalid = { ...snapshot, stepName: '' } as RuntimeSnapshot;
    expect(SnapshotValidator.validate(invalid).errors).toEqual(['MISSING_STEP_NAME']);
  });

  it('reconstructs snapshot audit entries in pipeline order', () => {
    const context = ExecutionContextManager.create(mockCandidate, mockDecision, s3aCapabilities);
    const snapshots = [
      ExecutionContextManager.createSnapshot(context, 0, 'Package Validation'),
      ExecutionContextManager.createSnapshot(context, 1, 'Capability Resolution'),
    ];
    expect(SnapshotValidator.reconstructAuditTrail(snapshots)).toEqual([
      expect.stringContaining('Step 0 [Package Validation]'),
      expect.stringContaining('Step 1 [Capability Resolution]'),
    ]);
  });

  it('preserves snapshot replay consistency through JSON', () => {
    const context = ExecutionContextManager.create(mockCandidate, mockDecision, s3aCapabilities);
    const snapshot = ExecutionContextManager.createSnapshot(context, 2, 'Safety Gauntlet');
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
  });

  it('records complete audit provenance versions and references', async () => {
    const result = await runCandidate();
    expect(result.auditProjection).toMatchObject({
      executionId: 'exe-q-1',
      queueId: 'q-1',
      decisionId: 'dec-1',
      previewId: 'p-1',
      connectorId: 'google-drive',
      runtimeVersion: '1.0.0',
      governanceVersion: '1.0.0',
      policyVersion: '1.0.0',
      queueVersion: '1.0.0',
      connectorVersion: '1.0.0',
    });
  });

  it('records lifecycle transitions in canonical order', async () => {
    const result = await runCandidate();
    expect(result.auditProjection?.transitions.map(({ state }) => state)).toEqual([
      'VALIDATING_PACKAGE',
      'LOCK_VALIDATION',
      'PREPARING',
      'PREFLIGHT',
      'READY',
      'EXECUTION_BLOCKED',
      'AUDITING',
      'COMPLETED',
    ]);
  });

  it('round-trips the audit projection through JSON', async () => {
    const result = await runCandidate();
    expect(JSON.parse(JSON.stringify(result.auditProjection))).toEqual(result.auditProjection);
  });

  it('does not emit undefined values in the serialized result', async () => {
    const result = await runCandidate();
    expect(JSON.stringify(result)).not.toContain('undefined');
  });

  it('replaces duplicate connector registrations deterministically', () => {
    const first = registerRuntime();
    const second = registerRuntime();
    expect(ConnectorRuntimeRegistry.getRuntime('google-drive')).toBe(second);
    expect(ConnectorRuntimeRegistry.getRuntime('google-drive')).not.toBe(first);
    expect(ConnectorRuntimeRegistry.getAllRegisteredConnectors()).toEqual(['google-drive']);
  });

  it('isolates connector registrations by exact connector ID', async () => {
    registerRuntime('google-drive');
    const slackCandidate = { ...mockCandidate, connectorId: 'slack' };
    const result = await ExecutionRuntime.run(
      ExecutionContextManager.create(slackCandidate, mockDecision, s3aCapabilities),
    );
    expect(result.failureClassification).toBe(ExecutionFailureCode.CONNECTOR_NOT_REGISTERED);
  });

  it('permits the complete canonical Stage 3A transition chain', () => {
    const stateMachine = new StateMachine();
    for (const state of [
      'VALIDATING_PACKAGE',
      'LOCK_VALIDATION',
      'PREPARING',
      'PREFLIGHT',
      'READY',
      'EXECUTION_BLOCKED',
      'AUDITING',
      'COMPLETED',
    ] as const) {
      stateMachine.transitionTo(state);
    }
    expect(stateMachine.getState()).toBe('COMPLETED');
  });

  it('forbids READY from skipping directly to COMPLETED', () => {
    const stateMachine = new StateMachine('READY');
    expect(() => stateMachine.transitionTo('COMPLETED')).toThrow(/INVALID_STATE_TRANSITION/);
  });

  it('keeps COMPLETED as a terminal state', () => {
    const stateMachine = new StateMachine('COMPLETED');
    expect(() => stateMachine.transitionTo('RECEIVED')).toThrow(/INVALID_STATE_TRANSITION/);
  });

  it('keeps FAILED as a terminal state', () => {
    const stateMachine = new StateMachine('FAILED');
    expect(() => stateMachine.transitionTo('EXECUTING')).toThrow(/INVALID_STATE_TRANSITION/);
  });

  it('declares EXECUTING forbidden after EXECUTION_BLOCKED', () => {
    expect(RUNTIME_TRANSITION_MATRIX.EXECUTION_BLOCKED.forbidden).toContain('EXECUTING');
    expect(RUNTIME_TRANSITION_MATRIX.EXECUTION_BLOCKED.allowed).not.toContain('EXECUTING');
  });

  it('defines complete metadata for every failure classification', () => {
    for (const code of Object.values(ExecutionFailureCode)) {
      expect(FAILURE_TAXONOMY[code]).toEqual({
        description: expect.any(String),
        severity: expect.stringMatching(/^(LOW|MODERATE|HIGH|CRITICAL)$/),
        isTransient: expect.any(Boolean),
        remediation: expect.any(String),
      });
    }
  });
});
