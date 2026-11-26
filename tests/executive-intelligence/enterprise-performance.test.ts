import { describe, it, expect } from 'vitest';
import { buildPerformanceReport, type EnterprisePerformance, type PerformanceMetric } from '../../src/lib/executive/enterprise-performance';

describe('Enterprise Performance', () => {
  it('builds performance report with optimal metrics when latency is low', () => {
    const report = buildPerformanceReport({
      testCount: 350,
      latencyMs: 100,
    });

    expect(report.metrics.length).toBe(4);
    expect(report.optimizationScore).toBe(85);
    expect(report.cachingEnabled).toBe(true);

    const apiMetric = report.metrics.find((m: PerformanceMetric) => m.name === 'API response');
    expect(apiMetric).toBeDefined();
    expect(apiMetric!.status).toBe('optimal');
    expect(apiMetric!.value).toBe(100);

    const testMetric = report.metrics.find((m: PerformanceMetric) => m.name === 'Test coverage');
    expect(testMetric!.status).toBe('optimal');
    expect(testMetric!.value).toBe(350);

    expect(report.recommendations).toContain('Current performance within acceptable ranges');
    expect(report.generatedAt).toBeGreaterThan(0);
  });

  it('reports adequate status when metrics fall below thresholds', () => {
    const report = buildPerformanceReport({
      testCount: 200,
      latencyMs: 300,
    });

    const apiMetric = report.metrics.find((m: PerformanceMetric) => m.name === 'API response');
    expect(apiMetric!.status).toBe('adequate');

    const testMetric = report.metrics.find((m: PerformanceMetric) => m.name === 'Test coverage');
    expect(testMetric!.status).toBe('adequate');
    expect(testMetric!.value).toBe(200);

    const buildMetric = report.metrics.find((m: PerformanceMetric) => m.name === 'Build time');
    expect(buildMetric!.status).toBe('optimal');
  });
});
