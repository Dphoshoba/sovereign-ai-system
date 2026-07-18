export type CompensationStrategy = 'REVERSE_ORDER' | 'COMPENSATING' | 'STATE_RESTORE';

export interface CompensationStep {
  stepIndex: number;
  originalAction: string;
  compensatingAction: string;
  parameters: Record<string, unknown>;
  reversible: boolean;
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
}

export interface CompensationChain {
  chainId: string;
  executionId: string;
  strategy: CompensationStrategy;
  steps: CompensationStep[];
  generatedAt: string;
  chainHash: string;
  totalSteps: number;
  completedSteps: number;
}

export type RollbackTransactionState =
  | 'TRANSACTION_PENDING'
  | 'TRANSACTION_PLANNING'
  | 'TRANSACTION_EXECUTING'
  | 'TRANSACTION_COMPLETED'
  | 'TRANSACTION_FAILED'
  | 'TRANSACTION_PARTIAL';

export interface RollbackTransaction {
  transactionId: string;
  executionId: string;
  rollbackId: string;
  state: RollbackTransactionState;
  chain: CompensationChain;
  startedAt: string;
  completedAt: string | null;
  failureReason: string | null;
}

export interface RollbackAuditEvent {
  eventId: string;
  transactionId: string;
  eventType: 'PLAN_GENERATED' | 'COMPENSATION_STARTED' | 'COMPENSATION_STEP_EXECUTED' | 'COMPENSATION_COMPLETED' | 'ROLLBACK_FAILED' | 'ROLLBACK_COMPLETED';
  stepIndex: number | null;
  detail: string;
  timestamp: string;
}
