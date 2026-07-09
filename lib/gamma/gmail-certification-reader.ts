/**
 * Gmail Certification Reader (GAMMA Pattern)
 *
 * Deterministic read-only queries for certification data.
 * All time-dependent methods accept currentTime parameter.
 */

import type { GmailCertificationResult } from '../../src/lib/gmail-certification/types';
import { MOCK_GMAIL_CERTIFICATION_CERTIFIED, CERT_BASE_TIME } from '../../src/lib/gmail-certification/mock-data';

export class GmailCertificationReader {
  private certifications = new Map<string, GmailCertificationResult>();

  constructor() {
    // Initialize with certified mock data
    this.certifications.set('cert_gmail_v1_001', MOCK_GMAIL_CERTIFICATION_CERTIFIED);
  }

  /**
   * Store certification result (deterministic)
   */
  storeCertification(id: string, result: GmailCertificationResult): void {
    this.certifications.set(id, result);
  }

  /**
   * Retrieve certification by ID (deterministic)
   */
  getCertification(id: string): GmailCertificationResult | undefined {
    return this.certifications.get(id);
  }

  /**
   * Get latest certification (deterministic)
   */
  getLatestCertification(): GmailCertificationResult | undefined {
    const certArray = Array.from(this.certifications.values());
    if (certArray.length === 0) return undefined;
    
    return certArray.reduce((latest, cert) => {
      const latestDate = new Date(latest.timestamp);
      const certDate = new Date(cert.timestamp);
      return certDate > latestDate ? cert : latest;
    });
  }

  /**
   * Get all certifications (deterministic, accepts currentTime)
   */
  getAllCertifications(currentTime: Date): GmailCertificationResult[] {
    return Array.from(this.certifications.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get certification score trend (deterministic)
   */
  getScoreTrend(currentTime: Date, limitSnapshots?: number): {
    current: number;
    previous: number;
    trend: 'up' | 'steady' | 'down';
  } {
    const certs = this.getAllCertifications(currentTime);
    if (certs.length === 0) {
      return { current: 0, previous: 0, trend: 'steady' };
    }

    const limit = limitSnapshots ?? 2;
    const recent = certs.slice(0, limit);

    const current = recent[0]?.overallScore ?? 0;
    const previous = recent[1]?.overallScore ?? current;

    let trend: 'up' | 'steady' | 'down' = 'steady';
    if (current > previous) trend = 'up';
    else if (current < previous) trend = 'down';

    return { current, previous, trend };
  }

  /**
   * Get category scores (deterministic)
   */
  getCategoryScores(currentTime: Date): Record<string, number> {
    const latest = this.getLatestCertification();
    if (!latest) return {};

    const scores: Record<string, number> = {};
    for (const category of latest.categories) {
      scores[category.category] = category.score;
    }
    return scores;
  }

  /**
   * Get failed checks (deterministic)
   */
  getFailedChecks(currentTime: Date): string[] {
    const latest = this.getLatestCertification();
    if (!latest) return [];

    return latest.allChecks
      .filter((check) => !check.passed)
      .map((check) => check.name);
  }

  /**
   * Get critical failures (deterministic)
   */
  getCriticalFailures(currentTime: Date): string[] {
    const latest = this.getLatestCertification();
    if (!latest) return [];

    return latest.allChecks
      .filter((check) => check.severity === 'critical' && !check.passed)
      .map((check) => check.name);
  }

  /**
   * Get metrics summary (deterministic)
   */
  getMetricsSummary(currentTime: Date): {
    certificationScore: number;
    referenceReadiness: number;
    connectorSafetyScore: number;
    testCoverageScore: number;
    documentationScore: number;
  } {
    const latest = this.getLatestCertification();
    if (!latest) {
      return {
        certificationScore: 0,
        referenceReadiness: 0,
        connectorSafetyScore: 0,
        testCoverageScore: 0,
        documentationScore: 0,
      };
    }

    return {
      certificationScore: latest.metrics.certificationScore,
      referenceReadiness: latest.metrics.referenceReadiness,
      connectorSafetyScore: latest.metrics.connectorSafetyScore,
      testCoverageScore: latest.metrics.testCoverageScore,
      documentationScore: latest.metrics.documentationScore,
    };
  }

  /**
   * Get recommendations (deterministic)
   */
  getRecommendations(currentTime: Date): string[] {
    const latest = this.getLatestCertification();
    return latest?.recommendations ?? [];
  }

  /**
   * Is certified (deterministic)
   */
  isCertified(currentTime: Date): boolean {
    const latest = this.getLatestCertification();
    if (!latest) return false;
    return latest.status === 'certified';
  }

  /**
   * Get certification status (deterministic)
   */
  getStatus(currentTime: Date): 'certified' | 'at-risk' | 'not-certified' {
    const latest = this.getLatestCertification();
    return latest?.status ?? 'not-certified';
  }
}
