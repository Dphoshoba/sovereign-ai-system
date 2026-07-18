import { ExecutionRequest } from '../../execution-request';
import { QueueCandidate } from '../../../queue/types';
import { RollbackPlan, RollbackResult } from '../../rollback-contract';
import { RollbackExecutorImpl } from '../../rollback-executor-impl';
import { SandboxPhaseResult } from './sandbox-execution-report';
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
