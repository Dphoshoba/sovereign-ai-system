import {
  AuditEvent,
  AuditEventInput,
  DistributedAuditTrail,
  AuditEventType,
} from "./distributed-audit-trail";

let nextEventId = 0;

export class DistributedAuditTrailImpl implements DistributedAuditTrail {
  private readonly events: AuditEvent[] = [];

  record(input: AuditEventInput): AuditEvent {
    nextEventId++;
    const event: AuditEvent = {
      eventId: `audit-${nextEventId}`,
      transactionId: input.transactionId,
      correlationId: input.correlationId,
      providerId: input.providerId,
      stepIndex: input.stepIndex,
      action: input.action,
      timestamp: new Date().toISOString(),
      detail: { ...input.detail },
      eventType: input.eventType,
    };
    this.events.push(event);
    return event;
  }

  getByTransactionId(transactionId: string): readonly AuditEvent[] {
    return this.events.filter((e) => e.transactionId === transactionId);
  }

  getByCorrelationId(correlationId: string): readonly AuditEvent[] {
    return this.events.filter((e) => e.correlationId === correlationId);
  }

  getByProviderId(providerId: string): readonly AuditEvent[] {
    return this.events.filter((e) => e.providerId === providerId);
  }

  getByEventType(eventType: AuditEventType): readonly AuditEvent[] {
    return this.events.filter((e) => e.eventType === eventType);
  }

  getByTimeRange(from: string, to: string): readonly AuditEvent[] {
    return this.events.filter((e) => e.timestamp >= from && e.timestamp <= to);
  }
}
