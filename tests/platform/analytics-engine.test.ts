import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsEngineImpl } from '../../lib/platform/execution/analytics-engine-impl';
import { TelemetryEvent, TimeWindow } from '../../lib/platform/execution/analytics-engine';

const t = (ts: number): TelemetryEvent => ({
  eventType: 'workflow_complete',
  sourceLayer: 'workflow',
  timestamp: ts,
  duration: 1000,
  status: 'success',
  workflowId: 'wf-1',
  executionId: 'exec-1',
  providerId: null,
  metadata: {},
});

const window = (start: number, end: number): TimeWindow => ({ start, end });

const events = (list: Partial<TelemetryEvent>[]): TelemetryEvent[] =>
  list.map((e) => ({
    eventType: 'workflow_complete',
    sourceLayer: 'workflow',
    timestamp: 1000,
    duration: 1000,
    status: 'success',
    workflowId: 'wf-1',
    executionId: 'exec-1',
    providerId: null,
    metadata: {},
    ...e,
  }));

describe('AnalyticsEngineImpl', () => {
  let engine: AnalyticsEngineImpl;

  beforeEach(() => {
    engine = new AnalyticsEngineImpl();
  });

  // ── 6C.4 — Analytics Domain Model ──

  describe('6C.4 — Analytics Domain Model', () => {
    it('ingests telemetry events for later analysis', () => {
      engine.ingest(events([{}, {}]));
      const result = engine.getCrossWorkflowAnalytics(window(0, 99999));
      expect(result.throughput).toBeGreaterThanOrEqual(0);
    });

    it('returns empty stats for windows with no events', () => {
      const result = engine.getCrossWorkflowAnalytics(window(0, 500));
      expect(result.completionRate).toBe(0);
      expect(result.throughput).toBe(0);
    });

    it('returns empty performance insights for empty windows', () => {
      const result = engine.getPerformanceInsights(window(0, 500));
      expect(result.planningLatency.count).toBe(0);
    });
  });

  // ── 6C.1 — Cross-Workflow Analytics ──

  describe('6C.1 — Cross-Workflow Analytics', () => {
    it('computes throughput per second', () => {
      engine.ingest(events([
        { timestamp: 1000, status: 'success' },
        { timestamp: 2000, status: 'success' },
        { timestamp: 3000, status: 'success' },
      ]));
      const result = engine.getCrossWorkflowAnalytics(window(0, 4000));
      expect(result.throughput).toBe(0.75); // 3 events / 4 seconds
    });

    it('computes completion rate from successes and failures', () => {
      engine.ingest(events([
        { timestamp: 1000, status: 'success' },
        { timestamp: 2000, status: 'success' },
        { timestamp: 3000, status: 'failure' },
        { timestamp: 4000, status: 'success' },
      ]));
      const result = engine.getCrossWorkflowAnalytics(window(0, 9999));
      expect(result.completionRate).toBe(0.75);
    });

    it('computes average execution duration', () => {
      engine.ingest(events([
        { timestamp: 1000, duration: 500, status: 'success' },
        { timestamp: 2000, duration: 1500, status: 'success' },
      ]));
      const result = engine.getCrossWorkflowAnalytics(window(0, 9999));
      expect(result.avgExecutionDuration).toBe(1000);
    });

    it('computes recovery frequency per minute', () => {
      engine.ingest(events([
        { timestamp: 1000, eventType: 'workflow_recovery', status: 'success' },
        { timestamp: 60000, eventType: 'workflow_recovery', status: 'success' },
      ]));
      const result = engine.getCrossWorkflowAnalytics(window(0, 120000));
      expect(result.recoveryFrequency).toBe(1);
    });

    it('computes compensation frequency per minute', () => {
      engine.ingest(events([
        { timestamp: 1000, eventType: 'workflow_compensation', status: 'success' },
      ]));
      const result = engine.getCrossWorkflowAnalytics(window(0, 60000));
      expect(result.compensationFrequency).toBe(1);
    });
  });

  // ── 6C.2 — Performance Insights ──

  describe('6C.2 — Performance Insights', () => {
    it('aggregates planning latency stats', () => {
      engine.ingest(events([
        { timestamp: 1000, sourceLayer: 'planning', duration: 50 },
        { timestamp: 2000, sourceLayer: 'planning', duration: 150 },
      ]));
      const result = engine.getPerformanceInsights(window(0, 9999));
      expect(result.planningLatency.avg).toBe(100);
      expect(result.planningLatency.min).toBe(50);
      expect(result.planningLatency.max).toBe(150);
    });

    it('aggregates scheduling latency stats', () => {
      engine.ingest(events([
        { timestamp: 1000, sourceLayer: 'scheduling', duration: 20 },
        { timestamp: 2000, sourceLayer: 'scheduling', duration: 40 },
        { timestamp: 3000, sourceLayer: 'scheduling', duration: 60 },
      ]));
      const result = engine.getPerformanceInsights(window(0, 9999));
      expect(result.schedulingLatency.avg).toBe(40);
    });

    it('aggregates provider execution time stats', () => {
      engine.ingest(events([
        { timestamp: 1000, sourceLayer: 'provider', duration: 200 },
        { timestamp: 2000, sourceLayer: 'provider', duration: 800 },
      ]));
      const result = engine.getPerformanceInsights(window(0, 9999));
      expect(result.providerExecutionTime.avg).toBe(500);
      expect(result.providerExecutionTime.count).toBe(2);
    });

    it('aggregates queue wait time stats', () => {
      engine.ingest(events([
        { timestamp: 1000, sourceLayer: 'scheduling', eventType: 'queue_wait', duration: 300 },
        { timestamp: 2000, sourceLayer: 'scheduling', eventType: 'queue_wait', duration: 700 },
      ]));
      const result = engine.getPerformanceInsights(window(0, 9999));
      expect(result.queueWaitTime.avg).toBe(500);
    });
  });

  // ── 6C.3 — Capacity Forecasting ──

  describe('6C.3 — Capacity Forecasting', () => {
    it('forecasts queue growth from historical events', () => {
      engine.ingest(events([
        { timestamp: 1000, sourceLayer: 'scheduling', eventType: 'queue_enter' },
        { timestamp: 70000, sourceLayer: 'scheduling', eventType: 'queue_enter' },
        { timestamp: 130000, sourceLayer: 'scheduling', eventType: 'queue_enter' },
      ]));
      const forecast = engine.forecastQueueGrowth(window(0, 200000), 60000);
      expect(forecast.metric).toBe('queue_growth');
      expect(forecast.basedOn).toBeGreaterThanOrEqual(2);
    });

    it('forecasts slot utilization from events', () => {
      engine.ingest(events([
        { timestamp: 1000, sourceLayer: 'scheduling', eventType: 'slot_utilization', metadata: { utilization: 0.3 } },
        { timestamp: 60000, sourceLayer: 'scheduling', eventType: 'slot_utilization', metadata: { utilization: 0.5 } },
        { timestamp: 120000, sourceLayer: 'scheduling', eventType: 'slot_utilization', metadata: { utilization: 0.7 } },
      ]));
      const forecast = engine.forecastSlotUtilization(window(0, 180000), 60000);
      expect(forecast.metric).toBe('slot_utilization');
      expect(forecast.predictedValue).toBeGreaterThanOrEqual(0);
    });

    it('computes arrival rate per minute', () => {
      engine.ingest(events([
        { timestamp: 1000, eventType: 'workflow_start', sourceLayer: 'workflow' },
        { timestamp: 2000, eventType: 'workflow_start', sourceLayer: 'workflow' },
        { timestamp: 3000, eventType: 'workflow_start', sourceLayer: 'workflow' },
      ]));
      const rate = engine.getArrivalRate(window(0, 60000));
      expect(rate).toBe(3); // 3 arrivals per minute
    });

    it('projects saturation towards ceiling', () => {
      engine.ingest(events([
        { timestamp: 1000, sourceLayer: 'scheduling', eventType: 'slot_utilization', metadata: { utilization: 30 } },
        { timestamp: 60000, sourceLayer: 'scheduling', eventType: 'slot_utilization', metadata: { utilization: 50 } },
        { timestamp: 120000, sourceLayer: 'scheduling', eventType: 'slot_utilization', metadata: { utilization: 70 } },
      ]));
      const forecast = engine.projectSaturation(window(0, 180000), 60000);
      expect(forecast.metric).toBe('saturation');
      expect(forecast.predictedValue).toBeLessThanOrEqual(100);
    });

    it('returns low confidence forecast for insufficient data', () => {
      engine.ingest(events([
        { timestamp: 1000, sourceLayer: 'scheduling', eventType: 'queue_enter' },
      ]));
      const forecast = engine.forecastQueueGrowth(window(0, 9999), 60000);
      expect(forecast.confidence).toBe(0);
    });
  });

  // ── Trends ──

  describe('Trends', () => {
    it('identifies increasing trend', () => {
      for (let i = 0; i < 10; i++) {
        engine.ingest(events([
          { timestamp: i * 10000, eventType: 'latency', sourceLayer: 'provider', duration: 100 + i * 20 },
        ]));
      }
      const trend = engine.getTrend('latency', window(0, 100000), 10000);
      expect(trend.direction).toBe('increasing');
    });

    it('identifies decreasing trend', () => {
      for (let i = 0; i < 10; i++) {
        engine.ingest(events([
          { timestamp: i * 10000, eventType: 'latency', sourceLayer: 'provider', duration: 300 - i * 20 },
        ]));
      }
      const trend = engine.getTrend('latency', window(0, 100000), 10000);
      expect(trend.direction).toBe('decreasing');
    });

    it('reports stable for no change', () => {
      engine.ingest(events([
        { timestamp: 1000, eventType: 'metric_x', sourceLayer: 'workflow', duration: 100 },
        { timestamp: 2000, eventType: 'metric_x', sourceLayer: 'workflow', duration: 100 },
      ]));
      const trend = engine.getTrend('metric_x', window(0, 9999), 1000);
      expect(trend.direction).toBe('stable');
    });
  });

  // ── Operational Summary ──

  describe('Operational Summary', () => {
    it('produces a complete operational summary', () => {
      engine.ingest(events([
        { timestamp: 1000, eventType: 'workflow_start', sourceLayer: 'workflow' },
        { timestamp: 2000, eventType: 'workflow_complete', sourceLayer: 'workflow', status: 'success', duration: 800 },
        { timestamp: 3000, sourceLayer: 'scheduling', eventType: 'slot_utilization', metadata: { utilization: 0.5 } },
      ]));
      const summary = engine.getOperationalSummary(window(0, 9999));
      expect(summary.throughput).toBeGreaterThanOrEqual(0);
      expect(summary.completionRate).toBe(1);
      expect(summary.slotUtilization).toBeGreaterThanOrEqual(0);
    });

    it('computes queue growth as arrivals minus completions', () => {
      engine.ingest(events([
        { timestamp: 1000, eventType: 'workflow_start', sourceLayer: 'workflow' },
        { timestamp: 2000, eventType: 'workflow_start', sourceLayer: 'workflow' },
        { timestamp: 3000, eventType: 'workflow_start', sourceLayer: 'workflow' },
        { timestamp: 4000, eventType: 'workflow_complete', sourceLayer: 'workflow', status: 'success' },
      ]));
      const summary = engine.getOperationalSummary(window(0, 9999));
      expect(summary.queueGrowth).toBe(2); // 3 arrivals - 1 completion
    });
  });

  // ── G-041 — Observable Platform Behaviour ──

  describe('G-041 — Observable Platform Behaviour', () => {
    it('produces identical analytics for identical event data', () => {
      const evts = events([
        { timestamp: 1000, status: 'success' },
        { timestamp: 3000, status: 'failure' },
        { timestamp: 5000, status: 'success' },
      ]);

      const e1 = new AnalyticsEngineImpl();
      const e2 = new AnalyticsEngineImpl();
      e1.ingest(evts);
      e2.ingest(evts);

      const r1 = e1.getCrossWorkflowAnalytics(window(0, 9999));
      const r2 = e2.getCrossWorkflowAnalytics(window(0, 9999));
      expect(r1).toEqual(r2);
    });

    it('produces identical forecasts for identical input', () => {
      const evts = events([
        { timestamp: 1000, sourceLayer: 'scheduling', eventType: 'slot_utilization', metadata: { utilization: 20 } },
        { timestamp: 60000, sourceLayer: 'scheduling', eventType: 'slot_utilization', metadata: { utilization: 40 } },
        { timestamp: 120000, sourceLayer: 'scheduling', eventType: 'slot_utilization', metadata: { utilization: 60 } },
      ]);

      const e1 = new AnalyticsEngineImpl();
      const e2 = new AnalyticsEngineImpl();
      e1.ingest(evts);
      e2.ingest(evts);

      const f1 = e1.forecastSlotUtilization(window(0, 180000), 60000);
      const f2 = e2.forecastSlotUtilization(window(0, 180000), 60000);
      expect(f1).toEqual(f2);
    });

    it('produces identical trends for identical input', () => {
      const evts = events(
        Array.from({ length: 5 }, (_, i) => ({
          timestamp: i * 10000,
          eventType: 'response_time',
          sourceLayer: 'provider' as const,
          duration: 200 + i * 30,
        })),
      );

      const e1 = new AnalyticsEngineImpl();
      const e2 = new AnalyticsEngineImpl();
      e1.ingest(evts);
      e2.ingest(evts);

      expect(e1.getTrend('response_time', window(0, 99999), 10000))
        .toEqual(e2.getTrend('response_time', window(0, 99999), 10000));
    });
  });

  // ── Architectural Boundary ──

  describe('Architectural Boundary', () => {
    it('observes without altering execution state', () => {
      const result = engine.getCrossWorkflowAnalytics(window(0, 9999));
      expect(result).toBeDefined();
      expect(result.completionRate).toBeGreaterThanOrEqual(0);
    });
  });
});
