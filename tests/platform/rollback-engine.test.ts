import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RollbackPlanner } from '../../lib/platform/execution/rollback-engine/rollback-planner';
import { RollbackCoordinator, SimulationResult } from '../../lib/platform/execution/rollback-engine/rollback-coordinator';
import { RollbackValidator, RollbackValidationResult } from '../../lib/platform/execution/rollback-engine/rollback-validator';
import { RollbackAudit } from '../../lib/platform/execution/rollback-engine/rollback-audit';
import { CompensationPlanGenerator } from '../../lib/platform/execution/rollback-engine/compensation-plan';
import { CompensationChain, CompensationStep, RollbackAuditEvent } from '../../lib/platform/execution/rollback-engine/types';
import { RollbackPlan, RollbackExecutor, RollbackScope, RollbackStrategy } from '../../lib/platform/execution/rollback-contract';
import { ExecutionRequest } from '../../lib/platform/execution/execution-request';
import { QueueCandidate } from '../../lib/platform/queue/types';
import { GovernanceDecision } from '../../lib/platform/governance/types';
import { ConnectorRuntimeCapabilities } from '../../lib/platform/execution/capabilities';

// ============================================================
// Test Data
// ============================================================

const mockDecision: GovernanceDecision = {
  decisionId: 'dec-1', requestId: 'req-1', governanceVersion: '1.0.0',
  policyVersion: '1.0.0', approvalRequired: true, approvalLevel: 'STANDARD',
  blockingReasons: [], warnings: [], riskSummary: { level: 'LOW', factors: [] },
  policyResults: [], executionEligible: false, queueEligible: true,
  reviewerInstructions: 'Review',
};

const mockCandidate: QueueCandidate = {
  queueId: 'q-1', connectorId: 'google-drive', operation: 'upload',
  previewId: 'p-1', decisionId: 'dec-1', reviewPackageId: 'pkg-1',
  governanceVersion: '1.0.0', policyVersion: '1.0.0',
  executionManifest: {
    intendedOperation: 'upload', requiredScopes: ['scope1'],
    requiredApprovals: ['STANDARD'], governanceDecisionId: 'dec-1',
    blockingConditions: [], validationSummary: 'Test',
    resourceSummary: { sourceId: null, targetId: 't-1', resourceType: 'file' },
    executionPrerequisites: [],
  },
  idempotencyToken: 'token-1',
  replayProtection: { duplicateDetectionKey: 'dup-1', replayWindowMetadata: { windowStart: 'S', windowEnd: 'E' }, conflictIdentity: 'c-1', queueUniqueness: 'u-1' },
  dependencyGraph: { dependsOn: [], executionOrder: 1 },
  auditReference: 'audit-1', queueEligible: true, executionEligible: false,
  executionAuthorized: false,
  metadata: { generatedAt: 'now', version: '1.0.0' },
};

const s3bCapabilities: ConnectorRuntimeCapabilities = {
  prepare: true, preflight: true, execute: true, verify: true,
  rollback: true, audit: true, stage: '3B',
  providerMutationAllowed: false, networkMutationAllowed: false,
};

const mockExecutionRequest: ExecutionRequest = {
  executionId: 'exe-1', queueId: 'q-1', connectorId: 'google-drive',
  operation: 'upload', candidate: mockCandidate, decision: mockDecision,
  capabilities: s3bCapabilities,
  idempotencyToken: 'token-1', planHash: 'plan-abc123',
  requestedAt: '2026-01-01T00:00:00Z',
};

// ============================================================
// CompensationPlanGenerator
// ============================================================

describe('CompensationPlanGenerator', () => {
  let generator: CompensationPlanGenerator;

  beforeEach(() => { generator = new CompensationPlanGenerator(); });

  const samplePlan: RollbackPlan = {
    rollbackId: 'rb-1', executionId: 'exe-1', connectorId: 'google-drive',
    operation: 'upload', scope: 'FULL', strategy: 'REVERSE_ORDER',
    steps: [
      { stepIndex: 0, action: 'upload', compensatingOperation: 'delete', parameters: { fileId: 'f1' }, reversible: true },
      { stepIndex: 1, action: 'rename', compensatingOperation: 'rename-back', parameters: { fileId: 'f1' }, reversible: true },
      { stepIndex: 2, action: 'delete', compensatingOperation: 'restore', parameters: { fileId: 'f1' }, reversible: false },
    ],
    plannedAt: '2026-01-01T00:00:00Z', planHash: 'plan-hash',
  };

  it('generates a compensation chain from a rollback plan', () => {
    const chain = generator.generate(samplePlan);
    expect(chain.chainId).toBe('chain-rb-1');
    expect(chain.executionId).toBe('exe-1');
    expect(chain.steps).toHaveLength(3);
    expect(chain.chainHash).toBeDefined();
  });

  it('reverses steps for REVERSE_ORDER strategy', () => {
    const chain = generator.generate(samplePlan);
    expect(chain.strategy).toBe('REVERSE_ORDER');
    expect(chain.steps[0].originalAction).toBe('delete');
    expect(chain.steps[1].originalAction).toBe('rename');
    expect(chain.steps[2].originalAction).toBe('upload');
  });

  it('generates a deterministic chain hash for identical plans', () => {
    const chain1 = generator.generate(samplePlan);
    const chain2 = generator.generate(samplePlan);
    expect(chain1.chainHash).toBe(chain2.chainHash);
  });

  it('generates different hashes for different plans', () => {
    const modified = { ...samplePlan, rollbackId: 'rb-different', steps: samplePlan.steps.slice() };
    const chain1 = generator.generate(samplePlan);
    const chain2 = generator.generate(modified);
    expect(chain1.chainHash).not.toBe(chain2.chainHash);
  });

  it('simulates execution of a compensation chain', () => {
    const chain = generator.generate(samplePlan);
    const executed = generator.simulateExecute(chain);
    expect(executed.completedSteps).toBeGreaterThan(0);
    const reversibleSteps = executed.steps.filter((s) => s.reversible);
    const nonReversible = executed.steps.filter((s) => !s.reversible);
    expect(reversibleSteps.every((s) => s.status === 'COMPLETED')).toBe(true);
    expect(nonReversible.every((s) => s.status === 'FAILED')).toBe(true);
  });

  it('identifies reversible and non-reversible steps', () => {
    const chain = generator.generate(samplePlan);
    expect(generator.getReversibleSteps(chain)).toHaveLength(2);
    expect(generator.getNonReversibleSteps(chain)).toHaveLength(1);
  });
});

// ============================================================
// RollbackValidator
// ============================================================

describe('RollbackValidator', () => {
  let validator: RollbackValidator;

  beforeEach(() => { validator = new RollbackValidator(); });

  const validPlan: RollbackPlan = {
    rollbackId: 'rb-1', executionId: 'exe-1', connectorId: 'drive',
    operation: 'upload', scope: 'FULL', strategy: 'REVERSE_ORDER',
    steps: [{ stepIndex: 0, action: 'upload', compensatingOperation: 'delete', parameters: {}, reversible: true }],
    plannedAt: '2026-01-01T00:00:00Z', planHash: 'hash',
  };

  it('validates a well-formed rollback plan', () => {
    const result = validator.validatePlan(validPlan);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects plan with missing rollbackId', () => {
    const result = validator.validatePlan({ ...validPlan, rollbackId: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.startsWith('MISSING_ROLLBACK_ID'))).toBe(true);
  });

  it('rejects plan with missing executionId', () => {
    const result = validator.validatePlan({ ...validPlan, executionId: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.startsWith('MISSING_EXECUTION_ID'))).toBe(true);
  });

  it('rejects plan with missing connectorId', () => {
    const result = validator.validatePlan({ ...validPlan, connectorId: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.startsWith('MISSING_CONNECTOR_ID'))).toBe(true);
  });

  it('rejects plan with missing planHash', () => {
    const result = validator.validatePlan({ ...validPlan, planHash: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.startsWith('MISSING_PLAN_HASH'))).toBe(true);
  });

  it('warns on NONE scope', () => {
    const result = validator.validatePlan({ ...validPlan, scope: 'NONE' });
    expect(result.warnings.some(w => w.startsWith('SCOPE_IS_NONE'))).toBe(true);
  });

  it('warns on empty steps', () => {
    const result = validator.validatePlan({ ...validPlan, steps: [] });
    expect(result.warnings.some(w => w.startsWith('NO_STEPS'))).toBe(true);
  });

  it('rejects steps with no compensating operation', () => {
    const result = validator.validatePlan({
      ...validPlan,
      steps: [{ stepIndex: 0, action: 'upload', compensatingOperation: '', parameters: {}, reversible: true }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('MISSING_COMPENSATING_OPERATION');
  });

  it('validates a compensation chain', () => {
    const chain: CompensationChain = {
      chainId: 'chain-1', executionId: 'exe-1', strategy: 'REVERSE_ORDER',
      steps: [{ stepIndex: 0, originalAction: 'upload', compensatingAction: 'delete', parameters: {}, reversible: true, status: 'COMPLETED' }],
      generatedAt: 'now', chainHash: 'hash', totalSteps: 1, completedSteps: 1,
    };
    const result = validator.validateChain(chain);
    expect(result.valid).toBe(true);
  });

  it('rejects chain where completedSteps exceeds totalSteps', () => {
    const chain: CompensationChain = {
      chainId: 'chain-1', executionId: 'exe-1', strategy: 'REVERSE_ORDER',
      steps: [{ stepIndex: 0, originalAction: 'upload', compensatingAction: 'delete', parameters: {}, reversible: true, status: 'COMPLETED' }],
      generatedAt: 'now', chainHash: 'hash', totalSteps: 1, completedSteps: 2,
    };
    const result = validator.validateChain(chain);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.startsWith('INVALID_COMPLETION'))).toBe(true);
  });

  it('validates individual compensation steps', () => {
    const step: CompensationStep = { stepIndex: 0, originalAction: 'upload', compensatingAction: 'delete', parameters: {}, reversible: true, status: 'PENDING' };
    expect(validator.validateStep(step).valid).toBe(true);
  });

  it('rejects step with missing compensating action', () => {
    const step: CompensationStep = { stepIndex: 0, originalAction: 'upload', compensatingAction: '', parameters: {}, reversible: true, status: 'PENDING' };
    expect(validator.validateStep(step).valid).toBe(false);
  });
});

// ============================================================
// RollbackAudit
// ============================================================

describe('RollbackAudit', () => {
  let audit: RollbackAudit;

  beforeEach(() => { audit = new RollbackAudit(); });

  const mockChain: CompensationChain = {
    chainId: 'chain-1', executionId: 'exe-1', strategy: 'REVERSE_ORDER',
    steps: [], generatedAt: 'now', chainHash: 'hash', totalSteps: 0, completedSteps: 0,
  };

  it('records plan generated event', () => {
    const event = audit.recordPlanGenerated('tx-1', mockChain, 'Plan created');
    expect(event.eventType).toBe('PLAN_GENERATED');
    expect(event.transactionId).toBe('tx-1');
  });

  it('records compensation started event', () => {
    const event = audit.recordCompensationStarted('tx-1', 'Starting');
    expect(event.eventType).toBe('COMPENSATION_STARTED');
  });

  it('records step executed event with step index', () => {
    const event = audit.recordStepExecuted('tx-1', 0, 'Step 0 completed');
    expect(event.eventType).toBe('COMPENSATION_STEP_EXECUTED');
    expect(event.stepIndex).toBe(0);
  });

  it('records compensation completed event', () => {
    audit.recordCompensationStarted('tx-1', 'Start');
    audit.recordCompensationCompleted('tx-1', 'All done');
    const events = audit.getEvents();
    expect(events).toHaveLength(2);
    expect(events[1].eventType).toBe('COMPENSATION_COMPLETED');
  });

  it('records rollback failed event', () => {
    const event = audit.recordRollbackFailed('tx-1', 2, 'Step 2 failed');
    expect(event.eventType).toBe('ROLLBACK_FAILED');
    expect(event.stepIndex).toBe(2);
  });

  it('records rollback completed event', () => {
    const event = audit.recordRollbackCompleted('tx-1', 'Rollback done');
    expect(event.eventType).toBe('ROLLBACK_COMPLETED');
  });

  it('clears all events', () => {
    audit.recordPlanGenerated('tx-1', mockChain, 'test');
    audit.clear();
    expect(audit.getEvents()).toHaveLength(0);
  });
});

// ============================================================
// RollbackPlanner
// ============================================================

describe('RollbackPlanner', () => {
  it('generates a synthetic plan when no executor is configured', async () => {
    const planner = new RollbackPlanner();
    const result = await planner.plan(mockExecutionRequest, mockCandidate);
    expect(result.plan.rollbackId).toBeDefined();
    expect(result.plan.steps).toHaveLength(1);
    expect(result.plan.planHash).toBeDefined();
    expect(result.warnings).toContain('No rollback executor configured — generating synthetic plan');
  });

  it('uses the executor when available and supports rollback', async () => {
    const executor: RollbackExecutor = {
      supportsRollback: true,
      rollbackStrategies: ['REVERSE_ORDER'],
      plan: async () => ({
        rollbackId: 'rb-exec', executionId: 'exe-1', connectorId: 'drive',
        operation: 'upload', scope: 'FULL' as RollbackScope, strategy: 'REVERSE_ORDER' as RollbackStrategy,
        steps: [{ stepIndex: 0, action: 'upload', compensatingOperation: 'delete', parameters: {}, reversible: true }],
        plannedAt: '2026-01-01T00:00:00Z', planHash: 'exec-hash',
      }),
    };
    const planner = new RollbackPlanner(executor);
    const result = await planner.plan(mockExecutionRequest, mockCandidate);
    expect(result.plan.rollbackId).toBe('rb-exec');
    expect(result.plan.planHash).toBeDefined();
    expect(result.plan.planHash).not.toBe('');
  });

  it('reports supportsRollback correctly', () => {
    expect(new RollbackPlanner().supportsRollback()).toBe(false);
    const executor: RollbackExecutor = {
      supportsRollback: true, rollbackStrategies: [],
      plan: async () => ({ rollbackId: '', executionId: '', connectorId: '', operation: '', scope: 'FULL', strategy: 'REVERSE_ORDER', steps: [], plannedAt: '', planHash: '' }),
    };
    expect(new RollbackPlanner(executor).supportsRollback()).toBe(true);
  });

  it('generates deterministic plan hashes for identical inputs', async () => {
    const planner = new RollbackPlanner();
    const result1 = await planner.plan(mockExecutionRequest, mockCandidate);
    const result2 = await planner.plan(mockExecutionRequest, mockCandidate);
    expect(result1.plan.planHash).toBe(result2.plan.planHash);
  });

  it('generates a compensation chain alongside the plan', async () => {
    const planner = new RollbackPlanner();
    const result = await planner.plan(mockExecutionRequest, mockCandidate);
    expect(result.chain.chainId).toBeDefined();
    expect(result.chain.steps.length).toBeGreaterThan(0);
  });
});

// ============================================================
// RollbackCoordinator
// ============================================================

describe('RollbackCoordinator', () => {
  it('simulates a full rollback successfully', async () => {
    const planner = new RollbackPlanner();
    const coordinator = new RollbackCoordinator(planner);
    const result = await coordinator.simulateRollback(mockExecutionRequest, mockCandidate);
    expect(result.outcome).toBe('SIMULATION_SUCCEEDED');
    expect(result.transaction.state).toBe('TRANSACTION_COMPLETED');
    expect(result.auditEvents.length).toBeGreaterThan(0);
  });

  it('generates audit events for the full rollback lifecycle', async () => {
    const planner = new RollbackPlanner();
    const coordinator = new RollbackCoordinator(planner);
    const result = await coordinator.simulateRollback(mockExecutionRequest, mockCandidate);
    const eventTypes = result.auditEvents.map((e) => e.split(':')[0]);
    expect(eventTypes).toContain('PLAN_GENERATED');
    expect(eventTypes).toContain('COMPENSATION_STARTED');
    expect(eventTypes).toContain('COMPENSATION_COMPLETED');
    expect(eventTypes).toContain('ROLLBACK_COMPLETED');
  });

  it('fails simulation when plan validation fails', async () => {
    const invalidRequest = { ...mockExecutionRequest, executionId: '' };
    const planner = new RollbackPlanner();
    const coordinator = new RollbackCoordinator(planner);
    const result = await coordinator.simulateRollback(invalidRequest, mockCandidate);
    expect(result.outcome).toBe('SIMULATION_FAILED');
    expect(result.transaction.state).toBe('TRANSACTION_FAILED');
  });

  it('produces deterministic results for identical inputs', async () => {
    const planner = new RollbackPlanner();
    const coordinator1 = new RollbackCoordinator(planner);
    const coordinator2 = new RollbackCoordinator(planner);
    const result1 = await coordinator1.simulateRollback(mockExecutionRequest, mockCandidate);
    const result2 = await coordinator2.simulateRollback(mockExecutionRequest, mockCandidate);
    expect(result1.outcome).toBe(result2.outcome);
    expect(result1.auditEvents).toEqual(result2.auditEvents);
  });

  it('returns warnings for non-reversible steps', async () => {
    const executor: RollbackExecutor = {
      supportsRollback: true, rollbackStrategies: ['REVERSE_ORDER'],
      plan: async () => ({
        rollbackId: 'rb-1', executionId: 'exe-1', connectorId: 'drive',
        operation: 'upload', scope: 'FULL', strategy: 'REVERSE_ORDER',
        steps: [
          { stepIndex: 0, action: 'upload', compensatingOperation: 'delete', parameters: {}, reversible: true },
          { stepIndex: 1, action: 'delete', compensatingOperation: 'restore', parameters: {}, reversible: false },
        ],
        plannedAt: 'now', planHash: 'hash',
      }),
    };
    const planner = new RollbackPlanner(executor);
    const coordinator = new RollbackCoordinator(planner);
    const result = await coordinator.simulateRollback(mockExecutionRequest, mockCandidate);
    expect(result.warnings.some((w) => w.includes('non-reversible'))).toBe(true);
  });

  it('provides access to the audit log', () => {
    const planner = new RollbackPlanner();
    const coordinator = new RollbackCoordinator(planner);
    expect(coordinator.getAudit()).toBeInstanceOf(RollbackAudit);
  });

  it('provides access to the validator', () => {
    const planner = new RollbackPlanner();
    const coordinator = new RollbackCoordinator(planner);
    expect(coordinator.getValidator()).toBeInstanceOf(RollbackValidator);
  });

  it('no provider mutation is possible through the rollback engine', () => {
    const planner = new RollbackPlanner();
    const coordinator = new RollbackCoordinator(planner);
    expect(typeof coordinator.simulateRollback).toBe('function');
    expect((coordinator as any).executeRollback).toBeUndefined();
    expect((coordinator as any).callApi).toBeUndefined();
    expect((coordinator as any).restore).toBeUndefined();
  });
});

// ============================================================
// Integrated Flow
// ============================================================

describe('Rollback Engine Integration', () => {
  it('full cycle: plan → validate → generate chain → simulate → audit', async () => {
    const planner = new RollbackPlanner();
    const coordinator = new RollbackCoordinator(planner);
    const validator = coordinator.getValidator();
    const audit = coordinator.getAudit();

    const plannerResult = await planner.plan(mockExecutionRequest, mockCandidate);
    expect(validator.validatePlan(plannerResult.plan).valid).toBe(true);
    expect(validator.validateChain(plannerResult.chain).valid).toBe(true);

    const simResult = await coordinator.simulateRollback(mockExecutionRequest, mockCandidate);
    expect(simResult.outcome).toBe('SIMULATION_SUCCEEDED');
    expect(simResult.transaction.chain.completedSteps).toBeGreaterThanOrEqual(0);
    expect(simResult.auditEvents.length).toBeGreaterThanOrEqual(4);
  });

  it('handles empty rollback executor gracefully', async () => {
    const executor: RollbackExecutor = {
      supportsRollback: true, rollbackStrategies: [],
      plan: async () => ({
        rollbackId: 'rb-empty', executionId: 'exe-1', connectorId: 'drive',
        operation: 'upload', scope: 'FULL', strategy: 'REVERSE_ORDER',
        steps: [],
        plannedAt: 'now', planHash: 'hash',
      }),
    };
    const planner = new RollbackPlanner(executor);
    const coordinator = new RollbackCoordinator(planner);
    const result = await coordinator.simulateRollback(mockExecutionRequest, mockCandidate);
    expect(result.outcome).toBe('SIMULATION_SUCCEEDED');
    expect(result.transaction.chain.steps).toHaveLength(0);
  });
});
