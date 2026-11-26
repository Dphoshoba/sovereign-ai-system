import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderRegistryImpl } from '../../lib/platform/execution/provider-registry-impl';
import { ProviderSelectorImpl, ProviderSelectionError } from '../../lib/platform/execution/provider-selector-impl';
import { ExecutionRequest } from '../../lib/platform/execution/execution-request';
import { QueueCandidate } from '../../lib/platform/queue/types';
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
  queueId: 'q-1', connectorId: 'google-drive', operation: 'upload',
  previewId: 'p-1', decisionId: 'dec-1', reviewPackageId: 'pkg-1',
  governanceVersion: '1.0.0', policyVersion: '1.0.0',
  executionManifest: {
    intendedOperation: 'upload', requiredScopes: ['scope1'],
    requiredApprovals: ['STANDARD'], governanceDecisionId: 'dec-1',
    blockingConditions: [], validationSummary: 'Test',
    resourceSummary: { sourceId: null, targetId: 't-1', resourceType: 'file' },
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

describe('ProviderSelectorImpl', () => {
  let registry: ProviderRegistryImpl;
  let selector: ProviderSelectorImpl;

  beforeEach(() => {
    registry = ProviderRegistryImpl.createWithDefaultProviders();
    selector = new ProviderSelectorImpl(registry);
  });

  describe('select', () => {
    it('selects Google Calendar for events.list', () => {
      const ctx = selector.select('events.list');
      expect(ctx.provider.identity.id).toBe('google-calendar');
      expect(ctx.operation).toBe('events.list');
      expect(ctx.resolution.matchScore).toBeGreaterThan(0);
    });

    it('selects Google Calendar for all five operations', () => {
      for (const op of ['events.list', 'events.get', 'events.insert', 'events.update', 'events.delete']) {
        const ctx = selector.select(op);
        expect(ctx.provider.identity.id).toBe('google-calendar');
      }
    });

    it('throws when no provider supports the operation', () => {
      expect(() => selector.select('unknown.op')).toThrow(ProviderSelectionError);
      expect(() => selector.select('unknown.op')).toThrow(
        "No eligible provider found for operation 'unknown.op'",
      );
    });

    it('applies discovery options', () => {
      expect(() => selector.select('events.list', { minCertification: 'PRODUCTION' })).toThrow(ProviderSelectionError);
    });
  });

  describe('selectForRequest', () => {
    it('selects a provider based on execution request operation', () => {
      const request: ExecutionRequest = {
        executionId: 'exe-1', queueId: 'q-1', connectorId: 'google-calendar',
        operation: 'events.insert', candidate: mockCandidate, decision: mockDecision,
        capabilities,
        idempotencyToken: 'token-1', planHash: 'hash',
        requestedAt: '2026-07-19T00:00:00.000Z',
      };
      const ctx = selector.selectForRequest(request);
      expect(ctx.provider.identity.id).toBe('google-calendar');
      expect(ctx.operation).toBe('events.insert');
    });
  });

  describe('canResolve', () => {
    it('returns true for supported operations', () => {
      expect(selector.canResolve('events.list')).toBe(true);
    });

    it('returns false for unsupported operations', () => {
      expect(selector.canResolve('unknown.op')).toBe(false);
    });

    it('respects discovery options', () => {
      expect(selector.canResolve('events.list', { minCertification: 'PRODUCTION' })).toBe(false);
    });
  });

  describe('resolution context', () => {
    it('includes explanation with score breakdown', () => {
      const ctx = selector.select('events.list');
      expect(ctx.resolution.explanation.rule).toBe('highest_match_score');
      expect(ctx.resolution.explanation.breakdown.lifecycle).toBeGreaterThan(0);
      expect(ctx.resolution.explanation.totalCandidates).toBeGreaterThan(0);
    });

    it('includes provider metadata', () => {
      const ctx = selector.select('events.list');
      expect(ctx.provider.certification.governanceDecision).toBe('GOV-2026-PhaseIII-001');
      expect(ctx.provider.certification.level).toBe('STAGE_3C');
      expect(ctx.provider.policy.sandboxSupported).toBe(true);
    });
  });
});
