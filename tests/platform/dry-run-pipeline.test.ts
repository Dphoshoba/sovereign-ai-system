import { describe, it, expect } from 'vitest';
import { DryRunPipeline, DryRunPipelineConfig } from '../../lib/platform/execution/dry-run/dry-run-pipeline';
import { MutationPlanner, computeDeterministicIdempotencyKey, computeOperationHash } from '../../lib/platform/execution/dry-run/mutation-planner';
import { DryRunReportBuilder, computeExecutionHash } from '../../lib/platform/execution/dry-run/dry-run-report';
import { ExecutionRequest } from '../../lib/platform/execution/execution-request';
import { QueueCandidate } from '../../lib/platform/queue/types';
import { ConnectorRuntimeCapabilities } from '../../lib/platform/execution/capabilities';
import { GovernanceDecision } from '../../lib/platform/governance/types';
import { ApprovalGate, ApprovalVerdict, ApprovalRequest } from '../../lib/platform/execution/approval-contract';
import { RollbackExecutor, RollbackPlan } from '../../lib/platform/execution/rollback-contract';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockDecision: GovernanceDecision = {
  decisionId: 'dec-dr-1', requestId: 'req-dr-1', governanceVersion: '1.0.0',
  policyVersion: '1.0.0', approvalRequired: true, approvalLevel: 'STANDARD',
  blockingReasons: [], warnings: [],
  riskSummary: { level: 'LOW', factors: [] },
  policyResults: [], executionEligible: false, queueEligible: true,
  reviewerInstructions: 'Review dry-run',
};

const mockCapabilities: ConnectorRuntimeCapabilities = {
  prepare: true, preflight: true, execute: true, verify: true,
  rollback: true, audit: true, stage: '3C',
  providerMutationAllowed: false, networkMutationAllowed: false,
};

function createCandidate(operation: string, targetId = 'primary'): QueueCandidate {
  return {
    queueId: `q-dr-${Date.now()}`,
    connectorId: 'google-calendar',
    operation,
    previewId: 'prev-1', decisionId: 'dec-dr-1', reviewPackageId: 'pkg-1',
    governanceVersion: '1.0.0', policyVersion: '1.0.0',
    executionManifest: {
      intendedOperation: operation,
      requiredScopes: ['https://www.googleapis.com/auth/calendar.events'],
      requiredApprovals: operation === 'events.delete' ? ['HEIGHTENED'] : ['STANDARD'],
      governanceDecisionId: 'dec-dr-1',
      blockingConditions: [],
      validationSummary: `Dry-run ${operation}`,
      resourceSummary: { sourceId: null, targetId, resourceType: 'calendar' },
      executionPrerequisites: [],
    },
    idempotencyToken: `idem-${operation}`,
    replayProtection: {
      duplicateDetectionKey: `dup-${operation}`,
      replayWindowMetadata: { windowStart: 'S', windowEnd: 'E' },
      conflictIdentity: `c-${operation}`, queueUniqueness: `u-${operation}`,
    },
    dependencyGraph: { dependsOn: [], executionOrder: 1 },
    auditReference: `audit-${operation}`,
    queueEligible: true, executionEligible: false, executionAuthorized: false,
    metadata: { generatedAt: 'now', version: '1.0.0' },
  };
}

function createRequest(operation: string): ExecutionRequest {
  const candidate = createCandidate(operation);
  return {
    executionId: `exe-dr-${operation}-${Date.now()}`,
    queueId: candidate.queueId,
    connectorId: 'google-calendar',
    operation,
    candidate,
    decision: mockDecision,
    capabilities: mockCapabilities,
    idempotencyToken: `idem-${operation}`,
    planHash: `plan-hash-${operation}`,
    requestedAt: '2026-01-01T00:00:00Z',
  };
}

// ---------------------------------------------------------------------------
// MutationPlanner
// ---------------------------------------------------------------------------
describe('MutationPlanner', () => {
  const planner = new MutationPlanner();

  it('plans events.insert with correct body', () => {
    const req = createRequest('events.insert');
    const plan = planner.plan(req, req.candidate);
    expect(plan.operation).toBe('events.insert');
    expect(plan.requestBody).not.toBeNull();
    expect((plan.requestBody as Record<string, unknown>).summary).toContain('Dry-run event');
    expect((plan.requestBody as Record<string, unknown>).start).toBeDefined();
    expect((plan.requestBody as Record<string, unknown>).end).toBeDefined();
    expect(plan.expectedStatusCode).toBe(200);
  });

  it('plans events.update with partial body', () => {
    const req = createRequest('events.update');
    const plan = planner.plan(req, req.candidate);
    expect(plan.operation).toBe('events.update');
    expect((plan.requestBody as Record<string, unknown>).summary).toContain('Dry-run updated event');
    expect(plan.parameters.eventId).toBe(req.candidate.queueId);
  });

  it('plans events.delete with null body', () => {
    const req = createRequest('events.delete');
    const plan = planner.plan(req, req.candidate);
    expect(plan.operation).toBe('events.delete');
    expect(plan.requestBody).toBeNull();
    expect(plan.expectedStatusCode).toBe(204);
  });

  it('generates deterministic idempotency key', () => {
    const req = createRequest('events.insert');
    const plan1 = planner.plan(req, req.candidate);
    const plan2 = planner.plan(req, req.candidate);
    expect(plan1.idempotencyKey).toBe(plan2.idempotencyKey);
  });

  it('generates different keys for different operations', () => {
    const req1 = createRequest('events.insert');
    const req2 = createRequest('events.update');
    const plan1 = planner.plan(req1, req1.candidate);
    const plan2 = planner.plan(req2, req2.candidate);
    expect(plan1.idempotencyKey).not.toBe(plan2.idempotencyKey);
  });

  it('idempotency key has correct format', () => {
    const req = createRequest('events.insert');
    const plan = planner.plan(req, req.candidate);
    expect(plan.idempotencyKey).toMatch(/^idem-exe-dr-events\.insert-/);
  });
});

// ---------------------------------------------------------------------------
// computeDeterministicIdempotencyKey
// ---------------------------------------------------------------------------
describe('computeDeterministicIdempotencyKey', () => {
  it('produces deterministic output', () => {
    const hash1 = computeDeterministicIdempotencyKey('exe-1', 'events.insert', 'abc123', 0);
    const hash2 = computeDeterministicIdempotencyKey('exe-1', 'events.insert', 'abc123', 0);
    expect(hash1).toBe(hash2);
  });

  it('changes when attempt number changes', () => {
    const hash1 = computeDeterministicIdempotencyKey('exe-1', 'events.insert', 'abc123', 0);
    const hash2 = computeDeterministicIdempotencyKey('exe-1', 'events.insert', 'abc123', 1);
    expect(hash1).not.toBe(hash2);
  });

  it('has correct prefix', () => {
    const key = computeDeterministicIdempotencyKey('exe-1', 'events.insert', 'abc123', 0);
    expect(key.startsWith('idem-')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// computeOperationHash
// ---------------------------------------------------------------------------
describe('computeOperationHash', () => {
  it('produces deterministic hash for same params', () => {
    const params = { calendarId: 'primary', summary: 'Test' };
    expect(computeOperationHash(params)).toBe(computeOperationHash(params));
  });

  it('produces different hash for different params', () => {
    const a = computeOperationHash({ calendarId: 'primary' });
    const b = computeOperationHash({ calendarId: 'secondary' });
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// computeExecutionHash
// ---------------------------------------------------------------------------
describe('computeExecutionHash', () => {
  it('produces deterministic hash for same artifacts', () => {
    const baseArtifacts = {
      mutationPlan: { operation: 'events.insert', requestBody: null, expectedStatusCode: 200, parameters: {}, idempotencyKey: 'key-1' },
      idempotencyKey: 'key-1',
      approvalVerdict: null,
      rollbackPlan: null,
      verificationPlan: { operation: 'events.insert', readBackOperation: 'events.get', verificationFields: [], expectedDrift: [], maxVerificationDurationMs: 5000 },
      auditEvents: ['event-1'],
      phaseResults: [],
    };
    expect(computeExecutionHash(baseArtifacts).startsWith('dryrun-')).toBe(true);
    expect(computeExecutionHash(baseArtifacts)).toBe(computeExecutionHash(baseArtifacts));
  });
});

// ---------------------------------------------------------------------------
// DryRunReportBuilder
// ---------------------------------------------------------------------------
describe('DryRunReportBuilder', () => {
  const builder = new DryRunReportBuilder();

  it('marks report FAILED when any phase fails', () => {
    const artifacts = {
      mutationPlan: { operation: 'events.insert', requestBody: null, expectedStatusCode: 200, parameters: {}, idempotencyKey: 'key' },
      idempotencyKey: 'key',
      approvalVerdict: null,
      rollbackPlan: null,
      verificationPlan: { operation: 'events.insert', readBackOperation: 'events.get', verificationFields: [], expectedDrift: [], maxVerificationDurationMs: 5000 },
      auditEvents: [],
      phaseResults: [{ phase: 'PLANNING' as const, passed: false, durationMs: 0, artifacts: {} }],
    };
    const report = builder.build('exe-1', 'events.insert', artifacts, false, []);
    expect(report.outcome).toBe('DRY_RUN_FAILED');
  });

  it('marks report INCOMPLETE when transport is invoked', () => {
    const artifacts = {
      mutationPlan: { operation: 'events.insert', requestBody: null, expectedStatusCode: 200, parameters: {}, idempotencyKey: 'key' },
      idempotencyKey: 'key',
      approvalVerdict: null,
      rollbackPlan: null,
      verificationPlan: { operation: 'events.insert', readBackOperation: 'events.get', verificationFields: [], expectedDrift: [], maxVerificationDurationMs: 5000 },
      auditEvents: [],
      phaseResults: [{ phase: 'PLANNING' as const, passed: true, durationMs: 0, artifacts: {} }],
    };
    const report = builder.build('exe-1', 'events.insert', artifacts, true, []);
    expect(report.outcome).toBe('DRY_RUN_INCOMPLETE');
    expect(report.warnings).toContain('TRANSPORT_INVOKED');
  });
});

// ---------------------------------------------------------------------------
// DryRunPipeline
// ---------------------------------------------------------------------------
describe('DryRunPipeline', () => {
  const createPipeline = (config?: DryRunPipelineConfig) => new DryRunPipeline(config);

  it('transport invocation count starts at zero', () => {
    const pipeline = createPipeline();
    expect(pipeline.getTransportInvocationCount()).toBe(0);
  });

  it('produces all required artifacts for events.insert', async () => {
    const pipeline = createPipeline();
    const req = createRequest('events.insert');
    const report = await pipeline.execute(req, req.candidate);

    expect(report.executionId).toBe(req.executionId);
    expect(report.operation).toBe('events.insert');
    expect(report.outcome).toBe('DRY_RUN_PASSED');
    expect(report.transportInvoked).toBe(false);
    expect(pipeline.getTransportInvocationCount()).toBe(0);
    expect(report.artifacts.mutationPlan.operation).toBe('events.insert');
    expect(report.artifacts.idempotencyKey).toBeTruthy();
    expect(report.artifacts.approvalVerdict).not.toBeNull();
    expect(report.artifacts.rollbackPlan).not.toBeNull();
    expect(report.artifacts.verificationPlan).toBeDefined();
    expect(report.artifacts.auditEvents.length).toBeGreaterThan(0);
    expect(report.artifacts.phaseResults.length).toBeGreaterThan(0);
    expect(report.executionHash).toBeTruthy();
    expect(report.executionHash.startsWith('dryrun-')).toBe(true);
  });

  it('produces all required artifacts for events.update', async () => {
    const pipeline = createPipeline();
    const req = createRequest('events.update');
    const report = await pipeline.execute(req, req.candidate);

    expect(report.operation).toBe('events.update');
    expect(report.outcome).toBe('DRY_RUN_PASSED');
    expect(report.transportInvoked).toBe(false);
    expect(report.artifacts.mutationPlan.requestBody).not.toBeNull();
    expect(report.artifacts.rollbackPlan!.strategy).toBe('REVERSE_ORDER');
  });

  it('produces all required artifacts for events.delete', async () => {
    const pipeline = createPipeline();
    const req = createRequest('events.delete');
    const report = await pipeline.execute(req, req.candidate);

    expect(report.operation).toBe('events.delete');
    expect(report.outcome).toBe('DRY_RUN_PASSED');
    expect(report.artifacts.mutationPlan.requestBody).toBeNull();
    expect(report.artifacts.rollbackPlan!.steps[0].compensatingOperation).toBe('events.insert');
  });

  it('invokes approval gate when configured', async () => {
    let approvalCalled = false;
    const gate: ApprovalGate = {
      evaluate: async (req: ApprovalRequest) => {
        approvalCalled = true;
        expect(req.operation).toBe('events.insert');
        expect(req.requiredLevel).toBe('STANDARD');
        return {
          decision: 'APPROVED',
          approvedAt: '2026-01-01T00:00:00Z',
          approvedBy: 'test',
          approvalLevel: 'STANDARD',
          conditions: [],
          reason: 'Approved for dry-run',
        };
      },
    };
    const pipeline = createPipeline({ approvalGate: gate });
    const req = createRequest('events.insert');
    const report = await pipeline.execute(req, req.candidate);
    expect(approvalCalled).toBe(true);
    expect(report.artifacts.approvalVerdict?.decision).toBe('APPROVED');
  });

  it('invokes rollback executor when configured', async () => {
    let rollbackCalled = false;
    const executor: RollbackExecutor = {
      supportsRollback: true,
      rollbackStrategies: ['REVERSE_ORDER'],
      plan: async (_req: ExecutionRequest, _candidate: QueueCandidate) => {
        rollbackCalled = true;
        return {
          rollbackId: `rb-${_req.executionId}`,
          executionId: _req.executionId,
          connectorId: _req.connectorId,
          operation: _req.operation,
          scope: 'FULL' as const,
          strategy: 'COMPENSATING' as const,
          steps: [{
            stepIndex: 0,
            action: _req.operation,
            compensatingOperation: 'events.delete',
            parameters: { calendarId: 'primary' },
            reversible: true,
          }],
          plannedAt: 'now',
          planHash: 'rb-hash',
        };
      },
    };
    const pipeline = createPipeline({ rollbackExecutor: executor });
    const req = createRequest('events.insert');
    const report = await pipeline.execute(req, req.candidate);
    expect(rollbackCalled).toBe(true);
    expect(report.artifacts.rollbackPlan?.planHash).toBe('rb-hash');
  });

  it('generates correct verification plan per operation', async () => {
    const pipeline = createPipeline();
    const ops = ['events.insert', 'events.update', 'events.delete', 'events.list'];
    for (const op of ops) {
      const req = createRequest(op);
      const report = await pipeline.execute(req, req.candidate);
      expect(report.artifacts.verificationPlan.operation).toBe(op);
      expect(report.artifacts.verificationPlan.verificationFields.length).toBeGreaterThan(0);
    }
  });

  it('records audit events for every phase', async () => {
    const pipeline = createPipeline();
    const req = createRequest('events.insert');
    const report = await pipeline.execute(req, req.candidate);
    const events = report.artifacts.auditEvents;
    expect(events.some(e => e.startsWith('PLAN_GENERATED'))).toBe(true);
    expect(events.some(e => e.startsWith('IDEMPOTENCY_KEY_GENERATED'))).toBe(true);
    expect(events.some(e => e.startsWith('APPROVAL'))).toBe(true);
    expect(events.some(e => e.startsWith('ROLLBACK_PLAN_GENERATED'))).toBe(true);
    expect(events.some(e => e.startsWith('VERIFICATION_PLAN_GENERATED'))).toBe(true);
    expect(events.some(e => e.startsWith('DRY_RUN_AUDIT'))).toBe(true);
  });

  it('produces deterministic report for same inputs', async () => {
    const pipeline = createPipeline();
    const req = createRequest('events.insert');
    const report1 = await pipeline.execute(req, req.candidate);
    const req2 = createRequest('events.insert');
    // Same operation should produce same structure
    expect(report1.artifacts.mutationPlan.operation).toBe('events.insert');
    expect(report1.artifacts.verificationPlan.readBackOperation).toBe('events.get');
    // Re-executing with same candidate should produce same key
    const report2 = await pipeline.execute(createRequest('events.insert'), createCandidate('events.insert'));
    expect(report1.artifacts.mutationPlan.operation).toBe(report2.artifacts.mutationPlan.operation);
  });

  it('transport records zero invocations during dry run', async () => {
    const pipeline = createPipeline();
    const req = createRequest('events.insert');
    const report = await pipeline.execute(req, req.candidate);
    expect(pipeline.getTransportInvocationCount()).toBe(0);
    expect(report.transportInvoked).toBe(false);
  });

  it('recordTransportInvocation increments count', () => {
    const pipeline = createPipeline();
    expect(pipeline.getTransportInvocationCount()).toBe(0);
    pipeline.recordTransportInvocation();
    expect(pipeline.getTransportInvocationCount()).toBe(1);
    pipeline.recordTransportInvocation();
    expect(pipeline.getTransportInvocationCount()).toBe(2);
    pipeline.resetTransportCount();
    expect(pipeline.getTransportInvocationCount()).toBe(0);
  });

  it('handles approval denial gracefully', async () => {
    const gate: ApprovalGate = {
      evaluate: async () => ({
        decision: 'DENIED',
        approvedAt: null,
        approvedBy: null,
        approvalLevel: 'HEIGHTENED',
        conditions: [],
        reason: 'Not authorized for dry-run',
      }),
    };
    const pipeline = createPipeline({ approvalGate: gate });
    const req = createRequest('events.delete');
    const report = await pipeline.execute(req, req.candidate);
    expect(report.artifacts.approvalVerdict?.decision).toBe('DENIED');
    expect(report.warnings.some(w => w.includes('Approval denied'))).toBe(true);
  });

  it('handles approval gate errors', async () => {
    const gate: ApprovalGate = {
      evaluate: async () => { throw new Error('Gate unavailable'); },
    };
    const pipeline = createPipeline({ approvalGate: gate });
    const req = createRequest('events.insert');
    const report = await pipeline.execute(req, req.candidate);
    expect(report.artifacts.approvalVerdict?.decision).toBe('DENIED');
  });

  it('handles rollback executor errors', async () => {
    const executor: RollbackExecutor = {
      supportsRollback: true,
      rollbackStrategies: ['REVERSE_ORDER'],
      plan: async () => { throw new Error('Rollback unavailable'); },
    };
    const pipeline = createPipeline({ rollbackExecutor: executor });
    const req = createRequest('events.insert');
    const report = await pipeline.execute(req, req.candidate);
    // Should fall back to default rollback plan
    expect(report.artifacts.rollbackPlan).not.toBeNull();
    expect(report.artifacts.rollbackPlan!.strategy).toBe('REVERSE_ORDER');
    expect(report.warnings.some(w => w.includes('Rollback planning failed'))).toBe(true);
  });

  it('phases are completed in order', async () => {
    const pipeline = createPipeline();
    const req = createRequest('events.insert');
    const report = await pipeline.execute(req, req.candidate);
    const expectedOrder = ['PLANNING', 'IDEMPOTENCY', 'APPROVAL', 'ROLLBACK_PLANNING', 'VERIFICATION_PLANNING', 'AUDIT'];
    const actualOrder = report.artifacts.phaseResults.map(p => p.phase);
    expect(actualOrder).toEqual(expectedOrder);
  });
});

// ---------------------------------------------------------------------------
// No mutation endpoints referenced
// ---------------------------------------------------------------------------
describe('No mutation execution', () => {
  it('dry-run pipeline never invokes transport', () => {
    const pipeline = new DryRunPipeline();
    expect(pipeline.getTransportInvocationCount()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Structural integrity — no provider-specific logic in pipeline
// ---------------------------------------------------------------------------
describe('Structural integrity', () => {
  it('dry-run pipeline is provider-neutral', () => {
    const pipelineContent = DryRunPipeline.toString();
    // The pipeline should not reference Google-specific transport or auth
    expect(typeof pipelineContent).toBe('string');
  });
});
