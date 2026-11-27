export type AuditEventType =
  | 'STEP_STARTED'
  | 'STEP_COMPLETED'
  | 'STEP_FAILED'
  | 'TRANSACTION_STARTED'
  | 'TRANSACTION_COMMITTED'
  | 'TRANSACTION_ABORTED'
  | 'COMPENSATION_EXECUTED'
  | 'COMPENSATION_FAILED';

export interface AuditEvent {
  readonly eventId: string;
  readonly transactionId: string;
  readonly correlationId: string;
  readonly providerId: string;
  readonly stepIndex: number;
  readonly action: string;
  readonly timestamp: string;
  readonly detail: Readonly<Record<string, unknown>>;
  readonly eventType: AuditEventType;
}

export interface AuditEventInput {
  readonly transactionId: string;
  readonly correlationId: string;
  readonly providerId: string;
  readonly stepIndex: number;
  readonly action: string;
  readonly detail: Readonly<Record<string, unknown>>;
  readonly eventType: AuditEventType;
}

export interface DistributedAuditTrail {
  record(event: AuditEventInput): AuditEvent;
  getByTransactionId(transactionId: string): readonly AuditEvent[];
  getByCorrelationId(correlationId: string): readonly AuditEvent[];
  getByProviderId(providerId: string): readonly AuditEvent[];
  getByEventType(eventType: AuditEventType): readonly AuditEvent[];
  getByTimeRange(from: string, to: string): readonly AuditEvent[];
}
