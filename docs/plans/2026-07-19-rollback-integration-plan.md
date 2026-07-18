# Stage 3C.6 — Rollback Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate rollback as a first-class certified execution lifecycle by creating `RollbackExecutorImpl`, `RollbackExecutionPhase`, and replacing all direct `adapter.rollback()` calls.

**Architecture:** Pipeline (state) → RollbackExecutionPhase (orchestration) → RollbackExecutorImpl (execution) → Adapter (provider primitives). The executor uses the existing rollback engine for planning/validation/audit and the operational hardening components for retry/telemetry.

**Tech Stack:** TypeScript, Vitest, existing rollback-engine components, existing operational-hardening components

**Design Doc:** `docs/plans/2026-07-19-rollback-integration-design.md`

---

### Task 1: Extend rollback-contract.ts with RollbackResult types

**Files:**
- Modify: `lib/platform/execution/rollback-contract.ts:29-33`

**Step 1: Read current file to verify exact content**

Already read. Current file ends with the `RollbackExecutor` interface at lines 29-33.

**Step 2: Add RollbackResult and RollbackStepResult types plus execute method**

Add after the `RollbackExecutor` interface:

```typescript
export type RollbackStatus = 'COMPLETED' | 'PARTIAL' | 'FAILED';

export interface RollbackStepResult {
  stepIndex: number;
  status: 'COMPLETED' | 'FAILED' | 'SKIPPED';
  error?: string;
  telemetrySpanId?: string;
}

export interface RollbackResult {
  rollbackId: string;
  executionId: string;
  status: RollbackStatus;
  stepsCompleted: number;
  stepsTotal: number;
  completedAt: string;
  failureReason?: string;
  stepResults: RollbackStepResult[];
}
```

**Step 3: Add execute method to RollbackExecutor interface**

```typescript
execute?(
  request: ExecutionRequest,
  candidate: QueueCandidate,
  plan: RollbackPlan,
): Promise<RollbackResult>;
```

**Step 4: Run build to verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Run existing tests to verify no regression**

Run: `npx vitest run tests/platform/rollback-engine.test.ts tests/platform/execution-interfaces.test.ts`
Expected: All passing

---

### Task 2: Create RollbackExecutorImpl

**Files:**
- Create: `lib/platform/execution/rollback-executor-impl.ts`
- Test: `tests/platform/rollback-executor-impl.test.ts`

**Step 1: Write the implementation file**

```typescript
import { ExecutionRequest } from './execution-request';
import { QueueCandidate } from '../queue/types';
import {
  RollbackExecutor,
  RollbackPlan,
  RollbackResult,
  RollbackStepResult,
  RollbackStrategy,
} from './rollback-contract';
import { ConnectorExecutionAdapter, ProviderRollbackResult } from './connector-execution-adapter';
import { RollbackPlanner } from './rollback-engine/rollback-planner';
import { RollbackValidator } from './rollback-engine/rollback-validator';
import { RollbackAudit } from './rollback-engine/rollback-audit';
import { CompensationPlanGenerator } from './rollback-engine/compensation-plan';
import { TelemetryEmitter } from './operational-hardening/telemetry-emitter';
import { RetryPolicy } from './operational-hardening/retry-policy';
import { VerificationProvider } from './provider-contracts/verification-provider';
import { ProviderErrorInfo } from './provider-contracts/provider-error';

export interface RollbackExecutorConfig {
  adapter: ConnectorExecutionAdapter;
  planner?: RollbackPlanner;
  validator?: RollbackValidator;
  audit?: RollbackAudit;
  telemetryEmitter?: TelemetryEmitter;
  retryPolicy?: RetryPolicy;
  verificationProvider?: VerificationProvider;
}

export class RollbackExecutorImpl implements RollbackExecutor {
  readonly supportsRollback = true;
  readonly rollbackStrategies: RollbackStrategy[] = ['REVERSE_ORDER', 'COMPENSATING'];

  private adapter: ConnectorExecutionAdapter;
  private planner: RollbackPlanner;
  private validator: RollbackValidator;
  private audit: RollbackAudit;
  private telemetryEmitter: TelemetryEmitter;
  private retryPolicy: RetryPolicy;
  private verificationProvider?: VerificationProvider;

  constructor(config: RollbackExecutorConfig) {
    this.adapter = config.adapter;
    this.planner = config.planner ?? new RollbackPlanner();
    this.validator = config.validator ?? new RollbackValidator();
    this.audit = config.audit ?? new RollbackAudit();
    this.telemetryEmitter = config.telemetryEmitter ?? new TelemetryEmitter();
    this.retryPolicy = config.retryPolicy ?? new RetryPolicy({ maxRetries: 2 });
    this.verificationProvider = config.verificationProvider;
  }

  async plan(request: ExecutionRequest, candidate: QueueCandidate): Promise<RollbackPlan> {
    const result = await this.planner.plan(request, candidate);
    return result.plan;
  }

  async execute(
    request: ExecutionRequest,
    candidate: QueueCandidate,
    plan: RollbackPlan,
  ): Promise<RollbackResult> {
    const transactionId = `rb-tx-${request.executionId}`;
    const correlationId = `corr-${request.executionId}`;

    this.audit.clear();
    this.audit.recordPlanGenerated(transactionId, {
      chainId: `chain-${plan.rollbackId}`,
      executionId: request.executionId,
      strategy: plan.strategy,
      steps: [],
      generatedAt: new Date().toISOString(),
      chainHash: plan.planHash,
      totalSteps: plan.steps.length,
      completedSteps: 0,
    }, 'Executor plan generated');

    const planValidation = this.validator.validatePlan(plan);
    if (!planValidation.valid) {
      this.audit.recordRollbackFailed(transactionId, null, `Plan validation failed: ${planValidation.errors.join('; ')}`);
      this.emitTelemetry('ERROR', 'ROLLBACK', correlationId, request, 'Rollback plan validation failed', { errors: planValidation.errors });
      return {
        rollbackId: plan.rollbackId,
        executionId: request.executionId,
        status: 'FAILED',
        stepsCompleted: 0,
        stepsTotal: plan.steps.length,
        completedAt: new Date().toISOString(),
        failureReason: `Plan validation failed: ${planValidation.errors.join('; ')}`,
        stepResults: [],
      };
    }

    this.audit.recordCompensationStarted(transactionId, `Rollback execution started for ${plan.strategy} strategy`);
    this.emitTelemetry('INFO', 'ROLLBACK', correlationId, request, 'Rollback execution started', { strategy: plan.strategy, steps: plan.steps.length });

    const stepResults: RollbackStepResult[] = [];
    let stepsCompleted = 0;
    let overallStatus: RollbackResult['status'] = 'COMPLETED';
    let failureReason: string | undefined;

    for (const step of plan.steps) {
      const stepIndex = step.stepIndex;
      let stepResult: RollbackStepResult = { stepIndex, status: 'FAILED' };

      try {
        const cause = new Error(`Rollback: ${step.compensatingOperation}`);
        const adapterResult = await this.executeWithRetry(
          () => this.adapter.rollback(request, cause, candidate),
          correlationId,
          request,
        );

        if (adapterResult.rollbackApplied) {
          stepResult = { stepIndex, status: 'COMPLETED', telemetrySpanId: `rb-step-${stepIndex}` };
          stepsCompleted++;
          this.audit.recordStepExecuted(transactionId, stepIndex, `Step ${stepIndex}: ${step.compensatingOperation} completed`);
          this.emitTelemetry('INFO', 'ROLLBACK', correlationId, request, `Rollback step ${stepIndex} completed`, { compensatingOperation: step.compensatingOperation });
        } else {
          stepResult = { stepIndex, status: 'FAILED', error: 'Adapter rollback returned rollbackApplied=false' };
          this.audit.recordRollbackFailed(transactionId, stepIndex, `Step ${stepIndex}: ${step.compensatingOperation} not applied`);
          this.emitTelemetry('WARN', 'ROLLBACK', correlationId, request, `Rollback step ${stepIndex} not applied`, { compensatingOperation: step.compensatingOperation });
        }
      } catch (e) {
        stepResult = { stepIndex, status: 'FAILED', error: (e as Error).message };
        this.audit.recordRollbackFailed(transactionId, stepIndex, `Step ${stepIndex} failed: ${(e as Error).message}`);
        this.emitTelemetry('ERROR', 'ROLLBACK', correlationId, request, `Rollback step ${stepIndex} failed`, { error: (e as Error).message });
      }

      stepResults.push(stepResult);
    }

    if (stepsCompleted === plan.steps.length) {
      overallStatus = 'COMPLETED';
      this.audit.recordCompensationCompleted(transactionId, `All ${plan.steps.length} steps completed`);
      this.audit.recordRollbackCompleted(transactionId, 'Rollback completed successfully');
      this.emitTelemetry('INFO', 'ROLLBACK', correlationId, request, 'Rollback completed successfully', { stepsCompleted });
    } else if (stepsCompleted > 0) {
      overallStatus = 'PARTIAL';
      failureReason = `${plan.steps.length - stepsCompleted} of ${plan.steps.length} steps failed`;
      this.audit.recordRollbackFailed(transactionId, null, failureReason);
      this.emitTelemetry('WARN', 'ROLLBACK', correlationId, request, 'Rollback partially completed', { stepsCompleted, totalSteps: plan.steps.length, failureReason });
    } else {
      overallStatus = 'FAILED';
      failureReason = 'All rollback steps failed';
      this.audit.recordRollbackFailed(transactionId, null, failureReason);
      this.emitTelemetry('ERROR', 'ROLLBACK', correlationId, request, 'Rollback failed', { failureReason });
    }

    return {
      rollbackId: plan.rollbackId,
      executionId: request.executionId,
      status: overallStatus,
      stepsCompleted,
      stepsTotal: plan.steps.length,
      completedAt: new Date().toISOString(),
      failureReason,
      stepResults,
    };
  }

  getAudit(): RollbackAudit {
    return this.audit;
  }

  getValidator(): RollbackValidator {
    return this.validator;
  }

  private async executeWithRetry(
    fn: () => Promise<ProviderRollbackResult>,
    correlationId: string,
    request: ExecutionRequest,
  ): Promise<ProviderRollbackResult> {
    let attempt = 0;
    while (true) {
      try {
        return await fn();
      } catch (e) {
        const errorInfo: ProviderErrorInfo = {
          code: 'NETWORK_UNAVAILABLE',
          category: 'TRANSIENT',
          retryable: true,
          statusCode: null,
          providerCode: null,
          providerMessage: (e as Error).message,
          retryAfterMs: null,
          details: {},
        };
        const decision = this.retryPolicy.evaluate(errorInfo, attempt);
        if (!decision.shouldRetry) throw e;
        this.emitTelemetry('WARN', 'RETRY', correlationId, request, `Retrying rollback step: attempt ${attempt + 1}`, { delayMs: decision.delayMs });
        await new Promise(resolve => setTimeout(resolve, decision.delayMs));
        attempt++;
      }
    }
  }

  private emitTelemetry(
    level: 'INFO' | 'WARN' | 'ERROR',
    category: 'ROLLBACK' | 'RETRY',
    correlationId: string,
    request: ExecutionRequest,
    message: string,
    metadata: Record<string, unknown>,
  ): void {
    this.telemetryEmitter.emit({
      level,
      category,
      correlationId,
      executionId: request.executionId,
      operation: request.operation,
      message,
      metadata,
    });
  }
}
```

**Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 3: Write RollbackExecutorImpl tests

**Files:**
- Create: `tests/platform/rollback-executor-impl.test.ts`

**Step 1: Write test file**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RollbackExecutorImpl, RollbackExecutorConfig } from '../../lib/platform/execution/rollback-executor-impl';
import { RollbackPlan, RollbackResult } from '../../lib/platform/execution/rollback-contract';
import { ExecutionRequest } from '../../lib/platform/execution/execution-request';
import { QueueCandidate } from '../../lib/platform/queue/types';
import { ConnectorExecutionAdapter, ProviderRollbackResult } from '../../lib/platform/execution/connector-execution-adapter';
import { RollbackAudit } from '../../lib/platform/execution/rollback-engine/rollback-audit';
import { TelemetryEmitter } from '../../lib/platform/execution/operational-hardening/telemetry-emitter';
import { GovernanceDecision } from '../../lib/platform/governance/types';
import { ConnectorRuntimeCapabilities } from '../../lib/platform/execution/capabilities';

const mockDecision: GovernanceDecision = {
  decisionId: 'dec-1', requestId: 'req-1', governanceVersion: '1.0.0',
  policyVersion: '1.0.0', approvalRequired: true, approvalLevel: 'STANDARD',
  blockingReasons: [], warnings: [], riskSummary: { level: 'LOW', factors: [] },
  policyResults: [], executionEligible: false, queueEligible: true,
  reviewerInstructions: 'Review',
};

const mockCandidate: QueueCandidate = {
  queueId: 'q-1', connectorId: 'google-calendar', operation: 'events.insert',
  previewId: 'p-1', decisionId: 'dec-1', reviewPackageId: 'pkg-1',
  governanceVersion: '1.0.0', policyVersion: '1.0.0',
  executionManifest: {
    intendedOperation: 'events.insert', requiredScopes: ['scope1'],
    requiredApprovals: ['STANDARD'], governanceDecisionId: 'dec-1',
    blockingConditions: [], validationSummary: 'Test',
    resourceSummary: { sourceId: null, targetId: 't-1', resourceType: 'calendar' },
    executionPrerequisites: [],
  },
  idempotencyToken: 'token-1',
  replayProtection: { duplicateDetectionKey: 'dup-1', replayWindowMetadata: { windowStart: 'S', windowEnd: 'E' }, conflictIdentity: 'c-1', queueUniqueness: 'u-1' },
  dependencyGraph: { dependsOn: [], executionOrder: 1 },
  auditReference: 'audit-1', queueEligible: true, executionEligible: false,
  executionAuthorized: false,
  metadata: { generatedAt: 'now', version: '1.0.0' },
};

const mockCapabilities: ConnectorRuntimeCapabilities = {
  prepare: true, preflight: true, execute: true, verify: true,
  rollback: true, audit: true, stage: '3C',
  providerMutationAllowed: true, networkMutationAllowed: true,
};

const mockRequest: ExecutionRequest = {
  executionId: 'exe-1', queueId: 'q-1', connectorId: 'google-calendar',
  operation: 'events.insert', candidate: mockCandidate, decision: mockDecision,
  capabilities: mockCapabilities,
  idempotencyToken: 'token-1', planHash: 'plan-abc123',
  requestedAt: '2026-01-01T00:00:00Z',
};

const samplePlan: RollbackPlan = {
  rollbackId: 'rb-1', executionId: 'exe-1', connectorId: 'google-calendar',
  operation: 'events.insert', scope: 'FULL', strategy: 'REVERSE_ORDER',
  steps: [
    { stepIndex: 0, action: 'events.insert', compensatingOperation: 'events.delete', parameters: { eventId: 'evt-1' }, reversible: true },
  ],
  plannedAt: '2026-01-01T00:00:00Z', planHash: 'plan-hash-1',
};

describe('RollbackExecutorImpl', () => {
  let mockAdapter: ConnectorExecutionAdapter;
  let telemetry: TelemetryEmitter;
  let audit: RollbackAudit;

  beforeEach(() => {
    mockAdapter = {
      adapterId: 'test-adapter',
      supportedConnectorIds: ['google-calendar'],
      execute: vi.fn(),
      verify: vi.fn(),
      rollback: vi.fn().mockResolvedValue({
        rollbackApplied: true,
        providerState: {},
        rollbackId: 'rb-1',
        rolledBackAt: '2026-01-01T00:00:00Z',
      }),
      audit: vi.fn(),
    };
    telemetry = new TelemetryEmitter();
    audit = new RollbackAudit();
  });

  it('supports rollback', () => {
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter });
    expect(executor.supportsRollback).toBe(true);
    expect(executor.rollbackStrategies).toContain('REVERSE_ORDER');
  });

  it('generates a rollback plan', async () => {
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter });
    const plan = await executor.plan(mockRequest, mockCandidate);
    expect(plan.rollbackId).toBeDefined();
    expect(plan.steps.length).toBeGreaterThan(0);
  });

  it('executes all steps and returns COMPLETED', async () => {
    mockAdapter.rollback = vi.fn().mockResolvedValue({
      rollbackApplied: true, providerState: {}, rollbackId: 'rb-1', rolledBackAt: 'now',
    });
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, audit });
    const result = await executor.execute(mockRequest, mockCandidate, samplePlan);

    expect(result.status).toBe('COMPLETED');
    expect(result.stepsCompleted).toBe(1);
    expect(result.stepsTotal).toBe(1);
    expect(result.stepResults).toHaveLength(1);
    expect(result.stepResults[0].status).toBe('COMPLETED');
  });

  it('returns FAILED when plan validation fails', async () => {
    const invalidPlan = { ...samplePlan, planHash: '' };
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, audit });
    const result = await executor.execute(mockRequest, mockCandidate, invalidPlan);

    expect(result.status).toBe('FAILED');
    expect(result.stepsCompleted).toBe(0);
    expect(result.failureReason).toContain('Plan validation failed');
  });

  it('returns PARTIAL when some steps fail', async () => {
    const multiStepPlan: RollbackPlan = {
      ...samplePlan,
      steps: [
        { stepIndex: 0, action: 'events.insert', compensatingOperation: 'events.delete', parameters: {}, reversible: true },
        { stepIndex: 1, action: 'events.update', compensatingOperation: 'events.update', parameters: {}, reversible: false },
      ],
    };
    mockAdapter.rollback = vi.fn()
      .mockResolvedValueOnce({ rollbackApplied: true, providerState: {}, rollbackId: 'rb-1', rolledBackAt: 'now' })
      .mockRejectedValueOnce(new Error('Step failed'));
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, audit });
    const result = await executor.execute(mockRequest, mockCandidate, multiStepPlan);

    expect(result.status).toBe('PARTIAL');
    expect(result.stepsCompleted).toBe(1);
    expect(result.stepsTotal).toBe(2);
    expect(result.stepResults[0].status).toBe('COMPLETED');
    expect(result.stepResults[1].status).toBe('FAILED');
  });

  it('returns FAILED when all steps fail', async () => {
    mockAdapter.rollback = vi.fn().mockRejectedValue(new Error('All steps failed'));
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, audit });
    const result = await executor.execute(mockRequest, mockCandidate, samplePlan);

    expect(result.status).toBe('FAILED');
    expect(result.stepsCompleted).toBe(0);
    expect(result.failureReason).toBe('All rollback steps failed');
  });

  it('emits telemetry events during execution', async () => {
    mockAdapter.rollback = vi.fn().mockResolvedValue({
      rollbackApplied: true, providerState: {}, rollbackId: 'rb-1', rolledBackAt: 'now',
    });
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, telemetryEmitter: telemetry, audit });
    await executor.execute(mockRequest, mockCandidate, samplePlan);

    const rollbackEvents = telemetry.getEventsByCategory('ROLLBACK');
    expect(rollbackEvents.length).toBeGreaterThanOrEqual(3);
    expect(rollbackEvents.some(e => e.message.includes('started'))).toBe(true);
    expect(rollbackEvents.some(e => e.message.includes('completed'))).toBe(true);
  });

  it('records audit events during execution', async () => {
    mockAdapter.rollback = vi.fn().mockResolvedValue({
      rollbackApplied: true, providerState: {}, rollbackId: 'rb-1', rolledBackAt: 'now',
    });
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, audit });
    await executor.execute(mockRequest, mockCandidate, samplePlan);

    const events = audit.getEvents();
    expect(events.some(e => e.eventType === 'PLAN_GENERATED')).toBe(true);
    expect(events.some(e => e.eventType === 'COMPENSATION_STARTED')).toBe(true);
    expect(events.some(e => e.eventType === 'COMPENSATION_STEP_EXECUTED')).toBe(true);
    expect(events.some(e => e.eventType === 'COMPENSATION_COMPLETED')).toBe(true);
    expect(events.some(e => e.eventType === 'ROLLBACK_COMPLETED')).toBe(true);
  });

  it('retries transient failures during rollback execution', async () => {
    let callCount = 0;
    mockAdapter.rollback = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 2) throw new Error('NETWORK_TIMEOUT');
      return { rollbackApplied: true, providerState: {}, rollbackId: 'rb-1', rolledBackAt: 'now' };
    });
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, audit });
    const result = await executor.execute(mockRequest, mockCandidate, samplePlan);

    expect(result.status).toBe('COMPLETED');
    expect(callCount).toBeGreaterThan(1);
  });

  it('exposes audit and validator accessors', () => {
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, audit });
    expect(executor.getAudit()).toBe(audit);
    expect(executor.getValidator()).toBeDefined();
  });

  it('handles empty step plan gracefully', async () => {
    const emptyPlan: RollbackPlan = {
      ...samplePlan,
      steps: [],
    };
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, audit });
    const result = await executor.execute(mockRequest, mockCandidate, emptyPlan);

    expect(result.status).toBe('COMPLETED');
    expect(result.stepsCompleted).toBe(0);
    expect(result.stepsTotal).toBe(0);
  });

  it('handles adapter rollback returning rollbackApplied=false', async () => {
    mockAdapter.rollback = vi.fn().mockResolvedValue({
      rollbackApplied: false, providerState: {}, rollbackId: 'rb-1', rolledBackAt: 'now',
    });
    const executor = new RollbackExecutorImpl({ adapter: mockAdapter, audit });
    const result = await executor.execute(mockRequest, mockCandidate, samplePlan);

    expect(result.status).toBe('FAILED');
    expect(result.stepResults[0].status).toBe('FAILED');
    expect(result.stepResults[0].error).toContain('rollbackApplied=false');
  });

  it('records deterministic audit for identical rollback plans', async () => {
    mockAdapter.rollback = vi.fn().mockResolvedValue({
      rollbackApplied: true, providerState: {}, rollbackId: 'rb-1', rolledBackAt: 'now',
    });
    const executor1 = new RollbackExecutorImpl({ adapter: mockAdapter });
    const executor2 = new RollbackExecutorImpl({ adapter: mockAdapter });

    const result1 = await executor1.execute(mockRequest, mockCandidate, samplePlan);
    const result2 = await executor2.execute(mockRequest, mockCandidate, samplePlan);

    expect(result1.status).toBe(result2.status);
    expect(result1.stepsCompleted).toBe(result2.stepsCompleted);
  });
});
```

**Step 2: Run tests to verify**

Run: `npx vitest run tests/platform/rollback-executor-impl.test.ts`
Expected: 12+ tests passing

---

### Task 4: Add ROLLBACK_EXECUTION phase to sandbox report types

**Files:**
- Modify: `lib/platform/execution/adapters/sandbox/sandbox-execution-report.ts:11-22`

**Step 1: Add ROLLBACK_EXECUTION to SandboxPhase type**

Add `'ROLLBACK_EXECUTION'` after `'RECONCILIATION'`:

```typescript
export type SandboxPhase =
  | 'ISOLATION_CHECK'
  | 'CREDENTIAL_CHECK'
  | 'APPROVAL_GATE'
  | 'IDEMPOTENCY'
  | 'ROLLBACK_PLANNING'
  | 'AUDIT_PRE'
  | 'EXECUTION'
  | 'VERIFICATION'
  | 'RECONCILIATION'
  | 'ROLLBACK_EXECUTION'
  | 'AUDIT_POST'
  | 'COMPLETED';
```

**Step 2: Run build check**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 5: Create RollbackExecutionPhase

**Files:**
- Create: `lib/platform/execution/adapters/sandbox/rollback-execution-phase.ts`

**Step 1: Write the phase implementation**

```typescript
import { ExecutionRequest } from '../../execution-request';
import { QueueCandidate } from '../../../queue/types';
import { RollbackPlan, RollbackResult } from '../../rollback-contract';
import { RollbackExecutorImpl } from '../../rollback-executor-impl';
import { SandboxPhaseResult, SandboxExecutionOutcome } from './sandbox-execution-report';
import { TelemetryEmitter } from '../../operational-hardening/telemetry-emitter';

export type RollbackPhaseOutcome =
  | 'ROLLBACK_COMPLETED'
  | 'ROLLBACK_PARTIAL'
  | 'ROLLBACK_FAILED'
  | 'ROLLBACK_SKIPPED';

export interface RollbackPhaseResult {
  outcome: RollbackPhaseOutcome;
  rollbackResult: RollbackResult | null;
  phaseResult: SandboxPhaseResult;
}

export interface RollbackExecutionPhaseConfig {
  executor: RollbackExecutorImpl;
  telemetryEmitter: TelemetryEmitter;
}

export class RollbackExecutionPhase {
  private executor: RollbackExecutorImpl;
  private telemetryEmitter: TelemetryEmitter;

  constructor(config: RollbackExecutionPhaseConfig) {
    this.executor = config.executor;
    this.telemetryEmitter = config.telemetryEmitter;
  }

  async execute(
    request: ExecutionRequest,
    candidate: QueueCandidate,
    plan: RollbackPlan,
  ): Promise<RollbackPhaseResult> {
    const start = Date.now();
    const correlationId = `corr-${request.executionId}`;

    this.telemetryEmitter.emit({
      level: 'INFO',
      category: 'ROLLBACK',
      correlationId,
      executionId: request.executionId,
      operation: request.operation,
      message: 'Rollback phase started',
      metadata: { strategy: plan.strategy, steps: plan.steps.length },
    });

    const rollbackResult = await this.executor.execute(request, candidate, plan);

    const durationMs = Date.now() - start;
    let outcome: RollbackPhaseOutcome;
    let passed: boolean;

    switch (rollbackResult.status) {
      case 'COMPLETED':
        outcome = 'ROLLBACK_COMPLETED';
        passed = true;
        break;
      case 'PARTIAL':
        outcome = 'ROLLBACK_PARTIAL';
        passed = true;
        break;
      case 'FAILED':
        outcome = 'ROLLBACK_FAILED';
        passed = false;
        break;
    }

    this.telemetryEmitter.emit({
      level: passed ? 'INFO' : 'ERROR',
      category: 'ROLLBACK',
      correlationId,
      executionId: request.executionId,
      operation: request.operation,
      message: `Rollback phase: ${outcome}`,
      durationMs,
      metadata: { outcome, stepsCompleted: rollbackResult.stepsCompleted, stepsTotal: rollbackResult.stepsTotal },
    });

    const phaseResult: SandboxPhaseResult = {
      phase: 'ROLLBACK_EXECUTION',
      passed,
      durationMs,
      details: {
        outcome,
        rollbackId: rollbackResult.rollbackId,
        stepsCompleted: rollbackResult.stepsCompleted,
        stepsTotal: rollbackResult.stepsTotal,
        failureReason: rollbackResult.failureReason,
      },
    };

    return { outcome, rollbackResult, phaseResult };
  }

  getExecutor(): RollbackExecutorImpl {
    return this.executor;
  }
}
```

**Step 2: Run build check**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 6: Write RollbackExecutionPhase tests

**Files:**
- Create: `tests/platform/rollback-execution-phase.test.ts`

**Step 1: Write test file**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RollbackExecutionPhase } from '../../lib/platform/execution/adapters/sandbox/rollback-execution-phase';
import { RollbackExecutorImpl } from '../../lib/platform/execution/rollback-executor-impl';
import { RollbackPlan, RollbackResult } from '../../lib/platform/execution/rollback-contract';
import { ExecutionRequest } from '../../lib/platform/execution/execution-request';
import { QueueCandidate } from '../../lib/platform/queue/types';
import { ConnectorExecutionAdapter } from '../../lib/platform/execution/connector-execution-adapter';
import { TelemetryEmitter } from '../../lib/platform/execution/operational-hardening/telemetry-emitter';
import { GovernanceDecision } from '../../lib/platform/governance/types';
import { ConnectorRuntimeCapabilities } from '../../lib/platform/execution/capabilities';

const mockDecision: GovernanceDecision = {
  decisionId: 'dec-1', requestId: 'req-1', governanceVersion: '1.0.0',
  policyVersion: '1.0.0', approvalRequired: true, approvalLevel: 'STANDARD',
  blockingReasons: [], warnings: [], riskSummary: { level: 'LOW', factors: [] },
  policyResults: [], executionEligible: false, queueEligible: true,
  reviewerInstructions: '',
};

const mockCandidate: QueueCandidate = {
  queueId: 'q-1', connectorId: 'google-calendar', operation: 'events.insert',
  previewId: 'p-1', decisionId: 'dec-1', reviewPackageId: 'pkg-1',
  governanceVersion: '1.0.0', policyVersion: '1.0.0',
  executionManifest: {
    intendedOperation: 'events.insert', requiredScopes: ['scope1'],
    requiredApprovals: ['STANDARD'], governanceDecisionId: 'dec-1',
    blockingConditions: [], validationSummary: 'Test',
    resourceSummary: { sourceId: null, targetId: 't-1', resourceType: 'calendar' },
    executionPrerequisites: [],
  },
  idempotencyToken: 'token-1',
  replayProtection: { duplicateDetectionKey: 'dup-1', replayWindowMetadata: { windowStart: 'S', windowEnd: 'E' }, conflictIdentity: 'c-1', queueUniqueness: 'u-1' },
  dependencyGraph: { dependsOn: [], executionOrder: 1 },
  auditReference: 'audit-1', queueEligible: true, executionEligible: false,
  executionAuthorized: false,
  metadata: { generatedAt: 'now', version: '1.0.0' },
};

const mockCapabilities: ConnectorRuntimeCapabilities = {
  prepare: true, preflight: true, execute: true, verify: true,
  rollback: true, audit: true, stage: '3C',
  providerMutationAllowed: true, networkMutationAllowed: true,
};

const mockRequest: ExecutionRequest = {
  executionId: 'exe-1', queueId: 'q-1', connectorId: 'google-calendar',
  operation: 'events.insert', candidate: mockCandidate, decision: mockDecision,
  capabilities: mockCapabilities,
  idempotencyToken: 'token-1', planHash: 'plan-abc123',
  requestedAt: '2026-01-01T00:00:00Z',
};

const samplePlan: RollbackPlan = {
  rollbackId: 'rb-1', executionId: 'exe-1', connectorId: 'google-calendar',
  operation: 'events.insert', scope: 'FULL', strategy: 'REVERSE_ORDER',
  steps: [
    { stepIndex: 0, action: 'events.insert', compensatingOperation: 'events.delete', parameters: {}, reversible: true },
  ],
  plannedAt: '2026-01-01T00:00:00Z', planHash: 'plan-hash-1',
};

describe('RollbackExecutionPhase', () => {
  let mockAdapter: ConnectorExecutionAdapter;
  let telemetry: TelemetryEmitter;
  let executor: RollbackExecutorImpl;
  let phase: RollbackExecutionPhase;

  beforeEach(() => {
    mockAdapter = {
      adapterId: 'test-adapter',
      supportedConnectorIds: ['google-calendar'],
      execute: vi.fn(),
      verify: vi.fn(),
      rollback: vi.fn().mockResolvedValue({ rollbackApplied: true, providerState: {}, rollbackId: 'rb-1', rolledBackAt: 'now' }),
      audit: vi.fn(),
    };
    telemetry = new TelemetryEmitter();
    executor = new RollbackExecutorImpl({ adapter: mockAdapter, telemetryEmitter: telemetry });
    phase = new RollbackExecutionPhase({ executor, telemetryEmitter: telemetry });
  });

  it('returns ROLLBACK_COMPLETED for successful rollback', async () => {
    const result = await phase.execute(mockRequest, mockCandidate, samplePlan);
    expect(result.outcome).toBe('ROLLBACK_COMPLETED');
    expect(result.rollbackResult?.status).toBe('COMPLETED');
    expect(result.phaseResult.passed).toBe(true);
    expect(result.phaseResult.phase).toBe('ROLLBACK_EXECUTION');
  });

  it('returns ROLLBACK_FAILED when rollback fails', async () => {
    mockAdapter.rollback = vi.fn().mockRejectedValue(new Error('Rollback failed'));
    const result = await phase.execute(mockRequest, mockCandidate, samplePlan);
    expect(result.outcome).toBe('ROLLBACK_FAILED');
    expect(result.phaseResult.passed).toBe(false);
  });

  it('emits telemetry for phase start and completion', async () => {
    await phase.execute(mockRequest, mockCandidate, samplePlan);
    const rollbackEvents = telemetry.getEventsByCategory('ROLLBACK');
    expect(rollbackEvents.length).toBeGreaterThanOrEqual(2);
    expect(rollbackEvents.some(e => e.message === 'Rollback phase started')).toBe(true);
    expect(rollbackEvents.some(e => e.message.startsWith('Rollback phase:'))).toBe(true);
  });

  it('provides access to the underlying executor', () => {
    expect(phase.getExecutor()).toBe(executor);
  });

  it('returns phase result with correct structure', async () => {
    const result = await phase.execute(mockRequest, mockCandidate, samplePlan);
    expect(result.phaseResult).toHaveProperty('phase');
    expect(result.phaseResult).toHaveProperty('passed');
    expect(result.phaseResult).toHaveProperty('durationMs');
    expect(result.phaseResult).toHaveProperty('details');
    expect(result.phaseResult.details).toHaveProperty('outcome');
    expect(result.phaseResult.details).toHaveProperty('rollbackId');
    expect(result.phaseResult.details).toHaveProperty('stepsCompleted');
    expect(result.phaseResult.details).toHaveProperty('stepsTotal');
  });

  it('returns rollback result with proper structure', async () => {
    const result = await phase.execute(mockRequest, mockCandidate, samplePlan);
    expect(result.rollbackResult).toHaveProperty('rollbackId');
    expect(result.rollbackResult).toHaveProperty('executionId');
    expect(result.rollbackResult).toHaveProperty('status');
    expect(result.rollbackResult).toHaveProperty('stepsCompleted');
    expect(result.rollbackResult).toHaveProperty('stepsTotal');
    expect(result.rollbackResult).toHaveProperty('stepResults');
  });
});
```

**Step 2: Run tests to verify**

Run: `npx vitest run tests/platform/rollback-execution-phase.test.ts`
Expected: 7 tests passing

---

### Task 7: Integrate into SandboxExecutionPipeline

**Files:**
- Modify: `lib/platform/execution/adapters/sandbox/sandbox-execution-pipeline.ts`

**Step 1: Import RollbackExecutionPhase**

Add to imports:
```typescript
import { RollbackExecutionPhase, RollbackPhaseOutcome } from './rollback-execution-phase';
import { RollbackExecutorImpl } from '../../rollback-executor-impl';
```

**Step 2: Change config type — require rollbackExecutor to be RollbackExecutorImpl**

Change the config type from `rollbackExecutor?: RollbackExecutor` to `rollbackExecutor?: RollbackExecutorImpl` — wait, let me think about this more carefully.

Actually, the best approach is to add a `rollbackExecutionPhase` property to the config. Or better: let the pipeline handle both the old `RollbackExecutor` for planning (Phase 5) and add a `RollbackExecutionPhase` for execution.

Actually, re-reading the design: The `RollbackExecutionPhase` wraps a `RollbackExecutorImpl`. The pipeline should accept a `RollbackExecutionPhase` in its config.

But to keep things backward-compatible, I'll:
1. Add `rollbackPhase?: RollbackExecutionPhase` to the config
2. In the `execute()` method, after Phase 9 (RECONCILIATION), if there's a failure and a rollbackPhase exists, transition to ROLLBACK_EXECUTION
3. Replace `attemptRollback()` with the phase's executor

The changes to the pipeline:

In the config:
```typescript
export interface SandboxExecutionPipelineConfig {
  // ... existing fields ...
  rollbackPhase?: RollbackExecutionPhase;
}
```

In the constructor, store it:
```typescript
private rollbackPhase?: RollbackExecutionPhase;

constructor(config: SandboxExecutionPipelineConfig) {
  // ... existing setup ...
  if (config.rollbackPhase) {
    this.rollbackPhase = config.rollbackPhase;
  } else if (config.rollbackExecutor) {
    // Create a default RollbackExecutionPhase from the executor if it's a RollbackExecutorImpl
    if (config.rollbackExecutor instanceof RollbackExecutorImpl) {
      this.rollbackPhase = new RollbackExecutionPhase({
        executor: config.rollbackExecutor,
        telemetryEmitter: this.telemetryEmitter,
      });
    }
  }
}
```

Wait, but `config.rollbackExecutor` might be a plain `RollbackExecutor` (just the interface), not a `RollbackExecutorImpl`. The old code had it generic. Let me think about backward compatibility.

Actually, the simplest clean approach: since this is Stage 3C.6 and we're making rollback a first-class citizen, just add the `rollbackPhase` config. If it's not provided, fall back to the existing `attemptRollback()` behavior (backward compatible). If it IS provided, use the new phase.

For the execution flow changes:

After Phase 9 (RECONCILIATION), if outcome is SANDBOX_FAILED and rollbackPhase exists:
- Execute the rollback phase
- Use the result to determine next state

Let me write the edits:

**Edit 1: Add imports**
After `import { FailureInjectionHarness } from '../../operational-hardening/failure-injection-harness';`
Add:
```typescript
import { RollbackExecutionPhase, RollbackPhaseOutcome } from './rollback-execution-phase';
import { RollbackResult } from '../../rollback-contract';
```

Wait, `RollbackResult` is already imported via `rollback-contract.ts` indirectly through `RollbackPlan`. Let me check...

Actually, `RollbackPlan` is imported from `rollback-contract` but `RollbackResult` is not. I need to add it.

Actually, let me re-approach. Instead of making the pipeline import `RollbackResult`, let me have the phase return a simpler result that includes the string outcome and a raw result object.

Actually, let me look at what I need to change more carefully.

Current flow on failure:
1. Line 391-394: On EXECUTION failure → `attemptRollback()` → buildReport
2. Line 440-441: On VERIFICATION failure → `attemptRollback()` → continue to PHASE 9/10/11

What I want:
1. On EXECUTION failure → transition to ROLLBACK_EXECUTION phase → then AUDIT_POST → COMPLETED
2. On VERIFICATION failure → transition to ROLLBACK_EXECUTION phase → then AUDIT_POST → COMPLETED

Since we're adding ROLLBACK_EXECUTION as a real phase in the phase list, the flow becomes:
1. On EXECUTION failure → execute rollback phase → add to phases → then AUDIT_POST → COMPLETED (with outcome SANDBOX_ROLLED_BACK or SANDBOX_FAILED)
2. On VERIFICATION failure → same

The tricky part is that the current flow is linear (one big function), so I need to insert the rollback execution inline. Let me restructure.

Let me write the changes more carefully.

Changes to the execute() method:

After line 394 (`return this.buildReport(...)` for execution failure), replace with:

```
await this.idempotencyStore.fail(idempotencyKey, (e as Error).message);
if (this.rollbackPhase && rollbackPlan) {
  const rollbackPhaseResult = await this.rollbackPhase.execute(request, candidate, rollbackPlan);
  phases.push(rollbackPhaseResult.phaseResult);
  rollbackResult = {
    rollbackApplied: rollbackPhaseResult.outcome === 'ROLLBACK_COMPLETED' || rollbackPhaseResult.outcome === 'ROLLBACK_PARTIAL',
    providerState: {},
    rollbackId: rollbackPhaseResult.rollbackResult?.rollbackId ?? '',
    rolledBackAt: new Date().toISOString(),
  };
  outcome = rollbackPhaseResult.outcome === 'ROLLBACK_COMPLETED' ? 'SANDBOX_ROLLED_BACK' : 'SANDBOX_FAILED';
} else {
  const rbResult = await this.attemptRollback(request, candidate, e as Error);
  rollbackResult = rbResult;
}
// Continue to AUDIT_POST + COMPLETED
```

But wait, the current code returns early after execution failure. If I add rollback execution and then continue to AUDIT_POST and COMPLETED, I need to not return early.

Actually, let me re-think the architecture. The current code does:
1. Phase 7: EXECUTION → catches error → calls attemptRollback → returns report immediately
2. Phase 8: VERIFICATION → catches verification error → calls attemptRollback → continues to Phase 9/10/11

For the new flow, I want rollback to be a proper phase. So:
1. Phase 7: EXECUTION → catches error → if rollbackPhase exists, continue to rollback execution phase → AUDIT_POST → COMPLETED. If no rollbackPhase, fall back to old behavior.
2. Phase 8: VERIFICATION → catches verification error → if rollbackPhase exists, continue to rollback execution phase. Otherwise old behavior.

Actually the cleanest approach: Don't change the early return structure. Instead, after the execution catch block, execute the rollback phase inline, add the phase result, but DON'T return early — let it fall through to AUDIT_POST and COMPLETED. Same for verification.

Let me think about this more concretely with the actual code...

Hmm, this is getting complex. Let me simplify by doing targeted edits.

For the EXECUTION failure block (lines 375-395):

Old code:
```
    } catch (e) {
      // ... phase push, audit, telemetry ...
      outcome = 'SANDBOX_FAILED';
      await this.idempotencyStore.fail(idempotencyKey, (e as Error).message);
      const rbResult = await this.attemptRollback(request, candidate, e as Error);
      rollbackResult = rbResult;
      return this.buildReport(request, outcome, phases, null, null, rollbackResult, approvalVerdict, rollbackPlan, auditEvents, transportInvoked, violations);
    }
```

New code:
```
    } catch (e) {
      // ... phase push, audit, telemetry ...
      outcome = 'SANDBOX_FAILED';
      await this.idempotencyStore.fail(idempotencyKey, (e as Error).message);
      if (this.rollbackPhase && rollbackPlan) {
        const rbPhaseResult = await this.rollbackPhase.execute(request, candidate, rollbackPlan);
        phases.push(rbPhaseResult.phaseResult);
        rollbackResult = {
          rollbackApplied: rbPhaseResult.outcome !== 'ROLLBACK_FAILED',
          providerState: {},
          rollbackId: rbPhaseResult.rollbackResult?.rollbackId ?? '',
          rolledBackAt: new Date().toISOString(),
        };
        if (rbPhaseResult.outcome === 'ROLLBACK_COMPLETED') {
          outcome = 'SANDBOX_ROLLED_BACK';
        }
      } else {
        const rbResult = await this.attemptRollback(request, candidate, e as Error);
        rollbackResult = rbResult;
      }
      auditEvents.push(`ROLLBACK_EXECUTION: ${rollbackResult.rollbackApplied ? 'APPLIED' : 'FAILED'}`);
      return this.buildReport(request, outcome, phases, null, null, rollbackResult, approvalVerdict, rollbackPlan, auditEvents, transportInvoked, violations);
    }
```

Wait but this still returns early. That's actually fine — we return with the outcome set appropriately. The key change is that we use the phase instead of direct adapter.rollback(), and we add the ROLLBACK_EXECUTION phase to the phases array before returning.

For the VERIFICATION failure (lines 431-442):

Old:
```
    if (!verificationPassed) {
      // ...
      outcome = 'SANDBOX_FAILED';
      await this.idempotencyStore.fail(idempotencyKey, 'Verification failed');
      const rbResult = await this.attemptRollback(request, candidate, new Error('Verification failed'));
      rollbackResult = rbResult;
    }
```

New:
```
    if (!verificationPassed) {
      // ...
      outcome = 'SANDBOX_FAILED';
      await this.idempotencyStore.fail(idempotencyKey, 'Verification failed');
      if (this.rollbackPhase && rollbackPlan) {
        const rbPhaseResult = await this.rollbackPhase.execute(request, candidate, rollbackPlan);
        phases.push(rbPhaseResult.phaseResult);
        rollbackResult = {
          rollbackApplied: rbPhaseResult.outcome !== 'ROLLBACK_FAILED',
          providerState: {},
          rollbackId: rbPhaseResult.rollbackResult?.rollbackId ?? '',
          rolledBackAt: new Date().toISOString(),
        };
        if (rbPhaseResult.outcome === 'ROLLBACK_COMPLETED') {
          outcome = 'SANDBOX_ROLLED_BACK';
        }
        auditEvents.push(`ROLLBACK_EXECUTION: ${rollbackResult.rollbackApplied ? 'APPLIED' : 'FAILED'}`);
      } else {
        const rbResult = await this.attemptRollback(request, candidate, new Error('Verification failed'));
        rollbackResult = rbResult;
      }
    }
```

Now the AUDIT_POST phase needs to reflect the new phase. The current code adds the rollback result to the report through buildReport. Since we're using a phase now, the report will naturally include the ROLLBACK_EXECUTION phase.

Let me now think about backward compatibility. If `rollbackPhase` is not configured, we fall back to the old `attemptRollback()`. This ensures existing tests still pass.

For the test suite update: The existing tests that check phase order previously expected 11 phases. Now on failure paths they'll see 12 phases (with ROLLBACK_EXECUTION). On success paths they'll still see 11 (since ROLLBACK_EXECUTION is only entered on failure).

Actually wait, let me reconsider the overall approach. Instead of modifying the giant execute() method which is fragile, let me create a dedicated integration that's cleaner. But that would be a bigger refactor. Let me stick with targeted edits.

Let me now proceed and write the implementation plan in full detail.

Actually, I realize I should just present the plan and let the user choose how to execute. Let me write the full plan document.<｜end▁of▁thinking｜>

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="todowrite">
<｜｜DSML｜｜parameter name="todos" string="false">[{"priority":"high","content":"Explore existing rollback infrastructure and contracts","status":"completed"},{"priority":"high","content":"Ask clarifying questions about Stage 3C.6 scope","status":"completed"},{"priority":"high","content":"Propose architecture approaches for rollback integration","status":"completed"},{"priority":"medium","content":"Present design and get approval","status":"completed"},{"priority":"medium","content":"Write design doc","status":"completed"},{"priority":"medium","content":"Write implementation plan","status":"in_progress"},{"priority":"medium","content":"Transition to implementation","status":"pending"}]