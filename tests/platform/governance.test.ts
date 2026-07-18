import { describe, it, expect } from 'vitest';
import { MutationPreview } from '../../lib/connectors/drive/mutation-preview';
import { GovernanceAdapter } from '../../lib/platform/governance/adapter';
import { PolicyEvaluator } from '../../lib/platform/governance/policy-evaluator';
import { ReviewPackageGenerator } from '../../lib/platform/governance/review-package-generator';

describe('Platform Governance Stage 2B - Extended Suite', () => {
  const ctx = { userId: 'user-1', token: 'tok-1' };
  
  const createMockPreview = (overrides: Partial<MutationPreview> = {}): MutationPreview => ({
    previewId: 'preview-drive-upload-new-req-1',
    connectorId: 'google-drive',
    operation: 'upload',
    resourceId: undefined,
    security: {
      classification: { 
        classification: 'organization',
        effectivePermissions: 'owner', 
        externalSharing: false,
        ownerType: 'personal',
        permissionRisk: 'low',
        publicExposure: false,
        inheritedPermissions: false,
        sensitivityScore: 20,
        governanceRisk: 'low',
      },
      mimeClassification: 'application/pdf',
      ownershipAnalysis: { currentOwner: 'owner@ex.com', proposedOwner: 'owner@ex.com' },
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
      requiredScopes: ['https://www.googleapis.com/auth/drive.file'],
      requiredApproval: 'Standard',
      riskFactors: [],
    },
    execution: {
      estimatedApiOperation: 'files.create',
      changeSummary: 'Proposed upload',
      previewOnly: true,
      executionAllowed: false,
      liveExecutionAuthorized: false,
    },
    proposedState: {
      id: 'proposed-new-req-1',
      name: 'Test.pdf',
      mimeType: 'application/pdf',
      createdAt: new Date('1970-01-01T00:00:00Z'),
      modifiedTime: new Date('1970-01-01T00:00:00Z'),
      size: 100,
      checksum: null,
      version: 1,
      owners: ['owner@ex.com'],
      permissions: [],
      parents: ['f1'],
      sharedDrive: false,
      inheritedPermissions: false,
      effectivePermissions: 'owner',
    } as any,
    ...overrides
  });

  describe('Approval Level & Risk transitions', () => {
    it('assigns NONE for internal low-risk resources', () => {
      const request = GovernanceAdapter.toReviewRequest(createMockPreview());
      const decision = PolicyEvaluator.evaluate(request);
      expect(decision.riskSummary.level).toBe('LOW');
      expect(decision.approvalLevel).toBe('NONE');
    });

    it('assigns EXECUTIVE for sensitive resources', () => {
      const preview = createMockPreview({
        security: { ...createMockPreview().security, sensitiveResourceImpact: 'High' }
      });
      const request = GovernanceAdapter.toReviewRequest(preview);
      const decision = PolicyEvaluator.evaluate(request);
      expect(decision.riskSummary.level).toBe('HIGH');
      expect(decision.approvalLevel).toBe('EXECUTIVE');
    });

    it('assigns BOARD for critical risks (public exposure)', () => {
      const preview = createMockPreview({
        governance: { ...createMockPreview().governance, riskFactors: ['Operation will create a public exposure of the la resource'] }
      });
      const request = GovernanceAdapter.toReviewRequest(preview);
      const decision = PolicyEvaluator.evaluate(request);
      expect(decision.riskSummary.level).toBe('CRITICAL');
      expect(decision.approvalLevel).toBe('BOARD');
    });

    it('assigns BOARD for critical risks (owner transfer)', () => {
      const preview = createMockPreview({
        security: { ...createMockPreview().security, ownershipAnalysis: { currentOwner: 'a@ex.com', proposedOwner: 'b@ex.com' } }
      });
      const request = GovernanceAdapter.toReviewRequest(preview);
      const decision = PolicyEvaluator.evaluate(request);
      expect(decision.riskSummary.level).toBe('CRITICAL');
      expect(decision.approvalLevel).toBe('BOARD');
    });
  });

  describe('Deterministic Ordering', () => {
    it('stably sorts policy results', () => {
      const request = GovernanceAdapter.toReviewRequest(createMockPreview());
      const d1 = PolicyEvaluator.evaluate(request);
      const d2 = PolicyEvaluator.evaluate(request);
      expect(d1.policyResults).toEqual(d2.policyResults);
    });

    it('stably sorts blocking reasons', () => {
      const preview = createMockPreview({
        security: { ...createMockPreview().security, ownershipAnalysis: { currentOwner: 'a@ex.com', proposedOwner: 'b@ex.com' } },
        governance: { ...createMockPreview().governance, riskFactors: ['Operation will create a public exposure of the la resource'] }
      });
      const request = GovernanceAdapter.toReviewRequest(preview);
      const d1 = PolicyEvaluator.evaluate(request);
      const d2 = PolicyEvaluator.evaluate(request);
      expect(d1.blockingReasons).toEqual(d2.blockingReasons);
    });
  });

  describe('Serialization Round-Trip', () => {
    it('preserves Decision and Package data across JSON cycle', async () => {
      const request = GovernanceAdapter.toReviewRequest(createMockPreview());
      const decision = PolicyEvaluator.evaluate(request);
      const pkg = ReviewPackageGenerator.generate(request, decision);
      
      const pkgJson = JSON.stringify(pkg);
      const pkgParsed = JSON.parse(pkgJson);
      
      const normalize = (obj: any) => {
        return JSON.parse(JSON.stringify(obj));
      };

      expect(normalize(pkgParsed)).toEqual(normalize(pkg));
      expect(pkgParsed.governanceVersion).toBe('1.0.0');
    });
  });

  describe('Connector Agnosticism', () => {
    it('handles a generic GitHub-style preview artifact', async () => {
      const githubPreview: any = {
        previewId: 'preview-gh-commit-req-1',
        connectorId: 'github',
        operation: 'create-issue',
        security: {
          classification: { classification: 'internal', effectivePermissions: 'writer' },
          mimeClassification: 'text/markdown',
          ownershipAnalysis: { currentOwner: 'bot@ex.com', proposedOwner: 'bot@ex.com' },
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
          requiredScopes: ['repo'],
          requiredApproval: 'Standard',
          riskFactors: [],
        },
        execution: {
          estimatedApiOperation: 'POST /repos/:owner/:repo/issues',
          changeSummary: 'Create new issue',
          previewOnly: true,
          executionAllowed: false,
          liveExecutionAuthorized: false,
        },
        proposedState: { name: 'Bug Report' }
      };
      
      const request = GovernanceAdapter.toReviewRequest(githubPreview);
      const decision = PolicyEvaluator.evaluate(request);
      
      // The adapter extracts the part after '-req-'
      // 'preview-gh-commit-req-1' -> '1'
      expect(decision.requestId).toBe('1');
      expect(decision.riskSummary.level).toBe('LOW');
    });
  });

  describe('Policy Edge Cases', () => {
    it('blocks missing scopes', () => {
      const preview = createMockPreview({
        governance: { ...createMockPreview().governance, requiredScopes: [] }
      });
      const request = GovernanceAdapter.toReviewRequest(preview);
      const decision = PolicyEvaluator.evaluate(request);
      expect(decision.blockingReasons).toContain('MISSING_SCOPES');
    });

    it('flags external domain interaction', () => {
      const preview = createMockPreview({
        security: { ...createMockPreview().security, externalSharingImpact: 'Moderate' }
      });
      const request = GovernanceAdapter.toReviewRequest(preview);
      const reqWithExt = { ...request, securityContext: { ...request.securityContext, externalSharing: true } };
      const decision = PolicyEvaluator.evaluate(reqWithExt);
      expect(decision.riskSummary.level).toBe('HIGH');
      expect(decision.policyResults.some(p => p.policyId === 'POLICY_EXTERNAL_DOMAIN')).toBe(true);
    });
  });
});
