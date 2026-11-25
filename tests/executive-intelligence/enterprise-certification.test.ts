import { describe, it, expect } from 'vitest';
import { buildCertificationReport, type EnterpriseCertification, type CertificationStatus, type CertificationDomain } from '../../src/lib/executive/enterprise-certification';

describe('Enterprise Certification Report', () => {
  it('builds fully certified report when all passing criteria are met', () => {
    const report = buildCertificationReport({
      testCount: 350,
      governancePassing: true,
      programmeCount: 20,
    });

    expect(report.domains.length).toBe(6);
    expect(report.totalCount).toBe(6);
    expect(report.certifiedCount).toBe(6);
    expect(report.overallStatus).toBe('certified');
    expect(report.certifiedAt).toBeGreaterThan(0);

    const domains = report.domains.map((d: CertificationStatus) => d.domain);
    expect(domains).toContain('architecture');
    expect(domains).toContain('governance');
    expect(domains).toContain('security');
    expect(domains).toContain('performance');
    expect(domains).toContain('operations');
    expect(domains).toContain('documentation');

    for (const d of report.domains) {
      expect(d.status).toBe('certified');
      expect(d.reviewedBy).toBeTruthy();
      expect(d.reviewedAt).toBeGreaterThan(0);
      expect(d.notes).toBeTruthy();
    }

    const perf = report.domains.find((d: CertificationStatus) => d.domain === 'performance');
    expect(perf!.notes).toContain('350');

    expect(report.generatedAt).toBeGreaterThan(0);
  });

  it('reports in_progress when governance fails and tests are below threshold', () => {
    const report = buildCertificationReport({
      testCount: 200,
      governancePassing: false,
      programmeCount: 15,
    });

    expect(report.overallStatus).toBe('in_progress');
    expect(report.certifiedAt).toBeUndefined();
    expect(report.domains.length).toBe(6);
    expect(report.certifiedCount).toBe(6);
  });
});
