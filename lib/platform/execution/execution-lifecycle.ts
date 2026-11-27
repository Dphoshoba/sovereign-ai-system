export type S3BPhase =
  | 'S3B_INITIAL'
  | 'S3B_APPROVAL'
  | 'S3B_EXECUTION'
  | 'S3B_VERIFICATION'
  | 'S3B_AUDIT'
  | 'S3B_ROLLBACK'
  | 'S3B_COMPLETED'
  | 'S3B_FAILED';

export interface S3BPhaseTransition {
  from: S3BPhase;
  to: S3BPhase;
  timestamp: string;
}

export const S3B_PHASE_TRANSITIONS: Record<S3BPhase, S3BPhase[]> = {
  S3B_INITIAL: ['S3B_APPROVAL', 'S3B_FAILED'],
  S3B_APPROVAL: ['S3B_EXECUTION', 'S3B_ROLLBACK', 'S3B_FAILED'],
  S3B_EXECUTION: ['S3B_VERIFICATION', 'S3B_ROLLBACK', 'S3B_FAILED'],
  S3B_VERIFICATION: ['S3B_AUDIT', 'S3B_ROLLBACK', 'S3B_FAILED'],
  S3B_AUDIT: ['S3B_COMPLETED', 'S3B_FAILED'],
  S3B_ROLLBACK: ['S3B_AUDIT', 'S3B_FAILED'],
  S3B_COMPLETED: [],
  S3B_FAILED: [],
};

export interface S3BAuditEvent {
  phase: S3BPhase;
  event: string;
  detail: string;
  timestamp: string;
}

export class ExecutionLifecycle {
  private currentPhase: S3BPhase = 'S3B_INITIAL';
  private transitions: S3BPhaseTransition[] = [];
  private phaseEvents: S3BAuditEvent[] = [];

  getPhase(): S3BPhase {
    return this.currentPhase;
  }

  getTransitions(): S3BPhaseTransition[] {
    return [...this.transitions];
  }

  getPhaseEvents(): S3BAuditEvent[] {
    return [...this.phaseEvents];
  }

  transitionTo(target: S3BPhase): boolean {
    const allowed = S3B_PHASE_TRANSITIONS[this.currentPhase];
    if (!allowed.includes(target)) {
      return false;
    }
    this.transitions.push({
      from: this.currentPhase,
      to: target,
      timestamp: '2026-01-01T00:00:00Z',
    });
    this.currentPhase = target;
    return true;
  }

  recordEvent(event: string, detail: string): void {
    this.phaseEvents.push({
      phase: this.currentPhase,
      event,
      detail,
      timestamp: '2026-01-01T00:00:00Z',
    });
  }

  reset(): void {
    this.currentPhase = 'S3B_INITIAL';
    this.transitions = [];
    this.phaseEvents = [];
  }

  isTerminal(): boolean {
    return this.currentPhase === 'S3B_COMPLETED' || this.currentPhase === 'S3B_FAILED';
  }
}
