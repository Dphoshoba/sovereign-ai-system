import { describe, it, expect } from 'vitest';
import { MutationPreview } from '../../lib/connectors/drive/mutation-preview';
import { GovernanceDecision } from '../../lib/platform/governance/types';
import { DriveQueueBridge } from '../../lib/connectors/drive/queue-bridge';
import { QueueValidator } from '../../lib/platform/queue/queue-validator';
import { QueueTokenService } from '../../lib/platform/queue/token-service';

describe('Platform Queue Stage 2C - Deterministic Prep', () => {
  const mockPreview: MutationPreview = {
    previewId: 'preview-1',
    connectorId: 'google-drive',
    operation: 'upload',
    resourceId: 'res-1',
    security: {
      classification: { classification: 'internal' as any, effectivePermissions: 'owner', externalSharing: false, ownerType: 'user' as any, permissionRisk: 'low' as any, publicExposure: false, inheritedPermissions: false },
      mimeClassification: 'application/pdf',
      ownershipAnalysis: { currentOwner: 'a@ex.com', proposedOwner: 'a@ex.com' },
      currentPermissions: [],
      proposedPermissionDelta: [],
      externalSharingImpact: 'None',
      publicExposureImpact: 'None',
      sensitiveResourceImpact: 'Low',
    },
    governance: {
      duplicateConflictFindings: [],
      versionImpact: { isStale: false },
      validationErrors: [],
      blockingReasons: [],
      warnings: [],
      requiredScopes: ['scope1'],
      requiredApproval: 'Standard',
      riskFactors: [],
    },
    execution: {
      estimatedApiOperation: 'files.create',
      changeSummary: 'Test upload',
      previewOnly: true,
      executionAllowed: false,
      liveExecutionAuthorized: false,
    },
    proposedState: { id: 'prop-1', name: 'Test.pdf' } as any,
  };

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
    reviewerInstructions: 'Review please',
  };

  it('generates a valid QueueCandidate via DriveQueueBridge', () => {
    const candidate = DriveQueueBridge.generateCandidate(mockPreview, mockDecision);
    const validation = QueueValidator.validate(candidate);
    expect(validation.valid).toBe(true);
    expect(candidate.executionEligible).toBe(false);
    expect(candidate.executionAuthorized).toBe(false);
  });

  it('produces deterministic idempotency tokens', () => {
    const token1 = QueueTokenService.generateIdempotencyToken('drive', 'upload', 'res-1', 'dec-1');
    const token2 = QueueTokenService.generateIdempotencyToken('drive', 'upload', 'res-1', 'dec-1');
    expect(token1).toBe(token2);
    expect(token1).toMatch(/^idemp-[0-9a-f]{8}$/);
  });

  it('produces deterministic replay protection', () => {
    const rp1 = QueueTokenService.generateReplayProtection('drive', 'preview-1');
    const rp2 = QueueTokenService.generateReplayProtection('drive', 'preview-1');
    expect(rp1).toEqual(rp2);
  });

  it('generates a valid execution manifest', () => {
    const candidate = DriveQueueBridge.generateCandidate(mockPreview, mockDecision);
    expect(candidate.executionManifest.intendedOperation).toBe('upload');
    expect(candidate.executionManifest.governanceDecisionId).toBe('dec-1');
    expect(candidate.executionManifest.requiredScopes).toContain('scope1');
  });

  it('detects S2C execution violations', () => {
    const candidate = DriveQueueBridge.generateCandidate(mockPreview, mockDecision);
    const invalidCandidate = { ...candidate, executionEligible: true };
    const validation = QueueValidator.validate(invalidCandidate);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('S2C_EXECUTION_PROHIBITED');
  });

  it('preserves data across JSON round-trip (serialization)', () => {
    const candidate = DriveQueueBridge.generateCandidate(mockPreview, mockDecision);
    const json = JSON.stringify(candidate);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual(candidate);
  });

  it('handles connector-neutral logic via platform components', () => {
    // Manually construct a a non-drive candidate
    const candidate: any = {
      queueId: 'q-gh-1',
      connectorId: 'github',
      operation: 'commit',
      previewId: 'p-1',
      decisionId: 'd-1',
      reviewPackageId: 'pkg-1',
      governanceVersion: '1.0.0',
      policyVersion: '1.0.0',
      executionManifest: {
        intendedOperation: 'commit',
        requiredScopes: ['repo'],
        requiredApprovals: ['STANDARD'],
        governanceDecisionId: 'd-1',
        blockingConditions: [],
        validationSummary: 'Test',
        resourceSummary: { sourceId: null, targetId: 'sha-1', resourceType: 'commit' },
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
    const validation = QueueValidator.validate(candidate);
    expect(validation.valid).toBe(true);
  });
});
