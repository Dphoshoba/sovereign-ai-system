import { describe, it, expect } from 'vitest';
import { buildObservabilityReport, type EnterpriseObservability, type ObservabilityMetric } from '../../src/lib/executive/enterprise-observability';

describe('Enterprise Observability', () => {
  it('builds a healthy observability report when governance passes and no failures', () => {
    const report = buildObservabilityReport({
      totalTests: 297,
      testFailures: 0,
      governancePassing: true,
    });

    expect(report.health).toBe(95);
    expect(report.failures).toBe(0);
    expect(report.metrics.length).toBe(4);

    const testMetric = report.metrics.find((m: ObservabilityMetric) => m.name === 'Test Suite');
    expect(testMetric).toBeDefined();
    expect(testMetric!.status).toBe('healthy');

    const govMetric = report.metrics.find((m: ObservabilityMetric) => m.name === 'Governance');
    expect(govMetric).toBeDefined();
    expect(govMetric!.value).toBe(100);
    expect(govMetric!.status).toBe('healthy');

    expect(report.recommendations).toContain('System operating within normal parameters');
  });

  it('reports critical status when governance fails and test failures exist', () => {
    const report = buildObservabilityReport({
      totalTests: 300,
      testFailures: 3,
      governancePassing: false,
    });

    expect(report.health).toBe(70);
    expect(report.failures).toBe(3);

    const testMetric = report.metrics.find((m: ObservabilityMetric) => m.name === 'Test Suite');
    expect(testMetric!.status).toBe('critical');

    const govMetric = report.metrics.find((m: ObservabilityMetric) => m.name === 'Governance');
    expect(govMetric!.value).toBe(0);
    expect(govMetric!.status).toBe('critical');

    expect(report.recommendations).toContain('Investigate test failures');
  });
});
