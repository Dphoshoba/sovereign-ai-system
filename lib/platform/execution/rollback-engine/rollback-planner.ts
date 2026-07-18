import { ExecutionRequest } from "../execution-request";
import { QueueCandidate } from "../../queue/types";
import { RollbackPlan, RollbackExecutor, RollbackScope, RollbackStrategy } from "../rollback-contract";
import { CompensationPlanGenerator } from "./compensation-plan";
import { CompensationChain } from "./types";

function computePlanHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash |= 0;
  }
  return `rb-plan-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

export interface PlannerResult {
  plan: RollbackPlan;
  chain: CompensationChain;
  warnings: string[];
}

export class RollbackPlanner {
  constructor(
    private executor?: RollbackExecutor,
    private compensationGenerator: CompensationPlanGenerator = new CompensationPlanGenerator(),
  ) {}

  supportsRollback(): boolean {
    return this.executor?.supportsRollback === true;
  }

  async plan(
    request: ExecutionRequest,
    candidate: QueueCandidate,
  ): Promise<PlannerResult> {
    const warnings: string[] = [];

    if (!this.executor || !this.executor.supportsRollback) {
      warnings.push('No rollback executor configured — generating synthetic plan');
      const syntheticPlan = this.generateSyntheticPlan(request, candidate);
      const chain = this.compensationGenerator.generate(syntheticPlan);
      return { plan: syntheticPlan, chain, warnings };
    }

    const plan = await this.executor.plan(request, candidate);

    const serialized = JSON.stringify(plan);
    const planHash = computePlanHash(serialized);
    const verifiedPlan: RollbackPlan = { ...plan, planHash };

    if (!verifiedPlan.rollbackId) {
      verifiedPlan.rollbackId = `rb-${request.executionId}`;
    }
    if (!verifiedPlan.plannedAt) {
      verifiedPlan.plannedAt = '2026-01-01T00:00:00Z';
    }

    if (verifiedPlan.steps.length === 0) {
      warnings.push('Rollback plan has no steps — rollback will be a no-op');
    }

    const chain = this.compensationGenerator.generate(verifiedPlan);
    return { plan: verifiedPlan, chain, warnings };
  }

  private generateSyntheticPlan(
    request: ExecutionRequest,
    candidate: QueueCandidate,
  ): RollbackPlan {
    const stepDescriptors = [
      {
        stepIndex: 0,
        action: request.operation,
        compensatingOperation: `undo-${request.operation}`,
        parameters: { queueId: candidate.queueId, planHash: request.planHash },
        reversible: true,
      },
    ];

    const serialized = JSON.stringify({
      executionId: request.executionId,
      operation: request.operation,
      stepDescriptors,
    });
    const planHash = computePlanHash(serialized);

    return {
      rollbackId: `rb-${request.executionId}`,
      executionId: request.executionId,
      connectorId: request.connectorId,
      operation: request.operation,
      scope: 'FULL',
      strategy: 'REVERSE_ORDER',
      steps: stepDescriptors,
      plannedAt: '2026-01-01T00:00:00Z',
      planHash,
    };
  }
}
