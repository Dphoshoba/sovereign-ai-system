import { WorkflowDefinition } from "./workflow-graph";
import { WorkflowState } from "./workflow-runtime";

// ── Certification ──

export type CertificationState =
  | 'DRAFT'
  | 'REVIEW'
  | 'CERTIFIED'
  | 'DEPRECATED'
  | 'RETIRED';

export interface WorkflowRegistryEntry {
  readonly workflowId: string;
  readonly name: string;
  readonly version: string;
  readonly certificationState: CertificationState;
  readonly previousVersion: string | null;
  readonly createdAt: string;
  readonly changelog: string;
  readonly definition: WorkflowDefinition;
}

// ── Versioning ──

export interface WorkflowVersionLineage {
  readonly workflowId: string;
  readonly versions: readonly WorkflowRegistryEntry[];
  readonly currentVersion: string;
  readonly totalVersions: number;
}

// ── Execution Policies ──

export interface WorkflowExecutionPolicyInput {
  readonly version?: string;
  readonly permittedProviders: readonly string[];
  readonly maxExecutionTimeMs: number;
  readonly allowRetries: boolean;
  readonly allowCompensation: boolean;
  readonly requireApproval: boolean;
}

export interface WorkflowExecutionPolicy {
  readonly workflowId: string;
  readonly version: string;
  readonly permittedProviders: readonly string[];
  readonly maxExecutionTimeMs: number;
  readonly allowRetries: boolean;
  readonly allowCompensation: boolean;
  readonly requireApproval: boolean;
}

// ── Audit ──

export type WorkflowAuditEventType =
  | 'EXECUTION_STARTED'
  | 'EXECUTION_COMPLETED'
  | 'EXECUTION_FAILED'
  | 'STEP_COMPLETED'
  | 'STEP_FAILED'
  | 'CHECKPOINT_CREATED'
  | 'WORKFLOW_RESUMED'
  | 'WORKFLOW_REPLAYED'
  | 'COMPENSATION_EXECUTED'
  | 'POLICY_VIOLATION';

export interface WorkflowAuditRecord {
  readonly auditId: string;
  readonly workflowId: string;
  readonly version: string;
  readonly executionId: string;
  readonly eventType: WorkflowAuditEventType;
  readonly timestamp: string;
  readonly detail: Readonly<Record<string, unknown>>;
}

// ── Telemetry ──

export interface WorkflowTelemetrySnapshot {
  readonly workflowId: string;
  readonly version: string;
  readonly executionId: string;
  readonly totalDurationMs: number;
  readonly totalSteps: number;
  readonly completedSteps: number;
  readonly failedSteps: number;
  readonly skippedSteps: number;
  readonly recoveryCount: number;
  readonly compensationCount: number;
  readonly state: WorkflowState;
}

// ── Dashboard ──

export interface WorkflowDashboardEntry {
  readonly workflowId: string;
  readonly name: string;
  readonly version: string;
  readonly certificationState: CertificationState;
  readonly lastExecutionState: WorkflowState | null;
  readonly lastExecutionAt: string | null;
  readonly totalExecutions: number;
  readonly totalFailures: number;
  readonly successRate: number;
  readonly avgDurationMs: number;
}

export interface WorkflowDashboard {
  readonly entries: readonly WorkflowDashboardEntry[];
  readonly totalWorkflows: number;
  readonly totalExecutions: number;
  readonly failedExecutions: number;
  readonly certifiedCount: number;
}

// ── Policy Evaluation ──

export interface PolicyEvaluationContext {
  readonly workflowId: string;
  readonly version: string;
  readonly providerId: string;
  readonly operation: string;
  readonly executionTimeMs: number;
}

export interface PolicyEvaluationResult {
  readonly allowed: boolean;
  readonly violations: readonly string[];
}

// ── Governance Manager ──

export interface WorkflowGovernance {
  register(
    definition: WorkflowDefinition,
    changelog?: string,
  ): WorkflowRegistryEntry;

  setCertificationState(
    workflowId: string,
    state: CertificationState,
    by?: string,
  ): WorkflowRegistryEntry;

  createVersion(
    definition: WorkflowDefinition,
    changelog: string,
  ): WorkflowRegistryEntry;

  getRegistry(): readonly WorkflowRegistryEntry[];
  getRegistryEntry(workflowId: string): WorkflowRegistryEntry | undefined;
  getVersions(workflowId: string): readonly WorkflowRegistryEntry[];
  getLineage(workflowId: string): WorkflowVersionLineage;

  setPolicy(
    workflowId: string,
    policy: Partial<WorkflowExecutionPolicyInput>,
  ): WorkflowExecutionPolicy;
  getPolicy(workflowId: string): WorkflowExecutionPolicy | undefined;
  evaluatePolicy(
    context: PolicyEvaluationContext,
  ): PolicyEvaluationResult;

  recordAuditEvent(
    workflowId: string,
    version: string,
    executionId: string,
    eventType: WorkflowAuditEventType,
    detail?: Record<string, unknown>,
  ): WorkflowAuditRecord;
  getAuditTrail(workflowId: string): readonly WorkflowAuditRecord[];
  getExecutionAuditTrail(
    executionId: string,
  ): readonly WorkflowAuditRecord[];

  recordTelemetry(snapshot: WorkflowTelemetrySnapshot): void;
  getTelemetry(
    workflowId: string,
    executionId: string,
  ): WorkflowTelemetrySnapshot | undefined;
  getWorkflowTelemetry(
    workflowId: string,
  ): readonly WorkflowTelemetrySnapshot[];

  getDashboard(): WorkflowDashboard;
}
