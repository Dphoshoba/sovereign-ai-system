import { describe, it, expect } from 'vitest';
import { createExecutionRequest, computeDeterministicPlanHash } from '../../lib/platform/execution/execution-request';
import { QueueCandidate } from '../../lib/platform/queue/types';
import { GovernanceDecision } from '../../lib/platform/governance/types';
import { ConnectorRuntimeCapabilities } from '../../lib/platform/execution/capabilities';
import { ConnectorExecutionAdapter } from '../../lib/platform/execution/connector-execution-adapter';
import { ConnectorCapabilityProfile, OperationCapability } from '../../lib/platform/execution/capability-contract';
import { ApprovalGate, ApprovalRequest, ApprovalVerdict } from '../../lib/platform/execution/approval-contract';
import { RollbackExecutor, RollbackPlan } from '../../lib/platform/execution/rollback-contract';
import { ExecutionResult } from '../../lib/platform/execution/execution-result';

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

describe('Stage 3B.1 — Connector Execution Adapter Contract', () => {
  it('defines the correct interface shape for ConnectorExecutionAdapter', () => {
    const adapter: ConnectorExecutionAdapter = {
      adapterId: 'test-adapter',
      supportedConnectorIds: ['test-connector'],
      execute: async () => ({
        mutationId: 'mut-1',
        providerState: { key: 'value' },
        etag: 'abc123',
        revision: 1,
        mutatedAt: '2026-01-01T00:00:00Z',
      }),
      verify: async () => ({
        verified: true,
        providerState: { key: 'value' },
        drift: [],
        verifiedAt: '2026-01-01T00:00:00Z',
      }),
      rollback: async () => ({
        rollbackApplied: true,
        providerState: { key: 'value' },
        rollbackId: 'rb-1',
        rolledBackAt: '2026-01-01T00:00:00Z',
      }),
      audit: async () => ({
        mutationId: null,
        providerState: null,
        executionDurationMs: 0,
        mutationAttempted: false,
        rollbackAttempted: false,
        rollbackSuccessful: false,
      } as ExecutionResult),
    };

    expect(adapter.adapterId).toBe('test-adapter');
    expect(adapter.supportedConnectorIds).toEqual(['test-connector']);
    expect(typeof adapter.execute).toBe('function');
    expect(typeof adapter.verify).toBe('function');
    expect(typeof adapter.rollback).toBe('function');
    expect(typeof adapter.audit).toBe('function');
  });

  it('executes and returns a valid ProviderMutationResult', async () => {
    const adapter: ConnectorExecutionAdapter = {
      adapterId: 'test-adapter',
      supportedConnectorIds: ['test-connector'],
      execute: async () => ({
        mutationId: 'mut-1',
        providerState: { fileId: 'f-1', name: 'test.txt' },
        etag: 'etag-1',
        revision: 2,
        mutatedAt: '2026-01-01T00:00:00Z',
      }),
      verify: async () => ({ verified: true, providerState: {}, drift: [], verifiedAt: '' }),
      rollback: async () => ({ rollbackApplied: true, providerState: {}, rollbackId: '', rolledBackAt: '' }),
      audit: async () => ({} as ExecutionResult),
    };

    const result = await adapter.execute({} as any, mockCandidate);
    expect(result.mutationId).toBe('mut-1');
    expect(result.etag).toBe('etag-1');
    expect(result.revision).toBe(2);
    expect(result.mutatedAt).toBe('2026-01-01T00:00:00Z');
  });

  it('verifies and reports drift', async () => {
    const adapter: ConnectorExecutionAdapter = {
      adapterId: 'test-adapter',
      supportedConnectorIds: ['test-connector'],
      execute: async () => ({ mutationId: '', providerState: {}, mutatedAt: '' }),
      verify: async () => ({
        verified: false,
        providerState: { name: 'changed.txt' },
        drift: ['name: expected test.txt, got changed.txt'],
        verifiedAt: '2026-01-01T00:00:00Z',
      }),
      rollback: async () => ({ rollbackApplied: true, providerState: {}, rollbackId: '', rolledBackAt: '' }),
      audit: async () => ({} as ExecutionResult),
    };

    const result = await adapter.verify({} as any, {} as any, mockCandidate);
    expect(result.verified).toBe(false);
    expect(result.drift.length).toBeGreaterThan(0);
  });

  it('rolls back and confirms', async () => {
    const adapter: ConnectorExecutionAdapter = {
      adapterId: 'test-adapter',
      supportedConnectorIds: ['test-connector'],
      execute: async () => ({ mutationId: '', providerState: {}, mutatedAt: '' }),
      verify: async () => ({ verified: true, providerState: {}, drift: [], verifiedAt: '' }),
      rollback: async () => ({
        rollbackApplied: true,
        providerState: { name: 'original.txt' },
        rollbackId: 'rb-1',
        rolledBackAt: '2026-01-01T00:00:00Z',
      }),
      audit: async () => ({} as ExecutionResult),
    };

    const result = await adapter.rollback({} as any, new Error('test failure'), mockCandidate);
    expect(result.rollbackApplied).toBe(true);
    expect(result.rollbackId).toBe('rb-1');
    expect(result.rollbackApplied).toBe(true);
  });
});

describe('Stage 3B.1 — Capability Contract', () => {
  it('defines a valid ConnectorCapabilityProfile', () => {
    const profile: ConnectorCapabilityProfile = {
      connectorId: 'google-drive',
      connectorVersion: '1.0.0',
      supportedOperations: [
        {
          operation: 'upload',
          canDryRun: true,
          canExecute: true,
          canVerify: true,
          canRollback: true,
          supportsIdempotency: true,
          riskLevel: 'MODIFY',
          requiredApprovalLevel: 'STANDARD',
          requiredScopes: ['https://www.googleapis.com/auth/drive.file'],
          parameters: [
            { name: 'fileName', type: 'string', required: true, description: 'Destination file name' },
            { name: 'mimeType', type: 'string', required: false, description: 'MIME type of the file' },
          ],
        },
      ],
    };

    expect(profile.connectorId).toBe('google-drive');
    expect(profile.supportedOperations).toHaveLength(1);
    expect(profile.supportedOperations[0].operation).toBe('upload');
    expect(profile.supportedOperations[0].riskLevel).toBe('MODIFY');
    expect(profile.supportedOperations[0].requiredApprovalLevel).toBe('STANDARD');
  });

  it('classifies risk levels correctly', () => {
    const readOp: OperationCapability = {
      operation: 'list',
      canDryRun: false,
      canExecute: true,
      canVerify: true,
      canRollback: false,
      supportsIdempotency: true,
      riskLevel: 'READ',
      requiredApprovalLevel: 'NONE',
      requiredScopes: [],
      parameters: [],
    };

    const destructiveOp: OperationCapability = {
      operation: 'delete',
      canDryRun: true,
      canExecute: true,
      canVerify: true,
      canRollback: false,
      supportsIdempotency: false,
      riskLevel: 'DESTRUCTIVE',
      requiredApprovalLevel: 'CRITICAL',
      requiredScopes: [],
      parameters: [],
    };

    expect(readOp.riskLevel).toBe('READ');
    expect(readOp.requiredApprovalLevel).toBe('NONE');
    expect(destructiveOp.riskLevel).toBe('DESTRUCTIVE');
    expect(destructiveOp.requiredApprovalLevel).toBe('CRITICAL');
  });
});

describe('Stage 3B.1 — Execution Request Contract', () => {
  it('creates a deterministic execution request', () => {
    const request = createExecutionRequest(mockCandidate, mockDecision, s3aCapabilities);

    expect(request.executionId).toBe('s3b-q-1');
    expect(request.queueId).toBe('q-1');
    expect(request.connectorId).toBe('google-drive');
    expect(request.operation).toBe('upload');
    expect(request.planHash).toBeTruthy();
    expect(request.requestedAt).toBe('2026-01-01T00:00:00Z');
  });

  it('produces identical plan hashes for identical inputs', () => {
    const request1 = createExecutionRequest(mockCandidate, mockDecision, s3aCapabilities);
    const request2 = createExecutionRequest(mockCandidate, mockDecision, s3aCapabilities);

    expect(request1.planHash).toBe(request2.planHash);
  });

  it('produces different plan hashes for different inputs', () => {
    const request1 = createExecutionRequest(mockCandidate, mockDecision, s3aCapabilities);
    const modifiedCandidate = { ...mockCandidate, operation: 'rename' };
    const request2 = createExecutionRequest(modifiedCandidate, mockDecision, s3aCapabilities);

    expect(request1.planHash).not.toBe(request2.planHash);
  });

  it('computeDeterministicPlanHash is stable', () => {
    const data = JSON.stringify({ a: 1, b: 'test', c: [1, 2, 3] });
    const hash1 = computeDeterministicPlanHash(data);
    const hash2 = computeDeterministicPlanHash(data);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^plan-[0-9a-f]{8}$/);
  });

  it('preserves candidate, decision, and capabilities references', () => {
    const request = createExecutionRequest(mockCandidate, mockDecision, s3aCapabilities);

    expect(request.candidate.queueId).toBe('q-1');
    expect(request.decision.decisionId).toBe('dec-1');
    expect(request.capabilities.stage).toBe('3A');
  });
});

describe('Stage 3B.1 — Execution Result Contract', () => {
  it('extends RuntimeResult with execution-specific fields', () => {
    const result: ExecutionResult = {
      status: 'SUCCESS',
      finalState: 'COMPLETED',
      transitionHistory: [],
      auditProjection: null,
      executionAttempted: false,
      providerMutationAttempted: false,
      providerMutationCompleted: false,
      deterministicHashes: { inputHash: '', outputHash: '', pipelineHash: '' },
      warnings: [],
      blockingReasons: [],
      executionOutcome: 'EXECUTION_SUCCEEDED',
      adapterId: 'test-adapter',
      mutationId: 'mut-1',
      providerState: { fileId: 'f-1' },
      executionDurationMs: 1500,
      mutationAttempted: true,
      rollbackAttempted: false,
      rollbackSuccessful: false,
    };

    expect(result.status).toBe('SUCCESS');
    expect(result.executionOutcome).toBe('EXECUTION_SUCCEEDED');
    expect(result.adapterId).toBe('test-adapter');
    expect(result.mutationId).toBe('mut-1');
    expect(result.executionDurationMs).toBe(1500);
    expect(result.mutationAttempted).toBe(true);
  });

  it('reports rollback outcomes correctly', () => {
    const result: ExecutionResult = {
      status: 'FAILED',
      finalState: 'FAILED',
      transitionHistory: [],
      auditProjection: null,
      executionAttempted: true,
      providerMutationAttempted: true,
      providerMutationCompleted: false,
      deterministicHashes: { inputHash: '', outputHash: '', pipelineHash: '' },
      warnings: [],
      blockingReasons: [],
      executionOutcome: 'ROLLBACK_FAILED',
      adapterId: 'test-adapter',
      mutationId: 'mut-1',
      providerState: null,
      executionDurationMs: 3200,
      mutationAttempted: true,
      rollbackAttempted: true,
      rollbackSuccessful: false,
    };

    expect(result.executionOutcome).toBe('ROLLBACK_FAILED');
    expect(result.rollbackAttempted).toBe(true);
    expect(result.rollbackSuccessful).toBe(false);
  });
});

describe('Stage 3B.1 — Approval Contract', () => {
  it('defines the ApprovalGate interface shape', () => {
    const gate: ApprovalGate = {
      evaluate: async (request: ApprovalRequest) => ({
        decision: 'APPROVED',
        approvedAt: '2026-01-01T00:00:00Z',
        approvedBy: 'governance-board',
        approvalLevel: 'STANDARD',
        conditions: ['Verify state after execution'],
        reason: 'Approved per policy',
      }),
    };

    expect(typeof gate.evaluate).toBe('function');
  });

  it('evaluates approval requests and returns verdicts', async () => {
    const gate: ApprovalGate = {
      evaluate: async (request: ApprovalRequest) => ({
        decision: request.requiredLevel === 'CRITICAL' ? 'DENIED' : 'APPROVED',
        approvedAt: request.requiredLevel === 'CRITICAL' ? null : '2026-01-01T00:00:00Z',
        approvedBy: request.requiredLevel === 'CRITICAL' ? null : 'governance-board',
        approvalLevel: request.requiredLevel,
        conditions: [],
        reason: request.requiredLevel === 'CRITICAL' ? 'Requires board review' : 'Auto-approved',
      }),
    };

    const standardRequest: ApprovalRequest = {
      approvalId: 'app-1',
      executionId: 'exe-1',
      connectorId: 'google-drive',
      operation: 'upload',
      riskLevel: 'MODIFY',
      requiredLevel: 'STANDARD',
      requestedAt: '2026-01-01T00:00:00Z',
      context: { queueId: 'q-1', decisionId: 'dec-1', planHash: 'plan-abc' },
    };

    const criticalRequest: ApprovalRequest = {
      ...standardRequest,
      approvalId: 'app-2',
      operation: 'delete',
      riskLevel: 'DESTRUCTIVE',
      requiredLevel: 'CRITICAL',
    };

    const standardVerdict = await gate.evaluate(standardRequest);
    const criticalVerdict = await gate.evaluate(criticalRequest);

    expect(standardVerdict.decision).toBe('APPROVED');
    expect(standardVerdict.approvedBy).toBe('governance-board');
    expect(criticalVerdict.decision).toBe('DENIED');
    expect(criticalVerdict.approvedBy).toBeNull();
  });

  it('distinguishes all approval decision states', () => {
    const decisions: ApprovalVerdict[] = [
      { decision: 'APPROVED', approvedAt: '2026-01-01T00:00:00Z', approvedBy: 'board', approvalLevel: 'STANDARD', conditions: [], reason: '' },
      { decision: 'DENIED', approvedAt: null, approvedBy: null, approvalLevel: 'CRITICAL', conditions: [], reason: 'Blocked' },
      { decision: 'PENDING', approvedAt: null, approvedBy: null, approvalLevel: 'HEIGHTENED', conditions: [], reason: 'Awaiting review' },
    ];

    expect(decisions[0].decision).toBe('APPROVED');
    expect(decisions[1].decision).toBe('DENIED');
    expect(decisions[2].decision).toBe('PENDING');
  });
});

describe('Stage 3B.1 — Rollback Contract', () => {
  it('defines the RollbackExecutor interface shape', () => {
    const executor: RollbackExecutor = {
      supportsRollback: true,
      rollbackStrategies: ['REVERSE_ORDER', 'COMPENSATING'],
      plan: async () => ({
        rollbackId: 'rb-1',
        executionId: 'exe-1',
        connectorId: 'google-drive',
        operation: 'upload',
        scope: 'FULL',
        strategy: 'REVERSE_ORDER',
        steps: [
          { stepIndex: 0, action: 'delete file', compensatingOperation: 'restore from trash', parameters: {}, reversible: false },
        ],
        plannedAt: '2026-01-01T00:00:00Z',
        planHash: 'rb-plan-abc',
      }),
    };

    expect(executor.supportsRollback).toBe(true);
    expect(executor.rollbackStrategies).toContain('REVERSE_ORDER');
    expect(typeof executor.plan).toBe('function');
  });

  it('creates rollback plans with step descriptors', async () => {
    const executor: RollbackExecutor = {
      supportsRollback: true,
      rollbackStrategies: ['REVERSE_ORDER'],
      plan: async () => ({
        rollbackId: 'rb-1',
        executionId: 'exe-1',
        connectorId: 'google-drive',
        operation: 'rename',
        scope: 'FULL',
        strategy: 'REVERSE_ORDER',
        steps: [
          { stepIndex: 0, action: 'restore original name', compensatingOperation: 'rename back', parameters: { originalName: 'old.txt' }, reversible: true },
        ],
        plannedAt: '2026-01-01T00:00:00Z',
        planHash: 'rb-plan-def',
      }),
    };

    const plan = await executor.plan({} as any, mockCandidate);
    expect(plan.scope).toBe('FULL');
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0].reversible).toBe(true);
  });

  it('reports rollback scope correctly', () => {
    const planFull: RollbackPlan = {
      rollbackId: 'rb-1', executionId: 'exe-1', connectorId: 'c', operation: 'op',
      scope: 'FULL', strategy: 'REVERSE_ORDER', steps: [], plannedAt: '', planHash: '',
    };
    const planNone: RollbackPlan = {
      rollbackId: 'rb-2', executionId: 'exe-2', connectorId: 'c', operation: 'op',
      scope: 'NONE', strategy: 'REVERSE_ORDER', steps: [], plannedAt: '', planHash: '',
    };

    expect(planFull.scope).toBe('FULL');
    expect(planNone.scope).toBe('NONE');
  });
});
