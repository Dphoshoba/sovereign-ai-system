import { ExecutionRequest } from "../execution-request";
import { QueueCandidate } from "../../queue/types";
import { RollbackPlan } from "../rollback-contract";
import { RollbackPlanner, PlannerResult } from "./rollback-planner";
import { RollbackValidator } from "./rollback-validator";
import { RollbackAudit } from "./rollback-audit";
import { CompensationPlanGenerator } from "./compensation-plan";
import {
  CompensationChain,
  CompensationStep,
  RollbackTransaction,
  RollbackTransactionState,
} from "./types";

export type SimulationOutcome =
  | 'SIMULATION_SUCCEEDED'
  | 'SIMULATION_PARTIAL'
  | 'SIMULATION_FAILED';

export interface SimulationResult {
  outcome: SimulationOutcome;
  transaction: RollbackTransaction;
  auditEvents: string[];
  warnings: string[];
}

export class RollbackCoordinator {
  private validator = new RollbackValidator();
  private audit = new RollbackAudit();
  private compensationGenerator = new CompensationPlanGenerator();

  constructor(private planner: RollbackPlanner) {}

  getAudit(): RollbackAudit {
    return this.audit;
  }

  getValidator(): RollbackValidator {
    return this.validator;
  }

  async simulateRollback(
    request: ExecutionRequest,
    candidate: QueueCandidate,
  ): Promise<SimulationResult> {
    const warnings: string[] = [];

    const plannerResult = await this.planner.plan(request, candidate);
    warnings.push(...plannerResult.warnings);

    const planValidation = this.validator.validatePlan(plannerResult.plan);
    if (!planValidation.valid) {
      this.audit.recordRollbackFailed(
        `tx-${request.executionId}`,
        null,
        `Plan validation failed: ${planValidation.errors.join('; ')}`,
      );
      return {
        outcome: 'SIMULATION_FAILED',
        transaction: this.buildFailedTransaction(request, plannerResult.plan, planValidation.errors.join('; ')),
        auditEvents: this.audit.getEvents().map((e) => `${e.eventType}: ${e.detail}`),
        warnings: [...warnings, ...planValidation.errors],
      };
    }
    warnings.push(...planValidation.warnings);

    const chainValidation = this.validator.validateChain(plannerResult.chain);
    if (!chainValidation.valid) {
      this.audit.recordRollbackFailed(
        `tx-${request.executionId}`,
        null,
        `Chain validation failed: ${chainValidation.errors.join('; ')}`,
      );
      return {
        outcome: 'SIMULATION_FAILED',
        transaction: this.buildFailedTransaction(request, plannerResult.plan, chainValidation.errors.join('; ')),
        auditEvents: this.audit.getEvents().map((e) => `${e.eventType}: ${e.detail}`),
        warnings: [...warnings, ...chainValidation.errors],
      };
    }
    warnings.push(...chainValidation.warnings);

    const transactionId = `tx-${request.executionId}`;
    this.audit.recordPlanGenerated(transactionId, plannerResult.chain, 'Plan generated');

    this.audit.recordCompensationStarted(transactionId, 'Compensation started');

    const simulatedChain = this.compensationGenerator.simulateExecute(plannerResult.chain);

    for (const step of simulatedChain.steps) {
      this.audit.recordStepExecuted(transactionId, step.stepIndex, step.status);
    }

    const reversibleCount = this.compensationGenerator.getReversibleSteps(simulatedChain).length;
    const nonReversibleCount = this.compensationGenerator.getNonReversibleSteps(simulatedChain).length;

    const allCompleted = simulatedChain.steps.every((s) => s.status === 'COMPLETED');
    const anyCompleted = simulatedChain.steps.some((s) => s.status === 'COMPLETED');

    let outcome: SimulationOutcome;
    if (allCompleted) {
      this.audit.recordCompensationCompleted(transactionId, `All ${simulatedChain.steps.length} steps completed`);
      this.audit.recordRollbackCompleted(transactionId, 'Rollback simulation completed successfully');
      outcome = 'SIMULATION_SUCCEEDED';
    } else if (anyCompleted) {
      this.audit.recordRollbackFailed(transactionId, simulatedChain.steps.findIndex((s) => s.status === 'FAILED'),
        'Some steps failed during simulation');
      outcome = 'SIMULATION_PARTIAL';
    } else {
      this.audit.recordRollbackFailed(transactionId, simulatedChain.steps.findIndex((s) => s.status === 'FAILED'),
        'All steps failed during simulation');
      outcome = 'SIMULATION_FAILED';
    }

    if (nonReversibleCount > 0) {
      warnings.push(`${nonReversibleCount} non-reversible step(s) in compensation chain`);
    }

    const transaction: RollbackTransaction = {
      transactionId,
      executionId: request.executionId,
      rollbackId: plannerResult.plan.rollbackId,
      state: outcome === 'SIMULATION_SUCCEEDED' ? 'TRANSACTION_COMPLETED'
        : outcome === 'SIMULATION_PARTIAL' ? 'TRANSACTION_PARTIAL'
        : 'TRANSACTION_FAILED',
      chain: simulatedChain,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      failureReason: outcome === 'SIMULATION_SUCCEEDED' ? null : 'Simulation did not fully succeed',
    };

    return {
      outcome,
      transaction,
      auditEvents: this.audit.getEvents().map((e) => `${e.eventType}: ${e.detail}`),
      warnings,
    };
  }

  private buildFailedTransaction(
    request: ExecutionRequest,
    plan: RollbackPlan,
    reason: string,
  ): RollbackTransaction {
    return {
      transactionId: `tx-${request.executionId}`,
      executionId: request.executionId,
      rollbackId: plan.rollbackId,
      state: 'TRANSACTION_FAILED',
      chain: {
        chainId: `chain-${plan.rollbackId}`,
        executionId: request.executionId,
        strategy: plan.strategy,
        steps: [],
        generatedAt: new Date().toISOString(),
        chainHash: 'failed',
        totalSteps: 0,
        completedSteps: 0,
      },
      startedAt: new Date().toISOString(),
      completedAt: null,
      failureReason: reason,
    };
  }
}
