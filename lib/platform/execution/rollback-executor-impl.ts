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
import { TelemetryEmitter } from './operational-hardening/telemetry-emitter';
import { RetryPolicy } from './operational-hardening/retry-policy';
import { ProviderErrorInfo } from './provider-contracts/provider-error';

export interface RollbackExecutorConfig {
  adapter: ConnectorExecutionAdapter;
  planner?: RollbackPlanner;
  validator?: RollbackValidator;
  audit?: RollbackAudit;
  telemetryEmitter?: TelemetryEmitter;
  retryPolicy?: RetryPolicy;
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

  constructor(config: RollbackExecutorConfig) {
    this.adapter = config.adapter;
    this.planner = config.planner ?? new RollbackPlanner();
    this.validator = config.validator ?? new RollbackValidator();
    this.audit = config.audit ?? new RollbackAudit();
    this.telemetryEmitter = config.telemetryEmitter ?? new TelemetryEmitter();
    this.retryPolicy = config.retryPolicy ?? new RetryPolicy({ maxRetries: 2 });
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
