import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SandboxExecutionPipeline } from '../../lib/platform/execution/adapters/sandbox/sandbox-execution-pipeline';
import { ProviderRegistryImpl } from '../../lib/platform/execution/provider-registry-impl';
import { ProviderSelectorImpl } from '../../lib/platform/execution/provider-selector-impl';
import { ExecutionRequest } from '../../lib/platform/execution/execution-request';
import { GovernanceDecision } from '../../lib/platform/governance/types';
import { QueueCandidate } from '../../lib/platform/queue/types';
import { ConnectorRuntimeCapabilities } from '../../lib/platform/execution/capabilities';

const mockDecision: GovernanceDecision = {
  decisionId: 'dec-1', requestId: 'req-1', governanceVersion: '1.0.0',
  policyVersion: '1.0.0', approvalRequired: true, approvalLevel: 'STANDARD',
  blockingReasons: [], warnings: [], riskSummary: { level: 'LOW', factors: [] },
  policyResults: [], executionEligible: false, queueEligible: true,
  reviewerInstructions: 'Review',
};

const mockCandidate: QueueCandidate = {
  queueId: 'q-1', connectorId: 'google-calendar', operation: 'events.list',
  previewId: 'p-1', decisionId: 'dec-1', reviewPackageId: 'pkg-1',
  governanceVersion: '1.0.0', policyVersion: '1.0.0',
  executionManifest: {
    intendedOperation: 'events.list', requiredScopes: ['scope1'],
    requiredApprovals: ['STANDARD'], governanceDecisionId: 'dec-1',
    blockingConditions: [], validationSummary: 'Test',
    resourceSummary: { sourceId: null, targetId: 'cal-1', resourceType: 'calendar' },
    executionPrerequisites: [],
  },
  idempotencyToken: 'token-1',
  replayProtection: { duplicateDetectionKey: 'dup-1', replayWindowMetadata: { windowStart: 'S', windowEnd: 'E' }, conflictIdentity: 'c-1', queueUniqueness: 'u-1' },
  dependencyGraph: { dependsOn: [], executionOrder: 1 },
  auditReference: 'audit-1', queueEligible: true, executionEligible: false,
  executionAuthorized: false,
  metadata: { generatedAt: 'now', version: '1.0.0' },
};

const capabilities: ConnectorRuntimeCapabilities = {
  prepare: true, preflight: true, execute: true, verify: true,
  rollback: true, audit: true, stage: '3C',
  providerMutationAllowed: false, networkMutationAllowed: false,
};

function makeRequest(operation: string): ExecutionRequest {
  return {
    executionId: 'exe-1', queueId: 'q-1', connectorId: 'google-calendar',
    operation, candidate: mockCandidate, decision: mockDecision,
    capabilities,
    idempotencyToken: 'token-1', planHash: 'hash',
    requestedAt: '2026-07-19T00:00:00.000Z',
  };
}

describe('Provider Selection — Pipeline Integration', () => {
  let registry: ProviderRegistryImpl;
  let selector: ProviderSelectorImpl;
  let adapter: any;

  beforeEach(() => {
    registry = ProviderRegistryImpl.createWithDefaultProviders();
    selector = new ProviderSelectorImpl(registry);
    adapter = {
      execute: vi.fn().mockResolvedValue({
        mutationId: 'mut-1',
        providerState: {},
        etag: 'etag-1',
        mutatedAt: '2026-07-19T00:00:00.000Z',
      }),
      verify: vi.fn().mockResolvedValue({ verified: true, readBackState: {} }),
      rollback: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('records PROVIDER_SELECTION phase when selector is configured', async () => {
    const pipeline = new SandboxExecutionPipeline({ adapter, providerSelector: selector });
    const report = await pipeline.execute(makeRequest('events.list'), mockCandidate);
    const selectionPhase = report.phases.find((p) => p.phase === 'PROVIDER_SELECTION');
    expect(selectionPhase).toBeDefined();
    expect(selectionPhase!.passed).toBe(true);
    expect(selectionPhase!.details).toHaveProperty('providerId');
  });

  it('includes provider identity in selection phase details', async () => {
    const pipeline = new SandboxExecutionPipeline({ adapter, providerSelector: selector });
    const report = await pipeline.execute(makeRequest('events.list'), mockCandidate);
    const selectionPhase = report.phases.find((p) => p.phase === 'PROVIDER_SELECTION')!;
    expect(selectionPhase.details).toMatchObject({
      providerId: 'google-calendar',
    });
  });

  it('aborts when no provider can resolve the operation', async () => {
    const pipeline = new SandboxExecutionPipeline({ adapter, providerSelector: selector });
    const report = await pipeline.execute(makeRequest('unknown.op'), mockCandidate);
    expect(report.outcome).toBe('SANDBOX_ABORTED');
    const selectionPhase = report.phases.find((p) => p.phase === 'PROVIDER_SELECTION');
    expect(selectionPhase).toBeDefined();
    expect(selectionPhase!.passed).toBe(false);
    expect(selectionPhase!.details).toHaveProperty('error');
  });

  it('places PROVIDER_SELECTION as the first phase', async () => {
    const pipeline = new SandboxExecutionPipeline({ adapter, providerSelector: selector });
    const report = await pipeline.execute(makeRequest('events.list'), mockCandidate);
    const phases = report.phases.map((p) => p.phase);
    expect(phases[0]).toBe('PROVIDER_SELECTION');
  });

  it('skips selection phase when selector is not configured (backward compatible)', async () => {
    const pipeline = new SandboxExecutionPipeline({ adapter });
    const report = await pipeline.execute(makeRequest('events.list'), mockCandidate);
    const phases = report.phases.map((p) => p.phase);
    expect(phases).not.toContain('PROVIDER_SELECTION');
  });

  it('selection phase passes when provider is resolved', async () => {
    const pipeline = new SandboxExecutionPipeline({ adapter, providerSelector: selector });
    const report = await pipeline.execute(makeRequest('events.get'), mockCandidate);
    const selectionPhase = report.phases.find((p) => p.phase === 'PROVIDER_SELECTION')!;
    expect(selectionPhase).toBeDefined();
    expect(selectionPhase.passed).toBe(true);
  });

  it('adds PROVIDER_SELECTED audit event on successful selection', async () => {
    const pipeline = new SandboxExecutionPipeline({ adapter, providerSelector: selector });
    const report = await pipeline.execute(makeRequest('events.list'), mockCandidate);
    expect(report.auditEvents.some((e) => e.startsWith('PROVIDER_SELECTED:'))).toBe(true);
  });
});
