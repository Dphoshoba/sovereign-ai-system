import { WorkflowDefinition } from "./workflow-graph";
import { WorkflowState } from "./workflow-runtime";
import {
  CertificationState,
  PolicyEvaluationContext,
  PolicyEvaluationResult,
  WorkflowAuditEventType,
  WorkflowAuditRecord,
  WorkflowDashboard,
  WorkflowDashboardEntry,
  WorkflowExecutionPolicy,
  WorkflowExecutionPolicyInput,
  WorkflowGovernance,
  WorkflowRegistryEntry,
  WorkflowTelemetrySnapshot,
  WorkflowVersionLineage,
} from "./workflow-governance";

export class WorkflowGovernanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowGovernanceError';
  }
}

const DEFAULT_POLICY: WorkflowExecutionPolicyInput = {
  permittedProviders: [],
  maxExecutionTimeMs: 300000,
  allowRetries: true,
  allowCompensation: true,
  requireApproval: false,
};

let nextAuditId = 0;

export class WorkflowGovernanceImpl implements WorkflowGovernance {
  private readonly registry = new Map<string, WorkflowRegistryEntry[]>();
  private readonly policies = new Map<string, WorkflowExecutionPolicy>();
  private readonly auditTrails = new Map<string, WorkflowAuditRecord[]>();
  private readonly telemetry = new Map<string, WorkflowTelemetrySnapshot[]>();

  // ── Certification ──

  register(
    definition: WorkflowDefinition,
    changelog?: string,
  ): WorkflowRegistryEntry {
    const versions = this.registry.get(definition.workflowId);
    if (versions && versions.length > 0) {
      throw new WorkflowGovernanceError(
        `Workflow '${definition.workflowId}' already registered. Use createVersion for new versions.`,
      );
    }

    const entry: WorkflowRegistryEntry = {
      workflowId: definition.workflowId,
      name: definition.name,
      version: definition.version,
      certificationState: 'DRAFT',
      previousVersion: null,
      createdAt: new Date().toISOString(),
      changelog: changelog ?? 'Initial registration',
      definition,
    };

    this.registry.set(definition.workflowId, [entry]);
    return entry;
  }

  setCertificationState(
    workflowId: string,
    state: CertificationState,
  ): WorkflowRegistryEntry {
    const versions = this.registry.get(workflowId);
    if (!versions || versions.length === 0) {
      throw new WorkflowGovernanceError(
        `Workflow '${workflowId}' not found in registry`,
      );
    }

    const latest = versions[versions.length - 1];
    const updated: WorkflowRegistryEntry = { ...latest, certificationState: state };
    versions[versions.length - 1] = updated;
    return updated;
  }

  // ── Versioning ──

  createVersion(
    definition: WorkflowDefinition,
    changelog: string,
  ): WorkflowRegistryEntry {
    const versions = this.registry.get(definition.workflowId) ?? [];
    const previous = versions.length > 0 ? versions[versions.length - 1] : null;

    if (previous && previous.version === definition.version) {
      throw new WorkflowGovernanceError(
        `Version '${definition.version}' already exists for workflow '${definition.workflowId}'`,
      );
    }

    const entry: WorkflowRegistryEntry = {
      workflowId: definition.workflowId,
      name: definition.name,
      version: definition.version,
      certificationState: 'DRAFT',
      previousVersion: previous?.version ?? null,
      createdAt: new Date().toISOString(),
      changelog,
      definition,
    };

    versions.push(entry);
    this.registry.set(definition.workflowId, versions);
    return entry;
  }

  getRegistry(): readonly WorkflowRegistryEntry[] {
    const result: WorkflowRegistryEntry[] = [];
    for (const versions of this.registry.values()) {
      const latest = versions[versions.length - 1];
      result.push(latest);
    }
    return result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  getRegistryEntry(workflowId: string): WorkflowRegistryEntry | undefined {
    const versions = this.registry.get(workflowId);
    if (!versions || versions.length === 0) return undefined;
    return versions[versions.length - 1];
  }

  getVersions(workflowId: string): readonly WorkflowRegistryEntry[] {
    return this.registry.get(workflowId) ?? [];
  }

  getLineage(workflowId: string): WorkflowVersionLineage {
    const versions = this.registry.get(workflowId);
    if (!versions || versions.length === 0) {
      throw new WorkflowGovernanceError(
        `Workflow '${workflowId}' not found`,
      );
    }
    return {
      workflowId,
      versions: [...versions],
      currentVersion: versions[versions.length - 1].version,
      totalVersions: versions.length,
    };
  }

  // ── Execution Policies ──

  setPolicy(
    workflowId: string,
    policy: Partial<WorkflowExecutionPolicyInput>,
  ): WorkflowExecutionPolicy {
    const existing = this.policies.get(workflowId);
    const defaults = existing ?? DEFAULT_POLICY;

    const merged: WorkflowExecutionPolicy = {
      workflowId,
      version: defaults.version ?? '1.0.0',
      permittedProviders: policy.permittedProviders ?? defaults.permittedProviders,
      maxExecutionTimeMs: policy.maxExecutionTimeMs ?? defaults.maxExecutionTimeMs,
      allowRetries: policy.allowRetries ?? defaults.allowRetries,
      allowCompensation: policy.allowCompensation ?? defaults.allowCompensation,
      requireApproval: policy.requireApproval ?? defaults.requireApproval,
    };

    this.policies.set(workflowId, merged);
    return merged;
  }

  getPolicy(workflowId: string): WorkflowExecutionPolicy | undefined {
    return this.policies.get(workflowId);
  }

  evaluatePolicy(context: PolicyEvaluationContext): PolicyEvaluationResult {
    const policy = this.policies.get(context.workflowId);
    if (!policy) {
      return { allowed: true, violations: [] };
    }

    const violations: string[] = [];

    // Check permitted providers
    if (
      policy.permittedProviders.length > 0 &&
      !policy.permittedProviders.includes(context.providerId)
    ) {
      violations.push(
        `Provider '${context.providerId}' is not in the permitted providers list`,
      );
    }

    // Check max execution time
    if (context.executionTimeMs > policy.maxExecutionTimeMs) {
      violations.push(
        `Execution time ${context.executionTimeMs}ms exceeds maximum ${policy.maxExecutionTimeMs}ms`,
      );
    }

    // Check approval
    if (policy.requireApproval) {
      violations.push('Workflow execution requires approval');
    }

    return {
      allowed: violations.length === 0,
      violations,
    };
  }

  // ── Audit ──

  recordAuditEvent(
    workflowId: string,
    version: string,
    executionId: string,
    eventType: WorkflowAuditEventType,
    detail?: Record<string, unknown>,
  ): WorkflowAuditRecord {
    nextAuditId++;
    const record: WorkflowAuditRecord = {
      auditId: `audit-${nextAuditId}`,
      workflowId,
      version,
      executionId,
      eventType,
      timestamp: new Date().toISOString(),
      detail: detail ?? {},
    };

    const trail = this.auditTrails.get(workflowId) ?? [];
    trail.push(record);
    this.auditTrails.set(workflowId, trail);
    return record;
  }

  getAuditTrail(workflowId: string): readonly WorkflowAuditRecord[] {
    return this.auditTrails.get(workflowId) ?? [];
  }

  getExecutionAuditTrail(
    executionId: string,
  ): readonly WorkflowAuditRecord[] {
    const results: WorkflowAuditRecord[] = [];
    for (const trail of this.auditTrails.values()) {
      for (const record of trail) {
        if (record.executionId === executionId) {
          results.push(record);
        }
      }
    }
    return results.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  // ── Telemetry ──

  recordTelemetry(snapshot: WorkflowTelemetrySnapshot): void {
    const key = `${snapshot.workflowId}:${snapshot.executionId}`;
    const existing = this.telemetry.get(key) ?? [];
    existing.push(snapshot);
    this.telemetry.set(key, existing);
  }

  getTelemetry(
    workflowId: string,
    executionId: string,
  ): WorkflowTelemetrySnapshot | undefined {
    const key = `${workflowId}:${executionId}`;
    const snapshots = this.telemetry.get(key);
    if (!snapshots || snapshots.length === 0) return undefined;
    return snapshots[snapshots.length - 1];
  }

  getWorkflowTelemetry(
    workflowId: string,
  ): readonly WorkflowTelemetrySnapshot[] {
    const results: WorkflowTelemetrySnapshot[] = [];
    for (const [key, snapshots] of this.telemetry) {
      if (key.startsWith(`${workflowId}:`)) {
        results.push(...snapshots);
      }
    }
    return results.sort(
      (a, b) => a.executionId.localeCompare(b.executionId),
    );
  }

  // ── Dashboard ──

  getDashboard(): WorkflowDashboard {
    const entries: WorkflowDashboardEntry[] = [];
    let totalExecutions = 0;
    let failedExecutions = 0;
    let certifiedCount = 0;

    for (const [, versions] of this.registry) {
      const latest = versions[versions.length - 1];

      const workflowTelemetry = this.getWorkflowTelemetry(latest.workflowId);
      const executions = workflowTelemetry;

      let lastExecState: WorkflowState | null = null;
      let lastExecAt: string | null = null;
      let totalSuccesses = 0;
      let totalDuration = 0;

      for (const snap of executions) {
        totalExecutions++;
        if (snap.state === 'FAILED') failedExecutions++;
        else totalSuccesses++;
        totalDuration += snap.totalDurationMs;
        lastExecState = snap.state;
      }

      if (latest.certificationState === 'CERTIFIED') certifiedCount++;

      entries.push({
        workflowId: latest.workflowId,
        name: latest.name,
        version: latest.version,
        certificationState: latest.certificationState,
        lastExecutionState: lastExecState,
        lastExecutionAt: lastExecAt,
        totalExecutions: executions.length,
        totalFailures: executions.filter((e) => e.state === 'FAILED').length,
        successRate:
          executions.length > 0
            ? Math.round((totalSuccesses / executions.length) * 100)
            : 0,
        avgDurationMs:
          executions.length > 0
            ? Math.round(totalDuration / executions.length)
            : 0,
      });
    }

    return {
      entries,
      totalWorkflows: entries.length,
      totalExecutions,
      failedExecutions,
      certifiedCount,
    };
  }
}
