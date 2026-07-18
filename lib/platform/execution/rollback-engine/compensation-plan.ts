import { RollbackPlan, RollbackStepDescriptor } from "../rollback-contract";
import { CompensationChain, CompensationStep, CompensationStrategy } from "./types";

function computeChainHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash |= 0;
  }
  return `chain-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

export class CompensationPlanGenerator {
  generate(plan: RollbackPlan): CompensationChain {
    const steps = this.orderSteps(plan);
    const serialized = JSON.stringify({ rollbackId: plan.rollbackId, strategy: plan.strategy, steps });
    const chainHash = computeChainHash(serialized);

    return {
      chainId: `chain-${plan.rollbackId}`,
      executionId: plan.executionId,
      strategy: plan.strategy,
      steps,
      generatedAt: '2026-01-01T00:00:00Z',
      chainHash,
      totalSteps: steps.length,
      completedSteps: 0,
    };
  }

  private orderSteps(plan: RollbackPlan): CompensationStep[] {
    const steps = plan.steps.map((s, i) => this.toCompensationStep(s, i));

    switch (plan.strategy) {
      case 'REVERSE_ORDER':
        return steps.reverse();
      case 'COMPENSATING':
        return steps;
      case 'STATE_RESTORE':
        return steps;
      default:
        return steps;
    }
  }

  private toCompensationStep(
    desc: RollbackStepDescriptor,
    index: number,
  ): CompensationStep {
    return {
      stepIndex: index,
      originalAction: desc.action,
      compensatingAction: desc.compensatingOperation,
      parameters: { ...desc.parameters },
      reversible: desc.reversible,
      status: 'PENDING',
    };
  }

  simulateExecute(chain: CompensationChain): CompensationChain {
    const updatedSteps = chain.steps.map((step) => {
      if (step.reversible) {
        return { ...step, status: 'COMPLETED' as const };
      }
      return { ...step, status: 'FAILED' as const };
    });

    const completed = updatedSteps.filter((s) => s.status === 'COMPLETED').length;
    const failed = updatedSteps.filter((s) => s.status === 'FAILED').length;

    return {
      ...chain,
      steps: updatedSteps,
      completedSteps: completed,
      totalSteps: chain.steps.length,
    };
  }

  getReversibleSteps(chain: CompensationChain): CompensationStep[] {
    return chain.steps.filter((s) => s.reversible);
  }

  getNonReversibleSteps(chain: CompensationChain): CompensationStep[] {
    return chain.steps.filter((s) => !s.reversible);
  }
}
