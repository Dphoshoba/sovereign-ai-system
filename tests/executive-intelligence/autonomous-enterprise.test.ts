import { describe, it, expect } from 'vitest';
import { AutonomousEnterpriseEngine } from '../../lib/executive-intelligence/autonomous-engine';
import type {
  PolicyRule, ApprovalRequest, ExecutionStep, ExecutionPlan, ExecutionPackage,
  AuditRecord, SimulationResult, AutonomousEnterpriseBriefing,
  AuditEventType, ApprovalStatus, ExecutionStatus, PackageStatus,
} from '../../lib/executive-intelligence/autonomous-types';
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { ExecutiveOffice } from '../../lib/executive-office/executive-office';
import { ResearchOffice } from '../../lib/research-office/research-office';
import { ProductOffice } from '../../lib/product-office/product-office';
import { OperationsOffice } from '../../lib/operations-office/operations-office';
import { KnowledgeOffice } from '../../lib/knowledge-office/knowledge-office';
import { ExecutiveIntelligence } from '../../lib/executive-intelligence/intelligence-engine';
import { PortfolioEngine } from '../../lib/executive-intelligence/portfolio-engine';
import {
  MENWISE360_PROFILE, BIBLE_QUEST_PROFILE, CREATOR_AUTOMATION_PROFILE,
  VISIONCRAFT_STUDIO_PROFILE, INSPIREVOICE_PROFILE,
} from '../../lib/executive-intelligence/product-profile-types';

function deployAllOffices(w: WorkforcePlatformImpl): void {
  new ExecutiveOffice(w).deploy();
  new ResearchOffice(w).deploy();
  new ProductOffice(w).deploy();
  new OperationsOffice(w).deploy();
  new KnowledgeOffice(w).deploy();
}

const ALL_PROFILES = [MENWISE360_PROFILE, BIBLE_QUEST_PROFILE, CREATOR_AUTOMATION_PROFILE, VISIONCRAFT_STUDIO_PROFILE, INSPIREVOICE_PROFILE];

const SAMPLE_POLICY_ALLOWABLE: PolicyRule = {
  id: 'pol-001',
  action: 'allowable',
  description: 'Standard email notification to stakeholders',
  requiresApproval: true,
  approvalThreshold: 'delegated',
  evidenceRequirements: ['ev-001', 'ev-002'],
  status: 'active',
  version: 1,
};

const SAMPLE_POLICY_PROHIBITED: PolicyRule = {
  id: 'pol-002',
  action: 'prohibited',
  description: 'Unauthorized financial transactions',
  requiresApproval: false,
  approvalThreshold: 'executive',
  evidenceRequirements: [],
  status: 'active',
  version: 1,
};

const SAMPLE_APPROVAL_REQUEST: ApprovalRequest = {
  id: 'req-001',
  actionId: 'notify-stakeholders',
  requestedBy: 'product-owner',
  requestedAt: Date.now(),
  policyId: 'pol-001',
  evidenceIds: ['ev-001'],
  rationale: 'Ready to send weekly update',
  status: 'pending',
  delegationChain: [],
};

function makeStep(order: number, title: string, connector: ExecutionStep['connectorType'] = 'email'): ExecutionStep {
  return {
    order,
    title,
    description: `Step ${order}: ${title}`,
    connectorType: connector,
    payload: { action: title },
    status: 'draft',
  };
}

describe('Era 7 — Autonomous Enterprise', () => {

  describe('Policy Engine', () => {

    it('register and retrieve a policy', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      const p = engine.getPolicy('pol-001');
      expect(p).toBeDefined();
      expect(p?.action).toBe('allowable');
      expect(p?.description).toBe('Standard email notification to stakeholders');
    });

    it('action evaluation returns allowed for allowable policy', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      const result = engine.evaluateAction('notify-stakeholders');
      expect(result.allowed).toBe(true);
      expect(result.requiresApproval).toBe(true);
    });

    it('prohibited action returns not allowed', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_PROHIBITED);
      const result = engine.evaluateAction('financial-transfer');
      expect(result.allowed).toBe(false);
      expect(result.requiresApproval).toBe(false);
    });

    it('policy with requiresApproval=true returns correct approval level', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      const result = engine.evaluateAction('notify-stakeholders');
      expect(result.requiresApproval).toBe(true);
      expect(result.policyId).toBe('pol-001');
    });

    it('immutable versioning preserved for policies', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.registerPolicy({ ...SAMPLE_POLICY_ALLOWABLE, version: 2, description: 'Updated description v2' });
      const v1 = engine.getPolicy('pol-001', 1);
      const v2 = engine.getPolicy('pol-001', 2);
      expect(v1?.description).toBe('Standard email notification to stakeholders');
      expect(v2?.description).toBe('Updated description v2');
      expect(engine.getPolicy('pol-001')?.version).toBe(2);
    });

    it('getAllPolicies returns all versions', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.registerPolicy({ ...SAMPLE_POLICY_ALLOWABLE, version: 2 });
      engine.registerPolicy(SAMPLE_POLICY_PROHIBITED);
      expect(engine.getAllPolicies().length).toBe(3);
    });

    it('superseded policies are maintained correctly', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy({ ...SAMPLE_POLICY_ALLOWABLE, version: 1, status: 'superseded' });
      engine.registerPolicy({ ...SAMPLE_POLICY_ALLOWABLE, version: 2, status: 'active' });
      expect(engine.getPolicy('pol-001', 1)?.status).toBe('superseded');
      expect(engine.getPolicy('pol-001', 2)?.status).toBe('active');
    });
  });

  describe('Approval Engine', () => {

    it('submit and approve a request', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);
      const approved = engine.approve('req-001', 'exec-director');
      expect(approved).not.toBeNull();
      expect(approved?.status).toBe('approved');
      expect(approved?.approvedBy).toBe('exec-director');
      expect(approved?.approvedAt).toBeGreaterThan(0);
    });

    it('reject with reason', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);
      const rejected = engine.reject('req-001', 'exec-director', 'Insufficient evidence');
      expect(rejected).not.toBeNull();
      expect(rejected?.status).toBe('rejected');
      expect(rejected?.rejectionReason).toBe('Insufficient evidence');
      expect(rejected?.rejectedBy).toBe('exec-director');
    });

    it('unauthorized approval returns null (non-pending request)', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);
      engine.approve('req-001', 'exec-director');
      const doubleApprove = engine.approve('req-001', 'another-approver');
      expect(doubleApprove).toBeNull();
    });

    it('approval for non-existent request returns null', () => {
      const engine = new AutonomousEnterpriseEngine();
      expect(engine.approve('nonexistent', 'exec-director')).toBeNull();
    });

    it('reject for non-existent request returns null', () => {
      const engine = new AutonomousEnterpriseEngine();
      expect(engine.reject('nonexistent', 'exec-director', 'reason')).toBeNull();
    });

    it('getPendingApprovals returns correct list', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);
      const req2: ApprovalRequest = { ...SAMPLE_APPROVAL_REQUEST, id: 'req-002', actionId: 'deploy-to-prod' };
      engine.submitApprovalRequest(req2);
      const pending = engine.getPendingApprovals();
      expect(pending.length).toBe(2);
      expect(pending.every(r => r.status === 'pending')).toBe(true);
    });

    it('getPendingApprovals excludes approved requests', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);
      engine.approve('req-001', 'exec-director');
      expect(engine.getPendingApprovals().length).toBe(0);
    });

    it('getPendingApprovals excludes rejected requests', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);
      engine.reject('req-001', 'exec-director', 'Not needed');
      expect(engine.getPendingApprovals().length).toBe(0);
    });

    it('getApprovalRequest retrieves by id', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);
      const req = engine.getApprovalRequest('req-001');
      expect(req).toBeDefined();
      expect(req?.rationale).toBe('Ready to send weekly update');
    });
  });

  describe('Execution Planner', () => {

    it('create plan with steps', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      const plan = engine.createExecutionPlan('Weekly Notification', [
        makeStep(1, 'Compose email'),
        makeStep(2, 'Review draft'),
        makeStep(3, 'Send notification'),
      ], 'pol-001');
      expect(plan.id).toMatch(/^plan-/);
      expect(plan.title).toBe('Weekly Notification');
      expect(plan.steps.length).toBe(3);
      expect(plan.status).toBe('draft');
    });

    it('finalize marks plan proposed', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      const plan = engine.createExecutionPlan('Deploy Update', [
        makeStep(1, 'Run CI checks'),
      ], 'pol-001');
      const finalized = engine.finalizePlan(plan.id);
      expect(finalized?.status).toBe('proposed');
    });

    it('finalize returns null for non-existent plan', () => {
      const engine = new AutonomousEnterpriseEngine();
      expect(engine.finalizePlan('nonexistent')).toBeNull();
    });

    it('getExecutionPlan returns undefined for unknown id', () => {
      const engine = new AutonomousEnterpriseEngine();
      expect(engine.getExecutionPlan('no-plan')).toBeUndefined();
    });

    it('getAllPlans returns all registered plans', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.createExecutionPlan('Plan A', [], 'pol-001');
      engine.createExecutionPlan('Plan B', [], 'pol-001');
      expect(engine.getAllPlans().length).toBe(2);
    });

    it('getPendingExecutions includes draft plans', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.createExecutionPlan('Pending Plan', [], 'pol-001');
      expect(engine.getPendingExecutions().length).toBe(1);
    });
  });

  describe('Execution Package', () => {

    it('generate with policy and approval includes all 7 required elements', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);
      engine.approve('req-001', 'exec-director');

      const step: ExecutionStep = { order: 1, title: 'Send', description: 'Send notification', connectorType: 'email', payload: { to: 'stakeholders' }, status: 'draft', rollbackStep: { order: 0, title: 'Recall', description: 'Recall notification', connectorType: 'email', payload: { action: 'recall' }, status: 'draft' } };
      const plan = engine.createExecutionPlan('Notify', [step], 'pol-001');
      plan.rollbackStrategy = 'Recall sent emails';
      plan.expectedOutcome = 'Stakeholders receive weekly update';

      const pkg = engine.generateExecutionPackage(plan.id, 'pol-001', 'req-001');
      expect(pkg).not.toBeNull();
      expect(pkg!.originatingEvidence.length).toBeGreaterThanOrEqual(1);
      expect(pkg!.governingPolicy).toBeTruthy();
      expect(pkg!.approvalChain.length).toBeGreaterThan(0);
      expect(pkg!.expectedOutcome).toBeTruthy();
      expect(pkg!.rollbackStrategy).toBeTruthy();
      expect(pkg!.auditId).toBeTruthy();
      expect(pkg!.steps).toBeDefined();
    });

    it('includes all required metadata (evidence, policy, approval, outcome, rollback, audit, steps)', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);
      engine.approve('req-001', 'exec-director');

      const step: ExecutionStep = { order: 1, title: 'Deploy', description: 'Push to production', connectorType: 'cicd', payload: { env: 'prod' }, status: 'draft', rollbackStep: { order: 0, title: 'Rollback', description: 'Revert deploy', connectorType: 'cicd', payload: { action: 'revert' }, status: 'draft' } };
      const plan = engine.createExecutionPlan('Production Deploy', [step], 'pol-001');
      plan.rollbackStrategy = 'Revert to previous release';
      plan.expectedOutcome = 'New version deployed to production';

      const pkg = engine.generateExecutionPackage(plan.id, 'pol-001', 'req-001');
      expect(pkg).not.toBeNull();
      expect(pkg!.originatingEvidence).toEqual(SAMPLE_POLICY_ALLOWABLE.evidenceRequirements);
      expect(pkg!.governingPolicy).toBe(SAMPLE_POLICY_ALLOWABLE.description);
      expect(pkg!.approvalChain).toContain('product-owner');
      expect(pkg!.expectedOutcome).toBe('New version deployed to production');
      expect(pkg!.rollbackStrategy).toBe('Revert to previous release');
      expect(pkg!.auditId).toMatch(/^audit-/);
      expect(pkg!.steps.length).toBe(1);
    });

    it('returns null when plan missing', () => {
      const engine = new AutonomousEnterpriseEngine();
      expect(engine.generateExecutionPackage('no-plan', 'pol-001', 'req-001')).toBeNull();
    });

    it('returns null when approval missing', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      const step: ExecutionStep = { order: 1, title: 'Test', description: 'Run tests', connectorType: 'github', payload: {}, status: 'draft', rollbackStep: { order: 0, title: 'Undo', description: 'Undo', connectorType: 'github', payload: {}, status: 'draft' } };
      const plan = engine.createExecutionPlan('Test Plan', [step], 'pol-001');
      plan.rollbackStrategy = 'Undo changes';
      plan.expectedOutcome = 'Tests pass';
      expect(engine.generateExecutionPackage(plan.id, 'pol-001', 'no-req')).toBeNull();
    });

    it('returns null when policy missing', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);
      engine.approve('req-001', 'exec-director');
      const step: ExecutionStep = { order: 1, title: 'Test', description: 'Run tests', connectorType: 'github', payload: {}, status: 'draft', rollbackStep: { order: 0, title: 'Undo', description: 'Undo', connectorType: 'github', payload: {}, status: 'draft' } };
      const plan = engine.createExecutionPlan('Test Plan', [step], 'bad-pol');
      plan.rollbackStrategy = 'Undo';
      plan.expectedOutcome = 'Pass';
      expect(engine.generateExecutionPackage(plan.id, 'bad-pol', 'req-001')).toBeNull();
    });

    it('rejects execution package without rollback strategy', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);
      engine.approve('req-001', 'exec-director');

      const step: ExecutionStep = { order: 1, title: 'Action', description: 'Do something', connectorType: 'email', payload: {}, status: 'draft', rollbackStep: { order: 0, title: 'Undo', description: 'Undo', connectorType: 'email', payload: {}, status: 'draft' } };
      const plan = engine.createExecutionPlan('No Rollback', [step], 'pol-001');
      plan.expectedOutcome = 'Done';
      expect(engine.generateExecutionPackage(plan.id, 'pol-001', 'req-001')).toBeNull();
    });

    it('rejects execution package with empty rollback strategy', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);
      engine.approve('req-001', 'exec-director');

      const step: ExecutionStep = { order: 1, title: 'Action', description: 'Do something', connectorType: 'email', payload: {}, status: 'draft', rollbackStep: { order: 0, title: 'Undo', description: 'Undo', connectorType: 'email', payload: {}, status: 'draft' } };
      const plan = engine.createExecutionPlan('Empty Rollback', [step], 'pol-001');
      plan.rollbackStrategy = '   ';
      plan.expectedOutcome = 'Done';
      expect(engine.generateExecutionPackage(plan.id, 'pol-001', 'req-001')).toBeNull();
    });

    it('getExecutionPackage retrieves by id', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);
      engine.approve('req-001', 'exec-director');

      const step: ExecutionStep = { order: 1, title: 'Send', description: 'Send', connectorType: 'email', payload: {}, status: 'draft', rollbackStep: { order: 0, title: 'Recall', description: 'Recall', connectorType: 'email', payload: {}, status: 'draft' } };
      const plan = engine.createExecutionPlan('Package Test', [step], 'pol-001');
      plan.rollbackStrategy = 'Recall sent messages';
      plan.expectedOutcome = 'Message delivered';

      const pkg = engine.generateExecutionPackage(plan.id, 'pol-001', 'req-001');
      const retrieved = engine.getExecutionPackage(pkg!.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(pkg!.id);
    });
  });

  describe('Audit Engine', () => {

    it('record and retrieve events', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.recordAuditEvent({
        packageId: 'pkg-001',
        eventType: 'execution_started',
        timestamp: Date.now(),
        actor: 'system',
        details: 'Execution started for package pkg-001',
        evidenceIds: ['ev-001'],
      });
      const trail = engine.getRecentAuditTrail(5);
      expect(trail.length).toBe(1);
      expect(trail[0].eventType).toBe('execution_started');
      expect(trail[0].packageId).toBe('pkg-001');
    });

    it('chronological ordering preserved (newest first)', () => {
      const engine = new AutonomousEnterpriseEngine();
      const t1 = Date.now();
      const t2 = t1 + 1000;
      const t3 = t1 + 2000;
      engine.recordAuditEvent({ packageId: 'pkg-1', eventType: 'policy_evaluated', timestamp: t1, actor: 'system', details: 'First', evidenceIds: [] });
      engine.recordAuditEvent({ packageId: 'pkg-2', eventType: 'approval_requested', timestamp: t2, actor: 'user', details: 'Second', evidenceIds: [] });
      engine.recordAuditEvent({ packageId: 'pkg-3', eventType: 'execution_completed', timestamp: t3, actor: 'system', details: 'Third', evidenceIds: [] });

      const trail = engine.getRecentAuditTrail(10);
      expect(trail[0].timestamp).toBe(t3);
      expect(trail[1].timestamp).toBe(t2);
      expect(trail[2].timestamp).toBe(t1);
    });

    it('covers all audit event types', () => {
      const engine = new AutonomousEnterpriseEngine();
      const eventTypes: AuditEventType[] = [
        'policy_evaluated', 'approval_requested', 'approval_granted', 'approval_denied',
        'execution_started', 'execution_completed', 'execution_failed',
        'rollback_initiated', 'rollback_completed', 'simulation_ran',
      ];
      for (const et of eventTypes) {
        engine.recordAuditEvent({
          packageId: 'pkg-all', eventType: et, timestamp: Date.now(),
          actor: 'system', details: `Event: ${et}`, evidenceIds: [],
        });
      }
      const trail = engine.getRecentAuditTrail(20);
      const recordedTypes = trail.map(r => r.eventType);
      for (const et of eventTypes) {
        expect(recordedTypes).toContain(et);
      }
    });

    it('getRecentAuditTrail limits count', () => {
      const engine = new AutonomousEnterpriseEngine();
      for (let i = 0; i < 10; i++) {
        engine.recordAuditEvent({
          packageId: `pkg-${i}`, eventType: 'policy_evaluated',
          timestamp: Date.now() + i, actor: 'system', details: `Event ${i}`, evidenceIds: [],
        });
      }
      const trail = engine.getRecentAuditTrail(5);
      expect(trail.length).toBe(5);
    });
  });

  describe('Simulation Engine', () => {

    it('simulation runs without side effects (does not modify plan)', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      const step: ExecutionStep = { order: 1, title: 'Notify', description: 'Send notification', connectorType: 'email', payload: {}, status: 'draft', rollbackStep: { order: 0, title: 'Recall', description: 'Recall', connectorType: 'email', payload: {}, status: 'draft' } };
      const plan = engine.createExecutionPlan('Notify Plan', [step], 'pol-001');
      plan.rollbackStrategy = 'Recall';
      plan.expectedOutcome = 'Sent';

      const statusBefore = plan.status;
      const sim = engine.simulateExecution(plan.id);
      const planAfter = engine.getExecutionPlan(plan.id);
      expect(planAfter?.status).toBe(statusBefore);
      expect(sim).not.toBeNull();
      expect(sim!.affectedSystems).toContain('email');
    });

    it('simulation identifies policy violations without executing', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_PROHIBITED);
      const step: ExecutionStep = { order: 1, title: 'Financial Transfer', description: 'Send money', connectorType: 'crm', payload: {}, status: 'draft', rollbackStep: { order: 0, title: 'Reverse', description: 'Reverse', connectorType: 'crm', payload: {}, status: 'draft' } };
      const plan = engine.createExecutionPlan('Risky Transfer', [step], 'pol-002');
      plan.rollbackStrategy = 'Reverse transaction';
      plan.expectedOutcome = 'Money sent';
      const sim = engine.simulateExecution(plan.id);
      expect(sim).not.toBeNull();
      expect(sim!.policyViolations.length).toBeGreaterThan(0);
      expect(sim!.policyViolations[0]).toContain('prohibits');
    });

    it('simulation identifies lack of rollback as risk', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      const step: ExecutionStep = { order: 1, title: 'Action', description: 'Do something', connectorType: 'github', payload: {}, status: 'draft' };
      const plan = engine.createExecutionPlan('No Rollback Plan', [step], 'pol-001');
      plan.rollbackStrategy = 'Undo';
      plan.expectedOutcome = 'Done';
      const sim = engine.simulateExecution(plan.id);
      expect(sim).not.toBeNull();
      expect(sim!.risksIdentified.some(r => r.includes('rollback'))).toBe(true);
    });

    it('simulation returns null for invalid plan', () => {
      const engine = new AutonomousEnterpriseEngine();
      expect(engine.simulateExecution('nonexistent')).toBeNull();
    });

    it('simulation confidence is 0.1 for empty step plan', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      const plan = engine.createExecutionPlan('Empty Plan', [], 'pol-001');
      plan.rollbackStrategy = 'N/A';
      plan.expectedOutcome = 'Nothing';
      const sim = engine.simulateExecution(plan.id);
      expect(sim).not.toBeNull();
      expect(sim!.confidence).toBe(0.1);
    });

    it('simulation confidence is 0.8 for valid plan', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      const step: ExecutionStep = { order: 1, title: 'Step', description: 'Execute', connectorType: 'cicd', payload: {}, status: 'draft', rollbackStep: { order: 0, title: 'Undo', description: 'Undo', connectorType: 'cicd', payload: {}, status: 'draft' } };
      const plan = engine.createExecutionPlan('Valid Plan', [step], 'pol-001');
      plan.rollbackStrategy = 'Revert';
      plan.expectedOutcome = 'Success';
      const sim = engine.simulateExecution(plan.id);
      expect(sim).not.toBeNull();
      expect(sim!.confidence).toBe(0.8);
    });

    it('simulation records audit event', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      const step: ExecutionStep = { order: 1, title: 'Step', description: 'Execute', connectorType: 'notification', payload: {}, status: 'draft', rollbackStep: { order: 0, title: 'Undo', description: 'Undo', connectorType: 'notification', payload: {}, status: 'draft' } };
      const plan = engine.createExecutionPlan('Audit Plan', [step], 'pol-001');
      plan.rollbackStrategy = 'Undo';
      plan.expectedOutcome = 'Done';
      engine.simulateExecution(plan.id);
      const trail = engine.getRecentAuditTrail(10);
      expect(trail.some(r => r.eventType === 'simulation_ran')).toBe(true);
    });

    it('getSimulationResults returns all simulations', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      const step: ExecutionStep = { order: 1, title: 'Step', description: 'Execute', connectorType: 'email', payload: {}, status: 'draft', rollbackStep: { order: 0, title: 'Undo', description: 'Undo', connectorType: 'email', payload: {}, status: 'draft' } };
      const plan = engine.createExecutionPlan('Sim 1', [step], 'pol-001');
      const plan2 = engine.createExecutionPlan('Sim 2', [step], 'pol-001');
      plan.rollbackStrategy = 'Revert'; plan.expectedOutcome = 'Done';
      plan2.rollbackStrategy = 'Revert'; plan2.expectedOutcome = 'Done';
      engine.simulateExecution(plan.id);
      engine.simulateExecution(plan2.id);
      expect(engine.getSimulationResults().length).toBe(2);
    });
  });

  describe('Autonomous Briefing', () => {

    it('buildAutonomousBriefing returns complete section with all fields', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.registerPolicy(SAMPLE_POLICY_PROHIBITED);
      engine.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);

      const step: ExecutionStep = { order: 1, title: 'Step', description: 'Execute', connectorType: 'email', payload: {}, status: 'draft', rollbackStep: { order: 0, title: 'Undo', description: 'Undo', connectorType: 'email', payload: {}, status: 'draft' } };
      const plan = engine.createExecutionPlan('Briefing Plan', [step], 'pol-001');
      plan.rollbackStrategy = 'Revert'; plan.expectedOutcome = 'Done';
      engine.simulateExecution(plan.id);

      const briefing = engine.buildAutonomousBriefing();
      expect(briefing.policySummary).toBeDefined();
      expect(briefing.pendingApprovals).toBeDefined();
      expect(briefing.pendingExecutions).toBeDefined();
      expect(briefing.recentAuditTrail).toBeDefined();
      expect(briefing.simulationResults).toBeDefined();
      expect(briefing.policyCompliance).toBeGreaterThanOrEqual(0);
      expect(briefing.generatedAt).toBeGreaterThan(0);
    });

    it('policy summary reflects registered policies', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.registerPolicy(SAMPLE_POLICY_PROHIBITED);
      engine.registerPolicy({ ...SAMPLE_POLICY_ALLOWABLE, id: 'pol-003', status: 'superseded' });

      const briefing = engine.buildAutonomousBriefing();
      expect(briefing.policySummary.totalPolicies).toBe(3);
      expect(briefing.policySummary.activePolicies).toBe(2);
      expect(briefing.policySummary.supersededPolicies).toBe(1);
    });

    it('briefing includes pending approvals', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);

      const briefing = engine.buildAutonomousBriefing();
      expect(briefing.pendingApprovals.length).toBe(1);
      expect(briefing.pendingApprovals[0].id).toBe('req-001');
    });

    it('delegation chain is recorded in approval request', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      const req: ApprovalRequest = {
        ...SAMPLE_APPROVAL_REQUEST,
        delegationChain: ['team-lead', 'department-head'],
      };
      engine.submitApprovalRequest(req);

      const briefing = engine.buildAutonomousBriefing();
      expect(briefing.pendingApprovals[0].delegationChain).toContain('team-lead');
      expect(briefing.pendingApprovals[0].delegationChain).toContain('department-head');
    });

    it('rollback strategy recorded in execution plan extends to package', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);
      engine.approve('req-001', 'exec-director');

      const step: ExecutionStep = { order: 1, title: 'Deploy', description: 'Deploy to prod', connectorType: 'cicd', payload: {}, status: 'draft', rollbackStep: { order: 0, title: 'Rollback', description: 'Redeploy previous version', connectorType: 'cicd', payload: { version: 'prev' }, status: 'draft' } };
      const plan = engine.createExecutionPlan('Deploy Plan', [step], 'pol-001');
      plan.rollbackStrategy = 'Redeploy previous stable release';
      plan.expectedOutcome = 'Production updated to v2';

      const pkg = engine.generateExecutionPackage(plan.id, 'pol-001', 'req-001');
      expect(pkg).not.toBeNull();
      expect(pkg!.rollbackStrategy).toBe('Redeploy previous stable release');
    });

    it('policy compliance score is computed correctly', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.registerPolicy({ ...SAMPLE_POLICY_ALLOWABLE, id: 'pol-003', status: 'superseded' });

      const briefing = engine.buildAutonomousBriefing();
      expect(briefing.policyCompliance).toBeCloseTo(0.5);
    });

    it('policy compliance is 1 when all policies active', () => {
      const engine = new AutonomousEnterpriseEngine();
      engine.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      engine.registerPolicy(SAMPLE_POLICY_PROHIBITED);

      const briefing = engine.buildAutonomousBriefing();
      expect(briefing.policyCompliance).toBe(1);
    });
  });

  describe('PortfolioEngine Integration', () => {

    it('PortfolioBriefing includes autonomousEnterprise section', () => {
      const workforce = new WorkforcePlatformImpl();
      deployAllOffices(workforce);
      const eis = new ExecutiveIntelligence(workforce);
      const portfolio = new PortfolioEngine(eis);
      portfolio.registerProducts(ALL_PROFILES);

      portfolio.registerPolicy(SAMPLE_POLICY_ALLOWABLE);

      const briefing = portfolio.refreshPortfolioBriefing();
      expect(briefing.autonomousEnterprise).toBeDefined();
      expect(briefing.autonomousEnterprise.policySummary).toBeDefined();
      expect(briefing.autonomousEnterprise.policySummary.activePolicies).toBe(1);
      expect(briefing.autonomousEnterprise.generatedAt).toBeGreaterThan(0);
    });

    it('PortfolioEngine.registerPolicy delegates correctly', () => {
      const workforce = new WorkforcePlatformImpl();
      deployAllOffices(workforce);
      const eis = new ExecutiveIntelligence(workforce);
      const portfolio = new PortfolioEngine(eis);
      portfolio.registerProducts(ALL_PROFILES);

      portfolio.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      portfolio.registerPolicy(SAMPLE_POLICY_PROHIBITED);

      const briefing = portfolio.refreshPortfolioBriefing();
      expect(briefing.autonomousEnterprise.policySummary.totalPolicies).toBe(2);
    });

    it('PortfolioEngine.submitApprovalRequest delegates correctly', () => {
      const workforce = new WorkforcePlatformImpl();
      deployAllOffices(workforce);
      const eis = new ExecutiveIntelligence(workforce);
      const portfolio = new PortfolioEngine(eis);
      portfolio.registerProducts(ALL_PROFILES);

      portfolio.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      portfolio.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);

      const briefing = portfolio.refreshPortfolioBriefing();
      expect(briefing.autonomousEnterprise.pendingApprovals.length).toBe(1);
    });

    it('PortfolioEngine.createExecutionPlan delegates correctly', () => {
      const workforce = new WorkforcePlatformImpl();
      deployAllOffices(workforce);
      const eis = new ExecutiveIntelligence(workforce);
      const portfolio = new PortfolioEngine(eis);
      portfolio.registerProducts(ALL_PROFILES);

      portfolio.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      const plan = portfolio.createExecutionPlan('Notify', [
        makeStep(1, 'Compose'),
      ], 'pol-001');

      expect(plan).toBeDefined();
      expect(plan.id).toMatch(/^plan-/);
    });

    it('PortfolioEngine.generateExecutionPackage integrates full flow', () => {
      const workforce = new WorkforcePlatformImpl();
      deployAllOffices(workforce);
      const eis = new ExecutiveIntelligence(workforce);
      const portfolio = new PortfolioEngine(eis);
      portfolio.registerProducts(ALL_PROFILES);

      portfolio.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      portfolio.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);
      portfolio.approveRequest('req-001', 'exec-director');

      const step: ExecutionStep = { order: 1, title: 'Deploy', description: 'Push to prod', connectorType: 'cicd', payload: {}, status: 'draft', rollbackStep: { order: 0, title: 'Rollback', description: 'Rollback deploy', connectorType: 'cicd', payload: {}, status: 'draft' } };
      const plan = portfolio.createExecutionPlan('Deploy', [step], 'pol-001');
      plan.rollbackStrategy = 'Redeploy previous';
      plan.expectedOutcome = 'v2 live';

      const pkg = portfolio.generateExecutionPackage(plan.id, 'pol-001', 'req-001');
      expect(pkg).not.toBeNull();
      expect(pkg!.rollbackStrategy).toBe('Redeploy previous');
    });

    it('approveRequest through portfolio works', () => {
      const workforce = new WorkforcePlatformImpl();
      deployAllOffices(workforce);
      const eis = new ExecutiveIntelligence(workforce);
      const portfolio = new PortfolioEngine(eis);
      portfolio.registerProducts(ALL_PROFILES);

      portfolio.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      portfolio.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);
      const result = portfolio.approveRequest('req-001', 'exec-director');
      expect(result).not.toBeNull();
      expect(result?.status).toBe('approved');
    });

    it('rejectRequest through portfolio works', () => {
      const workforce = new WorkforcePlatformImpl();
      deployAllOffices(workforce);
      const eis = new ExecutiveIntelligence(workforce);
      const portfolio = new PortfolioEngine(eis);
      portfolio.registerProducts(ALL_PROFILES);

      portfolio.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      portfolio.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);
      const result = portfolio.rejectRequest('req-001', 'exec-director', 'Not needed');
      expect(result).not.toBeNull();
      expect(result?.status).toBe('rejected');
    });

    it('simulatePlanExecution through portfolio works', () => {
      const workforce = new WorkforcePlatformImpl();
      deployAllOffices(workforce);
      const eis = new ExecutiveIntelligence(workforce);
      const portfolio = new PortfolioEngine(eis);
      portfolio.registerProducts(ALL_PROFILES);

      portfolio.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      const step: ExecutionStep = { order: 1, title: 'Step', description: 'Execute', connectorType: 'email', payload: {}, status: 'draft', rollbackStep: { order: 0, title: 'Undo', description: 'Undo', connectorType: 'email', payload: {}, status: 'draft' } };
      const plan = portfolio.createExecutionPlan('Sim Plan', [step], 'pol-001');
      plan.rollbackStrategy = 'Undo'; plan.expectedOutcome = 'Done';

      const sim = portfolio.simulatePlanExecution(plan.id);
      expect(sim).not.toBeNull();
      expect(sim!.affectedSystems).toContain('email');
    });

    it('sixth-product extensibility with autonomous enterprise intact', () => {
      const workforce = new WorkforcePlatformImpl();
      deployAllOffices(workforce);
      const eis = new ExecutiveIntelligence(workforce);
      const portfolio = new PortfolioEngine(eis);
      portfolio.registerProducts(ALL_PROFILES);
      portfolio.registerPolicy(SAMPLE_POLICY_ALLOWABLE);

      expect(portfolio.refreshPortfolioBriefing().metadata.productCount).toBe(5);
      expect(portfolio.refreshPortfolioBriefing().autonomousEnterprise.policySummary.activePolicies).toBe(1);

      portfolio.registerProduct({ ...MENWISE360_PROFILE, productId: 'sixth-product', productName: 'Sixth Product' });

      const briefing6 = portfolio.refreshPortfolioBriefing();
      expect(briefing6.metadata.productCount).toBe(6);
      expect(briefing6.autonomousEnterprise.policySummary.activePolicies).toBe(1);
      expect(briefing6.autonomousEnterprise.policySummary).toBeDefined();
    });
  });

  describe('Zero Regression — existing tests still pass', () => {

    it('existing PortfolioEngine.analyze produces correct briefing shape', () => {
      const workforce = new WorkforcePlatformImpl();
      deployAllOffices(workforce);
      const eis = new ExecutiveIntelligence(workforce);
      const portfolio = new PortfolioEngine(eis);
      portfolio.registerProducts(ALL_PROFILES);

      const briefing = portfolio.refreshPortfolioBriefing();
      expect(briefing.generatedAt).toBeGreaterThan(0);
      expect(briefing.portfolioHealth).toBeDefined();
      expect(briefing.productSummaries.length).toBe(5);
      expect(briefing.allocation).toBeDefined();
      expect(briefing.coordination).toBeDefined();
      expect(briefing.learning).toBeDefined();
      expect(briefing.strategicPlanning).toBeDefined();
      expect(briefing.executiveIntelligence).toBeDefined();
      expect(briefing.autonomousEnterprise).toBeDefined();
      expect(briefing.metadata.productCount).toBe(5);
    });

    it('autonomousEngine does not interfere with product registrations', () => {
      const workforce = new WorkforcePlatformImpl();
      deployAllOffices(workforce);
      const eis = new ExecutiveIntelligence(workforce);
      const portfolio = new PortfolioEngine(eis);
      portfolio.registerProducts(ALL_PROFILES);

      expect(portfolio.getProductCount()).toBe(5);

      portfolio.registerPolicy(SAMPLE_POLICY_ALLOWABLE);
      portfolio.submitApprovalRequest(SAMPLE_APPROVAL_REQUEST);

      const briefing = portfolio.refreshPortfolioBriefing();
      expect(briefing.metadata.productCount).toBe(5);
      expect(briefing.productSummaries.length).toBe(5);
    });
  });
});
