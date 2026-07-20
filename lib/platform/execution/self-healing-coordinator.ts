import { OperationalDecision } from "./autonomous-decision";

export type HealingStatus = 'idle' | 'healing' | 'completed' | 'escalated' | 'failed';

export type RecoveryStrategy =
  | 'retry'
  | 'rollback'
  | 'reconcile'
  | 'credential_rotation'
  | 'circuit_breaker_reset'
  | 'workflow_recovery';

export interface HealingAction {
  readonly id: string;
  readonly strategy: RecoveryStrategy;
  readonly success: boolean;
  readonly durationMs: number;
  readonly detail: string;
  readonly error: string | null;
}

export interface HealingReport {
  readonly reportId: string;
  readonly decisionId: string;
  readonly state: 'completed' | 'partial' | 'failed' | 'escalated';
  readonly actions: readonly HealingAction[];
  readonly summary: string;
  readonly startedAt: number;
  readonly completedAt: number;
}

export interface SelfHealingCoordinator {
  heal(decision: OperationalDecision): Promise<HealingReport>;
  getStatus(): HealingStatus;
}

export class SelfHealingCoordinatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SelfHealingCoordinatorError';
  }
}
