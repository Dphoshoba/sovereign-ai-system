import { ExecutionRequest } from '../../execution-request';
import { QueueCandidate } from '../../../queue/types';
import { ConnectorExecutionAdapter, ProviderMutationResult } from '../../connector-execution-adapter';
import { ApprovalGate, ApprovalRequest, ApprovalVerdict, ApprovalLevel } from '../../approval-contract';
import { RollbackExecutor, RollbackPlan } from '../../rollback-contract';
import { SandboxPolicy, SandboxPolicyConfig, DEFAULT_SANDBOX_POLICY } from './sandbox-policy';
import { SandboxResourceGuard } from './sandbox-resource-guard';
import {
  SandboxExecutionReport,
  SandboxExecutionOutcome,
  SandboxPhaseResult,
  SandboxPhase,
} from './sandbox-execution-report';
import { DistributedIdempotencyStore } from '../../operational-hardening/distributed-idempotency-store';
import { RetryPolicy } from '../../operational-hardening/retry-policy';
import { BackoffStrategy } from '../../operational-hardening/backoff-strategy';
import { RateLimitHandler } from '../../operational-hardening/rate-limit-handler';
import { ReconciliationEngine } from '../../operational-hardening/reconciliation-engine';
import { CredentialRotationManager } from '../../operational-hardening/credential-rotation-manager';
import { TelemetryEmitter } from '../../operational-hardening/telemetry-emitter';
import { FailureInjectionHarness } from '../../operational-hardening/failure-injection-harness';
import { ProviderErrorInfo } from '../../provider-contracts/provider-error';
import { RollbackExecutionPhase, RollbackPhaseOutcome } from './rollback-execution-phase';

export interface SandboxExecutionPipelineConfig {
  adapter: ConnectorExecutionAdapter;
  policy?: SandboxPolicyConfig;
  approvalGate?: ApprovalGate;
  rollbackExecutor?: RollbackExecutor;
  idempotencyStore?: DistributedIdempotencyStore;
  retryPolicy?: RetryPolicy;
  backoffStrategy?: BackoffStrategy;
  rateLimitHandler?: RateLimitHandler;
  reconciliationEngine?: ReconciliationEngine;
  credentialManager?: CredentialRotationManager;
  telemetryEmitter?: TelemetryEmitter;
  failureInjector?: FailureInjectionHarness;
  rollbackPhase?: RollbackExecutionPhase;
}

export class SandboxExecutionPipeline {
  private policy: SandboxPolicy;
  private resourceGuard: SandboxResourceGuard;
  private config: SandboxExecutionPipelineConfig;
  private idempotencyStore: DistributedIdempotencyStore;
  private retryPolicy: RetryPolicy;
  private backoffStrategy: BackoffStrategy;
  private rateLimitHandler: RateLimitHandler;
  private reconciliationEngine: ReconciliationEngine;
  private telemetryEmitter: TelemetryEmitter;
  private rollbackPhase?: RollbackExecutionPhase;

  constructor(config: SandboxExecutionPipelineConfig) {
    this.config = config;
    const policyConfig = config.policy ?? DEFAULT_SANDBOX_POLICY;
    this.policy = new SandboxPolicy(policyConfig);
    this.resourceGuard = new SandboxResourceGuard(policyConfig.sandboxCalendarId);
    this.idempotencyStore = config.idempotencyStore ?? new DistributedIdempotencyStore();
    this.retryPolicy = config.retryPolicy ?? new RetryPolicy();
    this.backoffStrategy = config.backoffStrategy ?? new BackoffStrategy();
    this.rateLimitHandler = config.rateLimitHandler ?? new RateLimitHandler();
    this.reconciliationEngine = config.reconciliationEngine ?? new ReconciliationEngine();
    this.telemetryEmitter = config.telemetryEmitter ?? new TelemetryEmitter();
    this.rollbackPhase = config.rollbackPhase;
  }

  getPolicy(): SandboxPolicy {
    return this.policy;
  }

  getTelemetryEmitter(): TelemetryEmitter {
    return this.telemetryEmitter;
  }

  private async executeAdapterCall(request: ExecutionRequest, candidate: QueueCandidate): Promise<ProviderMutationResult> {
    const run = async (): Promise<ProviderMutationResult> => {
      if (this.config.failureInjector) {
        const providerReq = {
          requestId: request.executionId,
          executionId: request.executionId,
          method: request.operation === 'events.delete' ? 'DELETE' : (request.operation === 'events.insert' ? 'POST' : 'PUT'),
          url: 'https://www.googleapis.com/calendar/v3/calendars/sandbox/events',
          headers: { Authorization: 'Bearer sandbox-token' },
          body: null,
          bodyFormat: 'none' as const,
          idempotencyKey: request.idempotencyToken ?? '',
          timeoutMs: 30000,
          retryAttempt: 0,
          maxRetries: 3,
          metadata: {},
        };
        const response = await this.config.failureInjector!.send(providerReq as any);
        return {
          mutationId: `mut-${request.executionId}`,
          providerState: { body: response.body, headers: response.headers },
          etag: response.etag ?? undefined,
          mutatedAt: response.receivedAt,
        };
      }
      return this.config.adapter.execute(request, candidate);
    };

    if (this.config.retryPolicy) {
      return this.executeWithRetry(run);
    }
    return run();
  }

  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0;
    while (true) {
      try {
        return await fn();
      } catch (e) {
        const errorInfo = this.classifyError(e as Error);
        const decision = this.retryPolicy.evaluate(errorInfo, attempt);
        if (!decision.shouldRetry) throw e;
        await this.sleep(decision.delayMs);
        attempt++;
      }
    }
  }

  private classifyError(error: Error): ProviderErrorInfo {
    const msg = error.message;
    if (msg.includes('TIMEOUT') || msg.includes('timeout')) return { code: 'NETWORK_TIMEOUT', category: 'TRANSIENT', retryable: true, statusCode: null, providerCode: null, providerMessage: msg, retryAfterMs: null, details: {} };
    if (msg.includes('RATE_LIMIT') || msg.includes('429')) return { code: 'RATE_LIMITED', category: 'TRANSIENT', retryable: true, statusCode: 429, providerCode: null, providerMessage: msg, retryAfterMs: null, details: {} };
    if (msg.includes('NETWORK')) return { code: 'NETWORK_UNAVAILABLE', category: 'TRANSIENT', retryable: true, statusCode: null, providerCode: null, providerMessage: msg, retryAfterMs: null, details: {} };
    if (msg.includes('SERVER_ERROR') || msg.includes('500')) return { code: 'SERVER_ERROR', category: 'TRANSIENT', retryable: true, statusCode: 500, providerCode: null, providerMessage: msg, retryAfterMs: null, details: {} };
    return { code: 'UNKNOWN', category: 'PERMANENT', retryable: false, statusCode: null, providerCode: null, providerMessage: msg, retryAfterMs: null, details: {} };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async execute(
    request: ExecutionRequest,
    candidate: QueueCandidate,
  ): Promise<SandboxExecutionReport> {
    const phases: SandboxPhaseResult[] = [];
    const auditEvents: string[] = [];
    const violations: string[] = [];
    let transportInvoked = false;
    let mutationResult: ProviderMutationResult | null = null;
    let verificationResult: any = null;
    let rollbackResult: any = null;
    let approvalVerdict: ApprovalVerdict | null = null;
    let rollbackPlan: RollbackPlan | null = null;
    let credentialHealth: any = null;
    let reconciliationResult: any = null;
    let outcome: SandboxExecutionOutcome = 'SANDBOX_COMPLETED';

    const targetCalendarId = this.resolveCalendarId(request, candidate);
    const correlationId = `corr-${request.executionId}`;

    this.telemetryEmitter.emit({
      level: 'INFO', category: 'EXECUTION', correlationId, executionId: request.executionId,
      operation: request.operation, message: 'Pipeline execution started', metadata: {},
    });

    // Phase 1: Isolation Check
    const isolationResult = this.policy.verifyIsolation(request.operation, targetCalendarId);
    const guardResult = this.resourceGuard.checkCalendarId(targetCalendarId);
    const isolationPassed = isolationResult.passed && guardResult.allowed;
    const isolationStart = Date.now();
    phases.push({
      phase: 'ISOLATION_CHECK',
      passed: isolationPassed,
      durationMs: Date.now() - isolationStart,
      details: {
        targetCalendarId,
        policyPassed: isolationResult.passed,
        guardAllowed: guardResult.allowed,
        policyViolations: isolationResult.violations,
        guardReason: guardResult.reason,
      },
    });
    if (!isolationPassed) {
      violations.push(...isolationResult.violations.map(v => `${v.code}: ${v.message}`));
      if (guardResult.reason) violations.push(guardResult.reason);
      auditEvents.push(`ISOLATION_FAILED: target=${targetCalendarId} operation=${request.operation}`);
      this.telemetryEmitter.emit({
        level: 'ERROR', category: 'EXECUTION', correlationId, executionId: request.executionId,
        operation: request.operation, message: 'Isolation check failed', metadata: { targetCalendarId, violations },
      });
      return this.buildReport(request, 'SANDBOX_ABORTED', phases, null, null, null, null, null, auditEvents, false, violations);
    }
    auditEvents.push(`ISOLATION_PASSED: target=${targetCalendarId}`);

    // Phase 2: Credential Health Check (if credential manager configured)
    const credStart = Date.now();
    if (this.config.credentialManager) {
      try {
        credentialHealth = await this.config.credentialManager.checkHealth(request.executionId);
        if (credentialHealth.needsRotation) {
          const rotationResult = await this.config.credentialManager.rotate(request.executionId);
          this.telemetryEmitter.emit({
            level: 'WARN', category: 'CREDENTIAL', correlationId, executionId: request.executionId,
            operation: request.operation, message: `Credential rotated: ${rotationResult.newCredentialId}`,
            metadata: { previousId: rotationResult.previousCredentialId, rotated: rotationResult.rotated },
          });
          auditEvents.push(`CREDENTIAL_ROTATED: ${rotationResult.previousCredentialId} -> ${rotationResult.newCredentialId}`);
        }
      } catch (e) {
        credentialHealth = { isValid: false, needsRotation: false, reason: `Credential check failed: ${(e as Error).message}` };
        violations.push(`Credential check failed: ${(e as Error).message}`);
      }
    }
    phases.push({
      phase: 'CREDENTIAL_CHECK',
      passed: credentialHealth ? credentialHealth.isValid : true,
      durationMs: Date.now() - credStart,
      details: credentialHealth ? {
        credentialId: credentialHealth.credentialId,
        isValid: credentialHealth.isValid,
        needsRotation: credentialHealth.needsRotation,
        reason: credentialHealth.reason,
      } : { skipped: true },
    });

    // Phase 3: Approval Gate
    const approvalStart = Date.now();
    if (this.config.approvalGate) {
      const approvalRequest: ApprovalRequest = {
        approvalId: `sandbox-appr-${request.executionId}`,
        executionId: request.executionId,
        connectorId: request.connectorId,
        operation: request.operation,
        riskLevel: this.getRiskLevel(request.operation),
        requiredLevel: this.getApprovalLevel(request.operation),
        requestedAt: '2026-01-01T00:00:00Z',
        context: {
          queueId: request.queueId,
          decisionId: request.decision.decisionId,
          planHash: request.planHash,
        },
      };
      try {
        approvalVerdict = await this.config.approvalGate.evaluate(approvalRequest);
      } catch (e) {
        approvalVerdict = {
          decision: 'DENIED',
          approvedAt: null,
          approvedBy: null,
          approvalLevel: this.getApprovalLevel(request.operation),
          conditions: [],
          reason: `Approval gate threw: ${(e as Error).message}`,
        };
      }
    } else {
      approvalVerdict = {
        decision: 'APPROVED',
        approvedAt: '2026-01-01T00:00:00Z',
        approvedBy: 'sandbox-system',
        approvalLevel: this.getApprovalLevel(request.operation),
        conditions: ['Sandbox mode: sandbox calendar only'],
        reason: 'SANDBOX_AUTO_APPROVED',
      };
    }
    const approvalPassed = approvalVerdict.decision === 'APPROVED';
    phases.push({
      phase: 'APPROVAL_GATE',
      passed: approvalPassed,
      durationMs: Date.now() - approvalStart,
      details: { decision: approvalVerdict.decision, reason: approvalVerdict.reason },
    });
    auditEvents.push(`APPROVAL_${approvalVerdict.decision}: ${approvalVerdict.reason}`);
    if (!approvalPassed) {
      this.telemetryEmitter.emit({
        level: 'ERROR', category: 'EXECUTION', correlationId, executionId: request.executionId,
        operation: request.operation, message: `Approval denied: ${approvalVerdict.reason}`, metadata: {},
      });
      return this.buildReport(request, 'SANDBOX_ABORTED', phases, null, null, null, approvalVerdict, null, auditEvents, false, [`Approval denied: ${approvalVerdict.reason}`]);
    }

    // Phase 4: Idempotency Check
    const idempotencyKey = request.idempotencyToken || `sandbox-ik-${request.executionId}`;
    const idemStart = Date.now();
    let idempotencyPassed = true;
    let idempotentReplay = false;
    try {
      const idemCheck = await this.idempotencyStore.check(idempotencyKey);
      if (idemCheck.status === 'COMPLETED') {
        idempotentReplay = true;
        auditEvents.push(`IDEMPOTENCY_REPLAY: key=${idempotencyKey} already completed`);
        this.telemetryEmitter.emit({
          level: 'INFO', category: 'IDEMPOTENCY', correlationId, executionId: request.executionId,
          operation: request.operation, message: `Idempotent replay, execution skipped for key=${idempotencyKey}`,
          metadata: { status: idemCheck.status },
        });
      } else {
        await this.idempotencyStore.put(idempotencyKey, {
          idempotencyKey,
          status: 'EXECUTING',
          executionId: request.executionId,
          operation: request.operation,
          requestHash: request.planHash ?? '',
          result: null,
          error: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        });
        auditEvents.push(`IDEMPOTENCY_KEY: ${idempotencyKey}`);
        this.telemetryEmitter.emit({
          level: 'INFO', category: 'IDEMPOTENCY', correlationId, executionId: request.executionId,
          operation: request.operation, message: `Idempotency key registered: ${idempotencyKey}`,
          metadata: {},
        });
      }
    } catch (e) {
      idempotencyPassed = false;
      violations.push(`Idempotency check failed: ${(e as Error).message}`);
      auditEvents.push(`IDEMPOTENCY_FAILED: ${(e as Error).message}`);
    }
    phases.push({
      phase: 'IDEMPOTENCY',
      passed: idempotencyPassed,
      durationMs: Date.now() - idemStart,
      details: { idempotencyKey, replayDetected: idempotentReplay },
    });
    if (!idempotencyPassed) {
      outcome = 'SANDBOX_FAILED';
      this.telemetryEmitter.emit({
        level: 'ERROR', category: 'IDEMPOTENCY', correlationId, executionId: request.executionId,
        operation: request.operation, message: 'Idempotency check failed', metadata: {},
      });
    }

    // Skip execution if idempotent replay detected
    if (idempotentReplay) {
      const idemResult = await this.idempotencyStore.get(idempotencyKey);
      return this.buildReport(request, 'SANDBOX_COMPLETED', phases,
        idemResult?.result as ProviderMutationResult | null, null, null, approvalVerdict, rollbackPlan,
        auditEvents, false, violations);
    }

    // Phase 5: Rollback Plan
    const rollbackStart = Date.now();
    if (this.config.rollbackExecutor) {
      try {
        rollbackPlan = await this.config.rollbackExecutor.plan(request, candidate);
      } catch (e) {
        violations.push(`Rollback planning failed: ${(e as Error).message}`);
      }
    }
    if (!rollbackPlan) {
      rollbackPlan = this.createDefaultRollbackPlan(request, targetCalendarId);
    }
    phases.push({
      phase: 'ROLLBACK_PLANNING',
      passed: true,
      durationMs: Date.now() - rollbackStart,
      details: { strategy: rollbackPlan.strategy, steps: rollbackPlan.steps.length },
    });
    auditEvents.push(`ROLLBACK_PLAN: ${rollbackPlan.strategy} (${rollbackPlan.scope})`);

    // Phase 6: Pre-Execution Audit
    auditEvents.push(`PRE_EXECUTION: op=${request.operation} target=${targetCalendarId} ik=${idempotencyKey}`);
    phases.push({
      phase: 'AUDIT_PRE',
      passed: true,
      durationMs: 0,
      details: { eventCount: auditEvents.length },
    });

    // Phase 7: Execution (with retry + rate-limit handling)
    const execStart = Date.now();
    try {
      mutationResult = await this.executeAdapterCall(request, candidate);
      transportInvoked = true;
      this.telemetryEmitter.emit({
        level: 'INFO', category: 'EXECUTION', correlationId, executionId: request.executionId,
        operation: request.operation, message: 'Mutation executed successfully',
        durationMs: Date.now() - execStart,
        metadata: { mutationId: mutationResult.mutationId },
      });
    } catch (e) {
      const execDuration = Date.now() - execStart;
      phases.push({
        phase: 'EXECUTION',
        passed: false,
        durationMs: execDuration,
        details: { error: (e as Error).message },
      });
      auditEvents.push(`EXECUTION_FAILED: ${(e as Error).message}`);
      this.telemetryEmitter.emit({
        level: 'ERROR', category: 'EXECUTION', correlationId, executionId: request.executionId,
        operation: request.operation, message: `Execution failed: ${(e as Error).message}`,
        durationMs: execDuration, metadata: {},
      });
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
        auditEvents.push(`ROLLBACK_EXECUTION: ${rollbackResult.rollbackApplied ? 'APPLIED' : 'FAILED'}`);
      } else {
        const rbResult = await this.attemptRollback(request, candidate, e as Error);
        rollbackResult = rbResult;
      }
      return this.buildReport(request, outcome, phases, null, null, rollbackResult, approvalVerdict, rollbackPlan, auditEvents, transportInvoked, violations);
    }

    phases.push({
      phase: 'EXECUTION',
      passed: true,
      durationMs: Date.now() - execStart,
      details: {
        mutationId: mutationResult.mutationId,
        etag: mutationResult.etag,
      },
    });
    auditEvents.push(`EXECUTION_SUCCEEDED: mutationId=${mutationResult.mutationId}`);

    // Phase 8: Verification
    const verStart = Date.now();
    try {
      verificationResult = await this.config.adapter.verify(request, mutationResult, candidate);
    } catch (e) {
      verificationResult = {
        verified: false,
        providerState: mutationResult.providerState,
        drift: [`Verification threw: ${(e as Error).message}`],
        verifiedAt: '2026-01-01T00:00:00Z',
      };
    }
    const verificationPassed = verificationResult.verified;
    phases.push({
      phase: 'VERIFICATION',
      passed: verificationPassed,
      durationMs: Date.now() - verStart,
      details: {
        verified: verificationPassed,
        driftCount: verificationResult.drift.length,
        drift: verificationResult.drift,
      },
    });
    if (!verificationPassed) {
      violations.push(...verificationResult.drift);
      auditEvents.push(`VERIFICATION_FAILED: drift=${verificationResult.drift.length}`);
      this.telemetryEmitter.emit({
        level: 'ERROR', category: 'EXECUTION', correlationId, executionId: request.executionId,
        operation: request.operation, message: 'Verification failed', metadata: { drift: verificationResult.drift },
      });
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
    } else {
      auditEvents.push(`VERIFICATION_SUCCEEDED: verified=true`);
    }

    // Phase 9: Reconciliation
    const recStart = Date.now();
    try {
      if (mutationResult && verificationResult) {
        reconciliationResult = await this.reconciliationEngine.reconcileMutation(
          request.executionId, request.operation, mutationResult, verificationResult, null,
        );
        auditEvents.push(`RECONCILIATION: outcome=${reconciliationResult.outcome}`);
        this.telemetryEmitter.emit({
          level: reconciliationResult.outcome === 'MUTATION_APPLIED' ? 'INFO' : 'WARN',
          category: 'RECONCILIATION', correlationId, executionId: request.executionId,
          operation: request.operation, message: `Reconciliation: ${reconciliationResult.outcome}`,
          metadata: { outcome: reconciliationResult.outcome },
        });
        if (reconciliationResult.outcome !== 'MUTATION_APPLIED') {
          violations.push(`Reconciliation failed: ${reconciliationResult.outcome}`);
          outcome = 'SANDBOX_FAILED';
          await this.idempotencyStore.fail(idempotencyKey, `Reconciliation: ${reconciliationResult.outcome}`);
        }
      }
    } catch (e) {
      auditEvents.push(`RECONCILIATION_FAILED: ${(e as Error).message}`);
      violations.push(`Reconciliation threw: ${(e as Error).message}`);
    }
    phases.push({
      phase: 'RECONCILIATION',
      passed: reconciliationResult ? reconciliationResult.outcome === 'MUTATION_APPLIED' : true,
      durationMs: Date.now() - recStart,
      details: reconciliationResult ? { outcome: reconciliationResult.outcome } : { skipped: true },
    });

    // Phase 10: Post-Execution Audit
    auditEvents.push(`POST_EXECUTION: outcome=${outcome} transport=${transportInvoked}`);
    phases.push({
      phase: 'AUDIT_POST',
      passed: outcome === 'SANDBOX_COMPLETED',
      durationMs: 0,
      details: { totalAuditEvents: auditEvents.length },
    });

    // Phase 11: Completed
    phases.push({
      phase: 'COMPLETED',
      passed: outcome === 'SANDBOX_COMPLETED',
      durationMs: 0,
      details: { outcome },
    });

    if (outcome === 'SANDBOX_COMPLETED') {
      await this.idempotencyStore.complete(idempotencyKey, {
        mutationId: mutationResult?.mutationId,
        outcome,
      });
      this.telemetryEmitter.emit({
        level: 'INFO', category: 'EXECUTION', correlationId, executionId: request.executionId,
        operation: request.operation, message: 'Pipeline execution completed successfully',
        metadata: { outcome },
      });
    }

    return this.buildReport(request, outcome, phases, mutationResult, verificationResult, rollbackResult, approvalVerdict, rollbackPlan, auditEvents, transportInvoked, violations);
  }

  private async attemptRollback(
    request: ExecutionRequest,
    candidate: QueueCandidate,
    cause: Error,
  ) {
    try {
      return await this.config.adapter.rollback(request, cause, candidate);
    } catch {
      return {
        rollbackApplied: false,
        providerState: {},
        rollbackId: '',
        rolledBackAt: '2026-01-01T00:00:00Z',
      };
    }
  }

  private buildReport(
    request: ExecutionRequest,
    outcome: SandboxExecutionOutcome,
    phases: SandboxPhaseResult[],
    mutationResult: ProviderMutationResult | null,
    verificationResult: any,
    rollbackResult: any,
    approvalVerdict: ApprovalVerdict | null,
    rollbackPlan: RollbackPlan | null,
    auditEvents: string[],
    transportInvoked: boolean,
    violations: string[],
  ): SandboxExecutionReport {
    return {
      executionId: request.executionId,
      operation: request.operation,
      outcome,
      phases,
      mutationResult,
      verificationResult,
      rollbackResult,
      approvalVerdict,
      rollbackPlan,
      auditEvents,
      transportInvoked,
      violations,
      generatedAt: '2026-01-01T00:00:00Z',
    };
  }

  private createDefaultRollbackPlan(
    request: ExecutionRequest,
    targetCalendarId: string,
  ): RollbackPlan {
    const compensatingOp = this.getCompensatingOperation(request.operation);
    return {
      rollbackId: `sandbox-rb-${request.executionId}`,
      executionId: request.executionId,
      connectorId: request.connectorId,
      operation: request.operation,
      scope: 'FULL',
      strategy: 'COMPENSATING',
      steps: [{
        stepIndex: 0,
        action: request.operation,
        compensatingOperation: compensatingOp,
        parameters: { calendarId: targetCalendarId },
        reversible: request.operation !== 'events.delete',
      }],
      plannedAt: '2026-01-01T00:00:00Z',
      planHash: `sandbox-rb-hash-${request.executionId}`,
    };
  }

  private resolveCalendarId(request: ExecutionRequest, candidate: QueueCandidate): string {
    const policyConfig = this.config.policy ?? DEFAULT_SANDBOX_POLICY;
    return candidate.executionManifest?.resourceSummary?.targetId
      ?? policyConfig.sandboxCalendarId
      ?? 'sandbox-test-calendar@group.calendar.google.com';
  }

  private getRiskLevel(operation: string): string {
    if (operation === 'events.delete') return 'DESTRUCTIVE';
    if (operation === 'events.insert' || operation === 'events.update') return 'MODIFY';
    return 'READ';
  }

  private getApprovalLevel(operation: string): ApprovalLevel {
    if (operation === 'events.delete') return 'HEIGHTENED';
    if (operation === 'events.insert' || operation === 'events.update') return 'STANDARD';
    return 'NONE';
  }

  private getCompensatingOperation(operation: string): string {
    switch (operation) {
      case 'events.insert': return 'events.delete';
      case 'events.update': return 'events.update';
      case 'events.delete': return 'events.insert';
      default: return operation;
    }
  }
}
