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
      timestamp: new Date().toISOString(),
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
      timestamp: new Date().toISOString(),
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
      timestamp: new Date().toISOString(),
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
      timestamp: new Date().toISOString(),
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
      timestamp: new Date().toISOString(),
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
      timestamp: new Date().toISOString(),
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
