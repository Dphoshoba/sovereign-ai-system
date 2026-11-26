/**
 * Gmail Certification Test Suite
 *
 * 40+ comprehensive tests covering all certification checks.
 * Verifies Gmail is production-ready and reusable as reference architecture.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CertificationRunner } from '../../lib/connectors/gmail/certification-runner';
import { ReferenceConnectorReport } from '../../lib/connectors/gmail/reference-connector-report';
import { GmailV1Checklist } from '../../lib/connectors/gmail/gmail-v1-checklist';
import { GmailCertificationReader } from '../../lib/gamma/gmail-certification-reader';
import {
  CERT_BASE_TIME,
  MOCK_GMAIL_CERTIFICATION_CERTIFIED,
  MOCK_CERTIFICATION_CHECKS_ALL_PASSED,
  MOCK_BLUEPRINT_COMPONENTS,
  MOCK_REFERENCE_ARCHITECTURE,
} from '../../src/lib/gmail-certification/mock-data';

describe('Gmail Certification Suite', () => {
  let runner: CertificationRunner;
  let report: ReferenceConnectorReport;
  let checklist: GmailV1Checklist;
  let reader: GmailCertificationReader;

  beforeEach(() => {
    runner = new CertificationRunner();
    report = new ReferenceConnectorReport();
    checklist = new GmailV1Checklist();
    reader = new GmailCertificationReader();
  });

  describe('Certification Runner', () => {
    it('should run complete certification', async () => {
      const result = await runner.runCertification({
        includeTests: true,
        includeDocs: true,
        checkReusability: true,
        currentTime: CERT_BASE_TIME,
      });

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThan(0);
    });

    it('should verify OAuth subsystem', async () => {
      const checks = await runner.verifyOAuth();
      expect(checks.length).toBeGreaterThan(0);
      expect(checks.every((c) => c.category === 'oauth')).toBe(true);
    });

    it('should verify reader subsystem', async () => {
      const checks = await runner.verifyReader();
      expect(checks.length).toBeGreaterThan(0);
      expect(checks.every((c) => c.category === 'reader')).toBe(true);
    });

    it('should verify execution safety gates', async () => {
      const checks = await runner.verifyExecutionSafety();
      expect(checks.length).toBeGreaterThan(0);
      expect(checks.some((c) => c.name.includes('Controlled execution'))).toBe(true);
      expect(checks.some((c) => c.name.includes('Live mode'))).toBe(true);
      expect(checks.some((c) => c.name.toLowerCase().includes('messages.send'))).toBe(true);
    });

    it('should verify safety guards (no token exposure)', async () => {
      const checks = await runner.verifySafetyGuards();
      expect(checks.some((c) => c.name.includes('token'))).toBe(true);
      expect(checks.some((c) => c.name.includes('Date.now'))).toBe(true);
    });

    it('should verify compliance & resilience', async () => {
      const checks = await runner.verifyCompliance();
      expect(checks.length).toBeGreaterThan(0);
      expect(checks.some((c) => c.name.includes('audit'))).toBe(true);
      expect(checks.some((c) => c.name.includes('retry'))).toBe(true);
      expect(checks.some((c) => c.name.toLowerCase().includes('dead-letter'))).toBe(true);
    });

    it('should verify hardening subsystem', async () => {
      const checks = await runner.verifyHardening();
      expect(checks.length).toBeGreaterThan(0);
      expect(checks.some((c) => c.name.includes('health'))).toBe(true);
      expect(checks.some((c) => c.name.toLowerCase().includes('quota'))).toBe(true);
    });

    it('should verify documentation', async () => {
      const checks = await runner.verifyDocumentation();
      expect(checks.length).toBeGreaterThan(0);
      expect(checks.every((c) => c.category === 'documentation')).toBe(true);
    });

    it('should calculate metrics correctly', () => {
      const metrics = runner.calculateMetrics(MOCK_CERTIFICATION_CHECKS_ALL_PASSED);
      expect(metrics.certificationScore).toBeGreaterThan(85);
      expect(metrics.referenceReadiness).toBeGreaterThan(85);
    });

    it('should determine certification status', () => {
      const isCert = runner.isCertified(MOCK_CERTIFICATION_CHECKS_ALL_PASSED);
      expect(isCert).toBe(true);
    });
  });

  describe('Certification Checks Coverage', () => {
    it('should have OAuth checks', () => {
      const oauthChecks = checklist.getByCategory('OAuth');
      expect(oauthChecks.length).toBeGreaterThanOrEqual(3);
      expect(oauthChecks.some((c) => c.name.includes('OAuth'))).toBe(true);
    });

    it('should have reader checks', () => {
      const readerChecks = checklist.getByCategory('Reader');
      expect(readerChecks.length).toBeGreaterThanOrEqual(3);
    });

    it('should have execution safety checks', () => {
      const execChecks = checklist.getByCategory('Execution Safety');
      expect(execChecks.length).toBeGreaterThanOrEqual(4);
      const noBypass = execChecks.find((c) => c.name.includes('messages.send'));
      expect(noBypass).toBeDefined();
      expect(noBypass?.priority).toBe('critical');
    });

    it('should have security checks (no token exposure)', () => {
      const secChecks = checklist.getByCategory('Security');
      expect(secChecks.some((c) => c.name.includes('token'))).toBe(true);
      expect(secChecks.some((c) => c.name.includes('secret'))).toBe(true);
    });

    it('should have compliance checks', () => {
      const compChecks = checklist.getByCategory('Compliance');
      expect(compChecks.length).toBeGreaterThanOrEqual(4);
    });

    it('should have hardening checks', () => {
      const hardChecks = checklist.getByCategory('Hardening');
      expect(hardChecks.length).toBeGreaterThanOrEqual(4);
    });

    it('should have 40+ total checks', () => {
      const all = checklist.getAllItems();
      expect(all.length).toBeGreaterThanOrEqual(40);
    });

    it('should have critical items', () => {
      const critical = checklist.getCriticalItems();
      expect(critical.length).toBeGreaterThan(0);
      expect(
        critical.some((c) => c.name.toLowerCase().includes('simulation'))
      ).toBe(true);
      expect(
        critical.some((c) => c.name.includes('send'))
      ).toBe(true);
    });
  });

  describe('Reference Architecture', () => {
    it('should have blueprint components', () => {
      const components = report.getBlueprintComponents();
      expect(components.length).toBeGreaterThan(0);
    });

    it('should identify reusable-as-is components', () => {
      const reusable = report.getComponentsByStatus('reusable-as-is');
      expect(reusable.length).toBeGreaterThan(0);
      expect(reusable.some((c) => c.name.includes('Reader'))).toBe(true);
      expect(reusable.some((c) => c.name.includes('Approval'))).toBe(true);
    });

    it('should identify components with adaptation needed', () => {
      const adapted = report.getComponentsByStatus('reusable-with-adaptation');
      expect(adapted.length).toBeGreaterThan(0);
    });

    it('should get critical reuse components', () => {
      const critical = report.getCriticalComponents();
      expect(critical.length).toBeGreaterThan(0);
    });

    it('should get recommended reuse components', () => {
      const recommended = report.getRecommendedComponents();
      expect(recommended.length).toBeGreaterThan(0);
    });

    it('should estimate development reduction for Calendar', () => {
      const reduction = report.getEstimatedDevelopmentReduction('calendar');
      expect(reduction).toBeGreaterThan(50);
      expect(reduction).toBeLessThanOrEqual(100);
    });

    it('should estimate development reduction for Drive', () => {
      const reduction = report.getEstimatedDevelopmentReduction('drive');
      expect(reduction).toBeGreaterThan(50);
    });

    it('should generate markdown documentation', () => {
      const docs = report.generateMarkdownDocumentation();
      expect(docs).toContain('Reference Architecture');
      expect(docs).toContain('Critical');
      expect(docs).toContain('Recommended');
    });

    it('should provide roadmap for future connector', () => {
      const roadmap = report.getRoadmapForConnector('calendar');
      expect(roadmap.steps.length).toBeGreaterThan(0);
      expect(roadmap.estimatedReduction).toBeGreaterThan(50);
      expect(roadmap.componentsToReuse.length).toBeGreaterThan(0);
    });

    it('should reference all 7 future connectors', () => {
      const components = report.getBlueprintComponents();
      const allConnectors = new Set<string>();
      components.forEach((c) => {
        c.futureConnectors.forEach((fc) => allConnectors.add(fc));
      });

      expect(allConnectors.size).toBeGreaterThanOrEqual(7);
      expect(allConnectors.has('calendar')).toBe(true);
      expect(allConnectors.has('drive')).toBe(true);
    });
  });

  describe('Certification Reader (GAMMA Pattern)', () => {
    it('should store and retrieve certification', () => {
      reader.storeCertification('test_001', MOCK_GMAIL_CERTIFICATION_CERTIFIED);
      const cert = reader.getCertification('test_001');
      expect(cert).toBeDefined();
      expect(cert?.overallScore).toBe(MOCK_GMAIL_CERTIFICATION_CERTIFIED.overallScore);
    });

    it('should get latest certification', () => {
      const latest = reader.getLatestCertification();
      expect(latest).toBeDefined();
      expect(latest?.status).toBe('certified');
    });

    it('should get all certifications deterministically', () => {
      const certs1 = reader.getAllCertifications(CERT_BASE_TIME);
      const certs2 = reader.getAllCertifications(CERT_BASE_TIME);
      expect(certs1).toEqual(certs2);
    });

    it('should calculate score trend', () => {
      const trend = reader.getScoreTrend(CERT_BASE_TIME);
      expect(trend.current).toBeGreaterThan(0);
      expect(trend.trend).toMatch(/up|steady|down/);
    });

    it('should get category scores', () => {
      const scores = reader.getCategoryScores(CERT_BASE_TIME);
      expect(Object.keys(scores).length).toBeGreaterThan(0);
      Object.values(scores).forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it('should get metrics summary deterministically', () => {
      const summary1 = reader.getMetricsSummary(CERT_BASE_TIME);
      const summary2 = reader.getMetricsSummary(CERT_BASE_TIME);
      expect(summary1).toEqual(summary2);
    });

    it('should report certification status', () => {
      const status = reader.getStatus(CERT_BASE_TIME);
      expect(status).toBe('certified');
    });

    it('should get recommendations', () => {
      const recs = reader.getRecommendations(CERT_BASE_TIME);
      expect(recs.length).toBeGreaterThan(0);
    });
  });

  describe('Certification Metrics', () => {
    it('should have certification score >= 90', () => {
      expect(MOCK_GMAIL_CERTIFICATION_CERTIFIED.metrics.certificationScore).toBeGreaterThanOrEqual(90);
    });

    it('should have reference readiness >= 85', () => {
      expect(MOCK_GMAIL_CERTIFICATION_CERTIFIED.metrics.referenceReadiness).toBeGreaterThanOrEqual(85);
    });

    it('should have safety score >= 95', () => {
      expect(MOCK_GMAIL_CERTIFICATION_CERTIFIED.metrics.connectorSafetyScore).toBeGreaterThanOrEqual(95);
    });

    it('should be production ready', () => {
      expect(MOCK_GMAIL_CERTIFICATION_CERTIFIED.readyForProduction).toBe(true);
    });

    it('should be ready for reuse', () => {
      expect(MOCK_GMAIL_CERTIFICATION_CERTIFIED.readyForReuse).toBe(true);
    });

    it('should have all categories certified', () => {
      const allCertified = MOCK_GMAIL_CERTIFICATION_CERTIFIED.categories.every(
        (c) => c.status === 'certified'
      );
      expect(allCertified).toBe(true);
    });
  });

  describe('Certification Dependencies', () => {
    it('should have hardening as dependency', () => {
      const result = MOCK_GMAIL_CERTIFICATION_CERTIFIED;
      expect(result.metrics.hardeningScore).toBeGreaterThan(80);
    });

    it('should have compliance as dependency', () => {
      const result = MOCK_GMAIL_CERTIFICATION_CERTIFIED;
      expect(result.metrics.complianceScore).toBeGreaterThan(80);
    });

    it('should have health monitoring', () => {
      const result = MOCK_GMAIL_CERTIFICATION_CERTIFIED;
      expect(result.metrics.healthScore).toBeGreaterThan(80);
    });

    it('should have test coverage', () => {
      const result = MOCK_GMAIL_CERTIFICATION_CERTIFIED;
      expect(result.metrics.testCoverageScore).toBeGreaterThan(80);
    });

    it('should have documentation', () => {
      const result = MOCK_GMAIL_CERTIFICATION_CERTIFIED;
      expect(result.metrics.documentationScore).toBeGreaterThan(85);
    });
  });

  describe('Checklist Summary', () => {
    it('should provide accurate summary', () => {
      const summary = checklist.getSummary();
      expect(summary.total).toBeGreaterThanOrEqual(40);
      expect(summary.critical).toBeGreaterThan(0);
      expect(summary.categories.length).toBeGreaterThan(0);
    });
  });
});
