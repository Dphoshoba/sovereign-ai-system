import { describe, it, expect } from 'vitest';
import { buildResilienceReport, type EnterpriseResilience, type ResilienceCapability } from '../../src/lib/executive/enterprise-resilience';

describe('Enterprise Resilience', () => {
  it('builds resilience report with active capabilities when governance passes', () => {
    const report = buildResilienceReport({
      testCount: 297,
      governancePassing: true,
    });

    expect(report.capabilities.length).toBe(6);
    expect(report.totalCount).toBe(6);
    expect(report.resilienceScore).toBe(85);

    const activeCaps = report.capabilities.filter((c: ResilienceCapability) => c.status === 'active');
    expect(activeCaps.length).toBe(4);
    expect(report.readyCount).toBe(4);

    const integrity = report.capabilities.find((c: ResilienceCapability) => c.name === 'Integrity');
    expect(integrity).toBeDefined();
    expect(integrity!.description).toContain('297');
  });

  it('reduces resilience score when governance is not passing', () => {
    const report = buildResilienceReport({
      testCount: 100,
      governancePassing: false,
    });

    expect(report.resilienceScore).toBe(60);
    expect(report.readyCount).toBe(4);
    expect(report.totalCount).toBe(6);
    expect(report.generatedAt).toBeGreaterThan(0);
  });
});
