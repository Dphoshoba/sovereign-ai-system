export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface GovernanceReviewRequest {
  requestId: string;
  connectorId: string;
  operation: string;
  resourceId?: string;
  proposedChanges: any;
  securityContext: {
    classification: string;
    mimeType: string;
    ownership: {
      current: string | null;
      proposed: string | null;
    };
    permissionDelta: any[];
    publicExposure: boolean;
    externalSharing: boolean;
    sensitiveResource: boolean;
  };
  governanceContext: {
    duplicatesDetected: boolean;
    versionImpact: any;
    requiredScopes: string[];
  };
  metadata: {
    generatedAt: string; // ISO String
    version: string;
  };
}

export interface GovernanceDecision {
  decisionId: string;
  requestId: string;
  governanceVersion: string;
  policyVersion: string;
  approvalRequired: boolean;
  approvalLevel: 'NONE' | 'STANDARD' | 'EXECUTIVE' | 'BOARD';
  blockingReasons: string[];
  warnings: string[];
  riskSummary: {
    level: RiskLevel;
    factors: string[];
  };
  policyResults: Array<{
    policyId: string;
    result: 'PASS' | 'FAIL' | 'WARN';
    message: string;
  }>;
  executionEligible: false; 
  queueEligible: boolean;
  reviewerInstructions: string;
}
