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
