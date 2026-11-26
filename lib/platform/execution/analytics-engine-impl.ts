import {
  AnalyticsEngine,
  CrossWorkflowAnalytics,
  DataPoint,
  Forecast,
  OperationalSummary,
  PerformanceInsights,
  Stats,
  TelemetryEvent,
  TimeWindow,
  Trend,
  TrendDirection,
} from "./analytics-engine";

export class AnalyticsEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalyticsEngineError';
  }
}

export class AnalyticsEngineImpl implements AnalyticsEngine {
  private events: TelemetryEvent[] = [];

  ingest(events: readonly TelemetryEvent[]): void {
    this.events.push(...events);
  }

  // ── 6C.1 — Cross-Workflow Analytics ──

  getCrossWorkflowAnalytics(window: TimeWindow): CrossWorkflowAnalytics {
    const completed = this.filterEvents(window, 'workflow', 'workflow_complete', 'success');
    const failed = this.filterEvents(window, 'workflow', 'workflow_complete', 'failure');
    const total = completed.length + failed.length;

    const windowDurationMs = window.end - window.start;
    const throughput = windowDurationMs > 0 ? total / (windowDurationMs / 1000) : 0;

    const recoveryEvents = this.filterEvents(window, 'workflow', 'workflow_recovery', 'success');
    const compensationEvents = this.filterEvents(window, 'workflow', 'workflow_compensation', 'success');

    return {
      window,
      throughput: round(throughput, 2),
      completionRate: total > 0 ? round(completed.length / total, 4) : 0,
      avgExecutionDuration: completed.length > 0
        ? round(completed.reduce((s, e) => s + (e.duration ?? 0), 0) / completed.length, 0)
        : 0,
      recoveryFrequency: windowDurationMs > 0
        ? round(recoveryEvents.length / (windowDurationMs / 60000), 2)
        : 0,
      compensationFrequency: windowDurationMs > 0
        ? round(compensationEvents.length / (windowDurationMs / 60000), 2)
        : 0,
    };
  }

  // ── 6C.2 — Performance Insights ──

  getPerformanceInsights(window: TimeWindow): PerformanceInsights {
    return {
      window,
      planningLatency: this.computeStats(this.filterEvents(window, 'planning', undefined, undefined)),
      schedulingLatency: this.computeStats(this.filterEvents(window, 'scheduling', undefined, undefined)),
      workflowExecutionDuration: this.computeStats(
        this.filterEvents(window, 'workflow', 'workflow_complete', 'success'),
      ),
      providerExecutionTime: this.computeStats(this.filterEvents(window, 'provider', undefined, undefined)),
      queueWaitTime: this.computeStats(
        this.filterEvents(window, 'scheduling', 'queue_wait', undefined),
      ),
    };
  }

  // ── 6C.3 — Capacity Forecasting ──

  forecastQueueGrowth(window: TimeWindow, horizon: number): Forecast {
    const points = this.bucketByInterval(
      this.filterEvents(window, 'scheduling', 'queue_enter', undefined),
      window,
      60000,
    );
    return this.computeForecast('queue_growth', points, horizon);
  }

  forecastSlotUtilization(window: TimeWindow, horizon: number): Forecast {
    const points = this.bucketByInterval(
      this.filterEvents(window, 'scheduling', 'slot_utilization', undefined),
      window,
      60000,
    );
    return this.computeForecast('slot_utilization', points, horizon);
  }

  getArrivalRate(window: TimeWindow): number {
    const arrivals = this.filterEvents(window, 'workflow', 'workflow_start', undefined);
    const windowDurationMs = window.end - window.start;
    return windowDurationMs > 0 ? round(arrivals.length / (windowDurationMs / 60000), 2) : 0;
  }

  projectSaturation(window: TimeWindow, horizon: number): Forecast {
    const utilPoints = this.bucketByInterval(
      this.filterEvents(window, 'scheduling', 'slot_utilization', undefined),
      window,
      60000,
    );
    const forecast = this.computeForecast('saturation', utilPoints, horizon);
    return {
      ...forecast,
      metric: 'saturation',
      predictedValue: Math.min(100, round(forecast.predictedValue, 1)),
    };
  }

  // ── Operational Summary ──

  getOperationalSummary(window: TimeWindow): OperationalSummary {
    const analytics = this.getCrossWorkflowAnalytics(window);
    const arrivals = this.filterEvents(window, 'workflow', 'workflow_start', undefined);
    const windowDurationMs = window.end - window.start;

    // Queue growth: arrivals - completions
    const completions = this.filterEvents(window, 'workflow', 'workflow_complete', 'success');
    const queueGrowth = arrivals.length - completions.length;

    // Slot utilization: average from slot events
    const slotEvents = this.filterEvents(window, 'scheduling', 'slot_utilization', undefined);
    const avgUtilization = slotEvents.length > 0
      ? round(slotEvents.reduce((s, e) => s + (e.metadata.utilization as number ?? 0), 0) / slotEvents.length, 2)
      : 0;

    return {
      window,
      throughput: analytics.throughput,
      completionRate: analytics.completionRate,
      avgExecutionDuration: analytics.avgExecutionDuration,
      recoveryRate: analytics.recoveryFrequency,
      compensationRate: analytics.compensationFrequency,
      queueGrowth,
      slotUtilization: avgUtilization,
      arrivalRate: windowDurationMs > 0 ? round(arrivals.length / (windowDurationMs / 60000), 2) : 0,
    };
  }

  // ── Trend ──

  getTrend(metric: string, window: TimeWindow, intervalMs: number): Trend {
    const all = this.events.filter((e) => e.eventType === metric || e.eventType.endsWith(metric));
    const points = this.bucketByInterval(all, window, intervalMs);

    if (points.length < 2) {
      return { metric, dataPoints: points, direction: 'stable', slope: 0 };
    }

    const slope = computeSlope(points);
    const direction: TrendDirection = slope > 0.0001 ? 'increasing' : slope < -0.0001 ? 'decreasing' : 'stable';

    return { metric, dataPoints: points, direction, slope: round(slope, 4) };
  }

  // ── Internal ──

  private filterEvents(
    window: TimeWindow,
    sourceLayer?: string,
    eventType?: string,
    status?: string,
  ): TelemetryEvent[] {
    return this.events.filter((e) => {
      if (e.timestamp < window.start || e.timestamp > window.end) return false;
      if (sourceLayer && e.sourceLayer !== sourceLayer) return false;
      if (eventType && e.eventType !== eventType) return false;
      if (status && e.status !== status) return false;
      return true;
    });
  }

  private computeStats(events: TelemetryEvent[]): Stats {
    const durations = events.map((e) => e.duration).filter((d): d is number => d !== null);
    if (durations.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
    }
    const sorted = [...durations].sort((a, b) => a - b);
    return {
      count: durations.length,
      sum: round(durations.reduce((s, d) => s + d, 0), 0),
      avg: round(durations.reduce((s, d) => s + d, 0) / durations.length, 0),
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }

  private bucketByInterval(
    events: TelemetryEvent[],
    window: TimeWindow,
    intervalMs: number,
  ): DataPoint[] {
    if (intervalMs <= 0) return [];

    const buckets = new Map<number, number[]>();
    for (const e of events) {
      const bucketStart = Math.floor(e.timestamp / intervalMs) * intervalMs;
      if (bucketStart < window.start || bucketStart >= window.end) continue;
      if (!buckets.has(bucketStart)) buckets.set(bucketStart, []);
      buckets.get(bucketStart)!.push(e.duration ?? 1);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([ts, vals]) => ({
        timestamp: ts,
        value: round(vals.reduce((s, v) => s + v, 0) / vals.length, 2),
      }));
  }

  private computeForecast(
    metric: string,
    points: DataPoint[],
    horizon: number,
  ): Forecast {
    if (points.length < 2) {
      return { metric, horizon, predictedValue: 0, confidence: 0, basedOn: points.length };
    }

    const slope = computeSlope(points);
    const lastPoint = points[points.length - 1];
    const predictedValue = lastPoint.value + slope * (horizon / (points.length > 1
      ? (points[points.length - 1].timestamp - points[0].timestamp) / (points.length - 1)
      : 60000
    ));

    const confidence = Math.max(0, Math.min(1, round(1 - horizon / (horizon + points.length * 60000), 2)));

    return {
      metric,
      horizon,
      predictedValue: round(Math.max(0, predictedValue), 2),
      confidence,
      basedOn: points.length,
    };
  }
}

// ── Helpers ──

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function computeSlope(points: DataPoint[]): number {
  const n = points.length;
  if (n < 2) return 0;

  const sumX = points.reduce((s, p) => s + p.timestamp, 0);
  const sumY = points.reduce((s, p) => s + p.value, 0);
  const sumXY = points.reduce((s, p) => s + p.timestamp * p.value, 0);
  const sumX2 = points.reduce((s, p) => s + p.timestamp * p.timestamp, 0);

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;

  return (n * sumXY - sumX * sumY) / denominator;
}
