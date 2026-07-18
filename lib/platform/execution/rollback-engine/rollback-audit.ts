import { RollbackAuditEvent, CompensationChain } from "./types";

export class RollbackAudit {
  private events: RollbackAuditEvent[] = [];

  recordPlanGenerated(
    transactionId: string,
    chain: CompensationChain,
    detail: string,
  ): RollbackAuditEvent {
    return this.addEvent({
      eventId: `rb-ev-${transactionId}-plan`,
      transactionId,
      eventType: 'PLAN_GENERATED',
      stepIndex: null,
      detail,
      timestamp: '2026-01-01T00:00:00Z',
    });
  }

  recordCompensationStarted(
    transactionId: string,
    detail: string,
  ): RollbackAuditEvent {
    return this.addEvent({
      eventId: `rb-ev-${transactionId}-start`,
      transactionId,
      eventType: 'COMPENSATION_STARTED',
      stepIndex: null,
      detail,
      timestamp: '2026-01-01T00:00:00Z',
    });
  }

  recordStepExecuted(
    transactionId: string,
    stepIndex: number,
    detail: string,
  ): RollbackAuditEvent {
    return this.addEvent({
      eventId: `rb-ev-${transactionId}-step-${stepIndex}`,
      transactionId,
      eventType: 'COMPENSATION_STEP_EXECUTED',
      stepIndex,
      detail,
      timestamp: '2026-01-01T00:00:00Z',
    });
  }

  recordCompensationCompleted(
    transactionId: string,
    detail: string,
  ): RollbackAuditEvent {
    return this.addEvent({
      eventId: `rb-ev-${transactionId}-done`,
      transactionId,
      eventType: 'COMPENSATION_COMPLETED',
      stepIndex: null,
      detail,
      timestamp: '2026-01-01T00:00:00Z',
    });
  }

  recordRollbackFailed(
    transactionId: string,
    stepIndex: number | null,
    detail: string,
  ): RollbackAuditEvent {
    return this.addEvent({
      eventId: `rb-ev-${transactionId}-fail`,
      transactionId,
      eventType: 'ROLLBACK_FAILED',
      stepIndex,
      detail,
      timestamp: '2026-01-01T00:00:00Z',
    });
  }

  recordRollbackCompleted(
    transactionId: string,
    detail: string,
  ): RollbackAuditEvent {
    return this.addEvent({
      eventId: `rb-ev-${transactionId}-complete`,
      transactionId,
      eventType: 'ROLLBACK_COMPLETED',
      stepIndex: null,
      detail,
      timestamp: '2026-01-01T00:00:00Z',
    });
  }

  getEvents(): RollbackAuditEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }

  private addEvent(event: RollbackAuditEvent): RollbackAuditEvent {
    this.events.push(event);
    return event;
  }
}
