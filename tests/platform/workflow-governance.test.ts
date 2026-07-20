import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowGovernanceImpl, WorkflowGovernanceError } from '../../lib/platform/execution/workflow-governance-impl';
import { WorkflowDefinition } from '../../lib/platform/execution/workflow-graph';
import {
  PolicyEvaluationContext,
  WorkflowTelemetrySnapshot,
} from '../../lib/platform/execution/workflow-governance';

function makeDef(overrides?: Partial<WorkflowDefinition>): WorkflowDefinition {
  return {
    workflowId: 'wf-orders',
    name: 'Order Processing',
    version: '1.0.0',
    steps: [
      { stepId: 'validate', providerId: 'p1', operation: 'validate', input: {}, dependsOn: [], timeoutMs: 5000 },
      { stepId: 'process', providerId: 'p2', operation: 'process', input: {}, dependsOn: ['validate'], timeoutMs: 5000 },
    ],
    metadata: {},
    ...overrides,
  };
}

describe('WorkflowGovernanceImpl', () => {
  let gov: WorkflowGovernanceImpl;

  beforeEach(() => {
    gov = new WorkflowGovernanceImpl();
  });

  // ── 5D.1 — Certification ──

  describe('5D.1 — Workflow Certification', () => {
    it('registers a workflow in DRAFT state', () => {
      const entry = gov.register(makeDef());
      expect(entry.workflowId).toBe('wf-orders');
      expect(entry.certificationState).toBe('DRAFT');
      expect(entry.name).toBe('Order Processing');
      expect(entry.version).toBe('1.0.0');
    });

    it('transitions certification state', () => {
      gov.register(makeDef());
      const reviewed = gov.setCertificationState('wf-orders', 'REVIEW');
      expect(reviewed.certificationState).toBe('REVIEW');

      const certified = gov.setCertificationState('wf-orders', 'CERTIFIED');
      expect(certified.certificationState).toBe('CERTIFIED');
    });

    it('throws for duplicate registration', () => {
      gov.register(makeDef());
      expect(() => gov.register(makeDef())).toThrow(WorkflowGovernanceError);
    });

    it('cannot certify unregistered workflow', () => {
      expect(() => gov.setCertificationState('unknown', 'CERTIFIED'))
        .toThrow(WorkflowGovernanceError);
    });
  });

  // ── 5D.2 — Versioning ──

  describe('5D.2 — Workflow Versioning', () => {
    it('creates new version with lineage', () => {
      gov.register(makeDef());
      const v2 = gov.createVersion(
        makeDef({ version: '2.0.0', name: 'Order Processing v2' }),
        'Added payment gateway',
      );
      expect(v2.version).toBe('2.0.0');
      expect(v2.previousVersion).toBe('1.0.0');
      expect(v2.certificationState).toBe('DRAFT');
    });

    it('rejects duplicate version numbers', () => {
      gov.register(makeDef({ version: '1.0.0' }));
      expect(() =>
        gov.createVersion(makeDef({ version: '1.0.0' }), 'duplicate'),
      ).toThrow(WorkflowGovernanceError);
    });

    it('returns full version lineage', () => {
      gov.register(makeDef({ version: '1.0.0' }));
      gov.createVersion(makeDef({ version: '2.0.0' }), 'Major update');
      gov.createVersion(makeDef({ version: '3.0.0' }), 'Bug fix');

      const lineage = gov.getLineage('wf-orders');
      expect(lineage.totalVersions).toBe(3);
      expect(lineage.currentVersion).toBe('3.0.0');
      expect(lineage.versions.map((v) => v.version)).toEqual([
        '1.0.0', '2.0.0', '3.0.0',
      ]);
    });

    it('latest entry is returned by getRegistryEntry', () => {
      gov.register(makeDef({ version: '1.0.0' }));
      gov.createVersion(makeDef({ version: '2.0.0' }), 'Update');
      const entry = gov.getRegistryEntry('wf-orders')!;
      expect(entry.version).toBe('2.0.0');
    });

    it('getVersions returns all versions', () => {
      gov.register(makeDef({ version: '1.0.0' }));
      gov.createVersion(makeDef({ version: '2.0.0' }), 'Update');
      expect(gov.getVersions('wf-orders')).toHaveLength(2);
    });

    it('certification is per-latest-version', () => {
      gov.register(makeDef({ version: '1.0.0' }));
      gov.setCertificationState('wf-orders', 'CERTIFIED');
      gov.createVersion(makeDef({ version: '2.0.0' }), 'Update');
      const entry = gov.getRegistryEntry('wf-orders')!;
      expect(entry.version).toBe('2.0.0');
      expect(entry.certificationState).toBe('DRAFT');
    });
  });

  // ── 5D.3 — Execution Policies ──

  describe('5D.3 — Execution Policies', () => {
    it('sets policy with specified values', () => {
      gov.register(makeDef());
      const policy = gov.setPolicy('wf-orders', {
        permittedProviders: ['google-calendar', 'google-drive'],
        maxExecutionTimeMs: 60000,
        allowRetries: false,
      });
      expect(policy.permittedProviders).toEqual(['google-calendar', 'google-drive']);
      expect(policy.maxExecutionTimeMs).toBe(60000);
      expect(policy.allowRetries).toBe(false);
      expect(policy.allowCompensation).toBe(true);
    });

    it('merges with existing policy defaults', () => {
      gov.register(makeDef());
      gov.setPolicy('wf-orders', { allowRetries: false });
      const policy = gov.getPolicy('wf-orders')!;
      expect(policy.allowRetries).toBe(false);
      expect(policy.allowCompensation).toBe(true);
      expect(policy.maxExecutionTimeMs).toBe(300000);
    });

    it('evaluate allows when no policy set', () => {
      const ctx: PolicyEvaluationContext = {
        workflowId: 'wf-orders',
        version: '1.0.0',
        providerId: 'any-provider',
        operation: 'read',
        executionTimeMs: 100,
      };
      const result = gov.evaluatePolicy(ctx);
      expect(result.allowed).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it('evaluate rejects unpermitted provider', () => {
      gov.register(makeDef());
      gov.setPolicy('wf-orders', {
        permittedProviders: ['google-calendar'],
      });
      const ctx: PolicyEvaluationContext = {
        workflowId: 'wf-orders', version: '1.0.0',
        providerId: 'slack', operation: 'send', executionTimeMs: 100,
      };
      const result = gov.evaluatePolicy(ctx);
      expect(result.allowed).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toContain('slack');
    });

    it('evaluate permits allowed provider', () => {
      gov.register(makeDef());
      gov.setPolicy('wf-orders', {
        permittedProviders: ['google-calendar', 'slack'],
      });
      const ctx: PolicyEvaluationContext = {
        workflowId: 'wf-orders', version: '1.0.0',
        providerId: 'slack', operation: 'send', executionTimeMs: 100,
      };
      expect(gov.evaluatePolicy(ctx).allowed).toBe(true);
    });

    it('evaluate rejects excessive execution time', () => {
      gov.register(makeDef());
      gov.setPolicy('wf-orders', { maxExecutionTimeMs: 5000 });
      const ctx: PolicyEvaluationContext = {
        workflowId: 'wf-orders', version: '1.0.0',
        providerId: 'p1', operation: 'read', executionTimeMs: 10000,
      };
      const result = gov.evaluatePolicy(ctx);
      expect(result.allowed).toBe(false);
      expect(result.violations[0]).toContain('10000');
    });

    it('evaluate rejects when approval required', () => {
      gov.register(makeDef());
      gov.setPolicy('wf-orders', { requireApproval: true });
      const ctx: PolicyEvaluationContext = {
        workflowId: 'wf-orders', version: '1.0.0',
        providerId: 'p1', operation: 'read', executionTimeMs: 100,
      };
      const result = gov.evaluatePolicy(ctx);
      expect(result.allowed).toBe(false);
      expect(result.violations[0]).toContain('approval');
    });
  });

  // ── 5D.4 — Audit ──

  describe('5D.4 — Workflow Audit', () => {
    it('records audit event', () => {
      gov.register(makeDef());
      const record = gov.recordAuditEvent(
        'wf-orders', '1.0.0', 'exec-1',
        'EXECUTION_STARTED',
        { triggeredBy: 'scheduler' },
      );
      expect(record.auditId).toBeDefined();
      expect(record.eventType).toBe('EXECUTION_STARTED');
      expect(record.detail).toEqual({ triggeredBy: 'scheduler' });
    });

    it('returns audit trail for workflow', () => {
      gov.register(makeDef());
      gov.recordAuditEvent('wf-orders', '1.0.0', 'exec-1', 'EXECUTION_STARTED');
      gov.recordAuditEvent('wf-orders', '1.0.0', 'exec-1', 'EXECUTION_COMPLETED');
      const trail = gov.getAuditTrail('wf-orders');
      expect(trail).toHaveLength(2);
    });

    it('returns audit trail for execution', () => {
      gov.register(makeDef());
      gov.recordAuditEvent('wf-orders', '1.0.0', 'exec-1', 'EXECUTION_STARTED');
      gov.recordAuditEvent('wf-orders', '1.0.0', 'exec-2', 'EXECUTION_STARTED');
      gov.recordAuditEvent('wf-orders', '1.0.0', 'exec-1', 'EXECUTION_COMPLETED');
      const trail = gov.getExecutionAuditTrail('exec-1');
      expect(trail).toHaveLength(2);
    });
  });

  // ── 5D.5 — Telemetry ──

  describe('5D.5 — Workflow Telemetry', () => {
    it('records telemetry snapshot', () => {
      gov.register(makeDef());
      gov.recordTelemetry({
        workflowId: 'wf-orders',
        version: '1.0.0',
        executionId: 'exec-1',
        totalDurationMs: 1500,
        totalSteps: 2,
        completedSteps: 2,
        failedSteps: 0,
        skippedSteps: 0,
        recoveryCount: 0,
        compensationCount: 0,
        state: 'COMPLETED',
      });
      const snap = gov.getTelemetry('wf-orders', 'exec-1');
      expect(snap).toBeDefined();
      expect(snap!.totalDurationMs).toBe(1500);
      expect(snap!.state).toBe('COMPLETED');
    });

    it('returns all telemetry for a workflow', () => {
      gov.register(makeDef());
      gov.recordTelemetry(makeSnapshot('wf-orders', 'exec-1'));
      gov.recordTelemetry(makeSnapshot('wf-orders', 'exec-2'));
      gov.recordTelemetry(makeSnapshot('wf-orders', 'exec-3'));
      const all = gov.getWorkflowTelemetry('wf-orders');
      expect(all).toHaveLength(3);
    });

    it('returns undefined for unknown execution', () => {
      expect(gov.getTelemetry('unknown', 'exec-1')).toBeUndefined();
    });

    it('handles multiple workflows independently', () => {
      gov.register(makeDef());
      gov.register(makeDef({ workflowId: 'wf-other', name: 'Other' }));
      gov.recordTelemetry(makeSnapshot('wf-orders', 'exec-1'));
      gov.recordTelemetry(makeSnapshot('wf-other', 'exec-1'));
      expect(gov.getWorkflowTelemetry('wf-orders')).toHaveLength(1);
      expect(gov.getWorkflowTelemetry('wf-other')).toHaveLength(1);
    });
  });

  // ── 5D.6 — Dashboard ──

  describe('5D.6 — Operational Dashboard', () => {
    it('returns dashboard with registered workflows', () => {
      gov.register(makeDef());
      gov.register(makeDef({ workflowId: 'wf-audit', name: 'Audit Trail' }));
      gov.register(makeDef({ workflowId: 'wf-backup', name: 'Backup' }));

      gov.setCertificationState('wf-orders', 'CERTIFIED');
      gov.setCertificationState('wf-audit', 'CERTIFIED');

      const db = gov.getDashboard();
      expect(db.totalWorkflows).toBe(3);
      expect(db.certifiedCount).toBe(2);
    });

    it('aggregates telemetry into dashboard entries', () => {
      gov.register(makeDef());
      gov.recordTelemetry(makeSnapshot('wf-orders', 'exec-1', 'COMPLETED', 1000));
      gov.recordTelemetry(makeSnapshot('wf-orders', 'exec-2', 'FAILED', 500));
      gov.recordTelemetry(makeSnapshot('wf-orders', 'exec-3', 'COMPLETED', 2000));

      const db = gov.getDashboard();
      const entry = db.entries[0];
      expect(entry.totalExecutions).toBe(3);
      expect(entry.totalFailures).toBe(1);
      expect(entry.successRate).toBe(67);
      expect(entry.avgDurationMs).toBe(1167);
    });

    it('reports empty dashboard when no workflows registered', () => {
      const db = gov.getDashboard();
      expect(db.totalWorkflows).toBe(0);
      expect(db.totalExecutions).toBe(0);
    });
  });

  // ── Registry ──

  describe('registry', () => {
    it('getRegistry returns all workflows (latest version)', () => {
      gov.register(makeDef({ workflowId: 'a', name: 'A', version: '1.0.0' }));
      gov.register(makeDef({ workflowId: 'b', name: 'B', version: '1.0.0' }));
      gov.createVersion(makeDef({ workflowId: 'a', name: 'A', version: '2.0.0' }), 'Update');
      const registry = gov.getRegistry();
      expect(registry).toHaveLength(2);
      const a = registry.find((e) => e.workflowId === 'a')!;
      expect(a.version).toBe('2.0.0');
    });

    it('getRegistryEntry returns undefined for unknown', () => {
      expect(gov.getRegistryEntry('unknown')).toBeUndefined();
    });
  });
});

function makeSnapshot(
  workflowId: string,
  executionId: string,
  state: WorkflowTelemetrySnapshot['state'] = 'COMPLETED',
  durationMs = 1000,
): WorkflowTelemetrySnapshot {
  return {
    workflowId,
    version: '1.0.0',
    executionId,
    totalDurationMs: durationMs,
    totalSteps: 2,
    completedSteps: state === 'COMPLETED' ? 2 : 1,
    failedSteps: state === 'FAILED' ? 1 : 0,
    skippedSteps: 0,
    recoveryCount: 0,
    compensationCount: 0,
    state,
  };
}
