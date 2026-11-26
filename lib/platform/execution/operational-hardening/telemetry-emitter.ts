export type TelemetryLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
export type TelemetryCategory = 'EXECUTION' | 'RETRY' | 'RECONCILIATION' | 'IDEMPOTENCY' | 'CREDENTIAL' | 'RATE_LIMIT' | 'ROLLBACK' | 'AUDIT';

export interface TelemetryEvent {
  timestamp: string;
  level: TelemetryLevel;
  category: TelemetryCategory;
  correlationId: string;
  executionId: string;
  operation: string;
  message: string;
  durationMs?: number;
  attempt?: number;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface TelemetrySnapshot {
  executionCount: number;
  retryCount: number;
  rateLimitCount: number;
  reconciliationCount: number;
  errorCount: number;
  credentialRotationCount: number;
  averageExecutionMs: number;
}

export class TelemetryEmitter {
  private events: TelemetryEvent[] = [];
  private counters: Record<string, number> = {};
  private latencies: number[] = [];

  emit(event: Omit<TelemetryEvent, 'timestamp'>): void {
    const full: TelemetryEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    this.events.push(full);
    this.counters[event.category] = (this.counters[event.category] ?? 0) + 1;
    if (event.level === 'ERROR') {
      this.counters['ERROR'] = (this.counters['ERROR'] ?? 0) + 1;
    }
    if (event.durationMs !== undefined) {
      this.latencies.push(event.durationMs);
    }
  }

  getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  getEventsByCorrelation(correlationId: string): TelemetryEvent[] {
    return this.events.filter(e => e.correlationId === correlationId);
  }

  getEventsByCategory(category: TelemetryCategory): TelemetryEvent[] {
    return this.events.filter(e => e.category === category);
  }

  getSnapshot(): TelemetrySnapshot {
    const totalLatency = this.latencies.reduce((sum, l) => sum + l, 0);
    const totalExecution = this.latencies.length;
    return {
      executionCount: this.counters['EXECUTION'] ?? 0,
      retryCount: this.counters['RETRY'] ?? 0,
      rateLimitCount: this.counters['RATE_LIMIT'] ?? 0,
      reconciliationCount: this.counters['RECONCILIATION'] ?? 0,
      errorCount: this.counters['ERROR'] ?? 0,
      credentialRotationCount: this.counters['CREDENTIAL'] ?? 0,
      averageExecutionMs: totalExecution > 0 ? Math.round(totalLatency / totalExecution) : 0,
    };
  }

  clear(): void {
    this.events = [];
    this.counters = {};
    this.latencies = [];
  }
}
