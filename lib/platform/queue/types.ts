export type OperationId = string;
export type QueueId = string;
export type IdempotencyToken = string;
export type AuditReference = string;

export interface ExecutionManifest {
  intendedOperation: string;
  requiredScopes: string[];
  requiredApprovals: string[];
  governanceDecisionId: string;
  blockingConditions: string[];
  validationSummary: string;
  resourceSummary: {
    sourceId: string | null;
    targetId: string | null;
    resourceType: string;
  };
  executionPrerequisites: string[];
}

export interface DependencyGraph {
  dependsOn: string[]; // IDs of operations that must complete first
  executionOrder: number;
}

export interface ReplayProtection {
  duplicateDetectionKey: string;
  replayWindowMetadata: {
    windowStart: string;
    windowEnd: string;
  };
  conflictIdentity: string;
  queueUniqueness: string;
}

export interface QueueCandidate {
  queueId: QueueId;
  connectorId: string;
  operation: string;
  previewId: string;
  decisionId: string;
  reviewPackageId: string;
  governanceVersion: string;
  policyVersion: string;
  executionManifest: ExecutionManifest;
  idempotencyToken: IdempotencyToken;
  replayProtection: ReplayProtection;
  dependencyGraph: DependencyGraph;
  auditReference: AuditReference;
  queueEligible: boolean;
  executionEligible: false; // Strictly prohibited in S2C
  executionAuthorized: false; // Strictly prohibited in S2C
  metadata: {
    generatedAt: string;
    version: string;
  };
}
