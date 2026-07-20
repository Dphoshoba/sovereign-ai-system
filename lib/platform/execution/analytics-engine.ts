// ── Time Window ──

export interface TimeWindow {
  readonly start: number;
  readonly end: number;
}

// ── Telemetry Event ──

export type TelemetrySourceLayer = 'runtime' | 'provider' | 'workflow' | 'planning' | 'scheduling';

export interface TelemetryEvent {
  readonly eventType: string;
  readonly sourceLayer: TelemetrySourceLayer;
  readonly timestamp: number;
  readonly duration: number | null;
  readonly status: string;
  readonly workflowId: string | null;
  readonly executionId: string | null;
  readonly providerId: string | null;
  readonly metadata: Readonly<Record<string, unknown>>;
}

// ── Statistics ──

export interface Stats {
  readonly count: number;
  readonly sum: number;
  readonly avg: number;
  readonly min: number;
  readonly max: number;
}

// ── Trend ──

export type TrendDirection = 'increasing' | 'decreasing' | 'stable';

export interface DataPoint {
  readonly timestamp: number;
  readonly value: number;
}

export interface Trend {
  readonly metric: string;
  readonly dataPoints: readonly DataPoint[];
  readonly direction: TrendDirection;
  readonly slope: number;
}

// ── Forecast ──

export interface Forecast {
  readonly metric: string;
  readonly horizon: number;
  readonly predictedValue: number;
  readonly confidence: number;
  readonly basedOn: number;
}

// ── Operational Summary ──

export interface OperationalSummary {
  readonly window: TimeWindow;
  readonly throughput: number;
  readonly completionRate: number;
  readonly avgExecutionDuration: number;
  readonly recoveryRate: number;
  readonly compensationRate: number;
  readonly queueGrowth: number;
  readonly slotUtilization: number;
  readonly arrivalRate: number;
}

// ── Cross-Workflow Analytics ──

export interface CrossWorkflowAnalytics {
  readonly window: TimeWindow;
  readonly throughput: number;
  readonly completionRate: number;
  readonly avgExecutionDuration: number;
  readonly recoveryFrequency: number;
  readonly compensationFrequency: number;
}

// ── Performance Insights ──

export interface PerformanceInsights {
  readonly window: TimeWindow;
  readonly planningLatency: Stats;
  readonly schedulingLatency: Stats;
  readonly workflowExecutionDuration: Stats;
  readonly providerExecutionTime: Stats;
  readonly queueWaitTime: Stats;
}

// ── Analytics Engine ──

export interface AnalyticsEngine {
  ingest(events: readonly TelemetryEvent[]): void;
  getCrossWorkflowAnalytics(window: TimeWindow): CrossWorkflowAnalytics;
  getPerformanceInsights(window: TimeWindow): PerformanceInsights;
  forecastQueueGrowth(window: TimeWindow, horizon: number): Forecast;
  forecastSlotUtilization(window: TimeWindow, horizon: number): Forecast;
  getArrivalRate(window: TimeWindow): number;
  projectSaturation(window: TimeWindow, horizon: number): Forecast;
  getOperationalSummary(window: TimeWindow): OperationalSummary;
  getTrend(metric: string, window: TimeWindow, intervalMs: number): Trend;
}
