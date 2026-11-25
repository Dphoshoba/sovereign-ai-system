export type LifecycleStatus = "active" | "inactive" | "deprecated";

export type ConnectorKind =
  | "gmail"
  | "calendar"
  | "slack"
  | "github"
  | "drive"
  | "office365"
  | "notion"
  | "discord"
  | "custom";

export interface OrganizationContext {
  tenantId: string;
  organizationId: string;
  environment: "dev" | "staging" | "prod";
  region?: string;
  complianceTags?: string[];
}

export interface MemoryReference {
  memoryId: string;
  namespace: string;
  locator: string;
  checksum?: string;
  classification?: "public" | "internal" | "confidential" | "restricted";
}

export interface AuditReference {
  auditId: string;
  traceId: string;
  source: string;
  locator?: string;
  immutable: boolean;
}

export interface WorkflowRequest {
  requestId: string;
  workflowId: string;
  workflowVersion: string;
  trigger: {
    type: "manual" | "scheduled" | "event";
    source: string;
  };
  input: Record<string, unknown>;
  organization: OrganizationContext;
  requestedBy: string;
  memoryRefs?: MemoryReference[];
  auditRef?: AuditReference;
}

export interface ExecutionRequest {
  executionId: string;
  workflowRequest: WorkflowRequest;
  dryRun: boolean;
  requestedCapabilities: string[];
  constraints?: {
    maxSteps?: number;
    approvalRequired?: boolean;
    deterministicOnly?: boolean;
  };
}

export interface ExecutionResult {
  executionId: string;
  status: "succeeded" | "failed" | "blocked" | "preview";
  stepsEvaluated: number;
  outputs: Record<string, unknown>;
  warnings: string[];
  errors: string[];
  auditRef?: AuditReference;
}

export interface ApprovalDecision {
  approvalId: string;
  status: "approved" | "rejected" | "escalated" | "pending";
  decidedBy?: string;
  rationale?: string;
  conditions?: string[];
}

export interface PolicyDecision {
  policyId: string;
  policyName: string;
  effect: "allow" | "deny" | "review";
  reasons: string[];
  obligations?: string[];
}

export interface GovernanceDecision {
  decisionId: string;
  outcome: "approved" | "denied" | "requires-review";
  policyDecisions: PolicyDecision[];
  approval?: ApprovalDecision;
  summary: string;
}

export interface CapabilityDescriptor {
  capabilityId: string;
  name: string;
  description: string;
  version: string;
  status: LifecycleStatus;
  deterministic: boolean;
  requiresApproval: boolean;
  requiredConnectorKinds?: ConnectorKind[];
  tags?: string[];
}

export interface ServiceDescriptor {
  serviceId: string;
  serviceName: string;
  version: string;
  status: LifecycleStatus;
  capabilities: string[];
  owner: string;
  description?: string;
}

export interface OrchestrationPlan {
  requestId: string;
  workflowId: string;
  organizationContext: OrganizationContext;
  resolvedBindings: string[];
  requiredCapabilities: string[];
  capabilityMap: Record<string, string[]>;
  governanceDecision: {
    blocked: boolean;
    approved: boolean;
    previewOnly: boolean;
    evaluatedPolicyIds: string[];
    violations: string[];
    obligations: string[];
  };
  dependencyGraph: Record<string, string[]>;
  executionOrder: string[];
  previewRoute: {
    route: "preview";
    status: "ready" | "blocked";
    reason?: string;
    metadata: {
      deterministic: true;
      mode: "preview-only";
    };
  };
  approvalRoute: {
    route: "approval";
    status: "ready" | "blocked";
    checkpoints: string[];
    requiresHumanReview: boolean;
    reason?: string;
  };
  auditRoute: {
    route: "audit";
    status: "ready" | "blocked";
    references: string[];
    immutableProjection: true;
    reason?: string;
  };
  status: "planned" | "blocked";
  warnings: string[];
  blockers: string[];
}

export type RuntimeSessionStatus =
  | "blocked"
  | "preview-ready"
  | "awaiting-approval"
  | "awaiting-audit"
  | "completed";

export type RuntimeCheckpointRoute = "preview" | "approval" | "audit" | "blocker";

export type RuntimeCheckpointStatus = "pending" | "satisfied" | "blocked";

export interface RuntimeCheckpoint {
  checkpointId: string;
  route: RuntimeCheckpointRoute;
  status: RuntimeCheckpointStatus;
  reason?: string;
  obligations: string[];
}

export type RuntimeEventType =
  | "preview-acknowledged"
  | "approval-checkpoint-satisfied"
  | "audit-checkpoint-satisfied"
  | "session-blocked";

export interface RuntimeEvent {
  eventId: string;
  type: RuntimeEventType;
  actor: string;
  occurredAt: string;
  checkpointId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface RuntimeSession {
  sessionId: string;
  requestId: string;
  workflowId: string;
  status: RuntimeSessionStatus;
  organizationContext: OrganizationContext;
  planStatus: OrchestrationPlan["status"];
  checkpoints: RuntimeCheckpoint[];
  eventLog: RuntimeEvent[];
  warnings: string[];
  blockers: string[];
  executionAllowed: false;
}

export interface RuntimeSnapshot {
  snapshotId: string;
  sessionId: string;
  requestId: string;
  workflowId: string;
  status: RuntimeSessionStatus;
  checkpointSummary: Record<RuntimeCheckpointStatus, number>;
  eventCount: number;
  blockers: string[];
  immutableProjection: true;
  executionAllowed: false;
}
