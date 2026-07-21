import { describe, it, expect } from 'vitest';
import { buildSecurityReport, type EnterpriseSecurity, type SecurityCapability } from '../../src/lib/executive/enterprise-security';

describe('Enterprise Security', () => {
  it('builds security report with enforced capabilities when governance passes', () => {
    const report = buildSecurityReport({
      governancePassing: true,
    });

    expect(report.capabilities.length).toBe(6);
    expect(report.totalCount).toBe(6);
    expect(report.securityScore).toBe(80);

    const enforced = report.capabilities.filter((c: SecurityCapability) => c.status === 'enforced');
    expect(enforced.length).toBe(2);
    expect(report.enforcedCount).toBe(2);

    const audit = report.capabilities.find((c: SecurityCapability) => c.name === 'Audit Trail');
    expect(audit).toBeDefined();
    expect(audit!.status).toBe('enforced');
    expect(audit!.category).toBe('compliance');

    const prodIsolation = report.capabilities.find((c: SecurityCapability) => c.name === 'Production Data Isolation');
    expect(prodIsolation!.status).toBe('enforced');
  });

  it('reduces security score when governance is not passing', () => {
    const report = buildSecurityReport({
      governancePassing: false,
    });

    expect(report.securityScore).toBe(50);
    expect(report.enforcedCount).toBe(2);
    expect(report.totalCount).toBe(6);
    expect(report.generatedAt).toBeGreaterThan(0);
  });
});
