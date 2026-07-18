import { QueueCandidate } from "../queue/types";
import { ExecutionRequest } from "./execution-request";
import { ProviderMutationResult } from "./connector-execution-adapter";

export type RollbackScope = 'FULL' | 'PARTIAL' | 'NONE';

export type RollbackStrategy = 'REVERSE_ORDER' | 'COMPENSATING' | 'STATE_RESTORE';

export interface RollbackPlan {
  rollbackId: string;
  executionId: string;
  connectorId: string;
  operation: string;
  scope: RollbackScope;
  strategy: RollbackStrategy;
  steps: RollbackStepDescriptor[];
  plannedAt: string;
  planHash: string;
}

export interface RollbackStepDescriptor {
  stepIndex: number;
  action: string;
  compensatingOperation: string;
  parameters: Record<string, unknown>;
  reversible: boolean;
}

export interface RollbackExecutor {
  readonly supportsRollback: boolean;
  readonly rollbackStrategies: RollbackStrategy[];

  plan(request: ExecutionRequest, candidate: QueueCandidate): Promise<RollbackPlan>;
}
