/**
 * Gmail Certification Mock Data
 *
 * Deterministic test data for certification verification.
 * All timestamps use CERT_BASE_TIME for reproducible runs.
 */

import type {
  CertificationCheckResult,
  CertificationCategoryResult,
  GmailCertificationResult,
  CertificationMetrics,
  ConnectorBlueprintComponent,
  ReferenceArchitecture,
} from './types';

/**
 * Fixed base timestamp for all deterministic certification operations
 */
export const CERT_BASE_TIME = new Date('2026-07-10T12:00:00Z');

/**
 * Helper: Calculate relative time from CERT_BASE_TIME
 */
export function certRelativeTime(offsetMs: number): Date {
  return new Date(CERT_BASE_TIME.getTime() + offsetMs);
}

/**
 * Mock: All certification checks passed
 */
export const MOCK_CERTIFICATION_CHECKS_ALL_PASSED: CertificationCheckResult[] = [
  // OAuth checks
  {
    id: 'oauth-001',
    name: 'OAuth flow initialization works',
    category: 'oauth',
    passed: true,
    severity: 'critical',
    message: 'OAuth flow initializes correctly and redirects to Google',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'oauth-002',
    name: 'OAuth token storage works',
    category: 'oauth',
    passed: true,
    severity: 'critical',
    message: 'Tokens stored securely without exposure',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'oauth-003',
    name: 'Token refresh works',
    category: 'oauth',
    passed: true,
    severity: 'high',
    message: 'Expired tokens refresh automatically',
    checkedAt: CERT_BASE_TIME,
  },

  // Reader checks
  {
    id: 'reader-001',
    name: 'Mailbox reader retrieves messages',
    category: 'reader',
    passed: true,
    severity: 'critical',
    message: 'Mailbox reader successfully reads from Gmail API',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'reader-002',
    name: 'Message parsing works',
    category: 'reader',
    passed: true,
    severity: 'critical',
    message: 'Messages parsed correctly with MIME structure',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'reader-003',
    name: 'Sanitizer redacts secrets',
    category: 'reader',
    passed: true,
    severity: 'high',
    message: 'All API keys, tokens, passwords redacted',
    checkedAt: CERT_BASE_TIME,
  },

  // Composer checks
  {
    id: 'composer-001',
    name: 'Draft composer creates drafts',
    category: 'composer',
    passed: true,
    severity: 'critical',
    message: 'Draft composer creates valid Gmail drafts',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'composer-002',
    name: 'MIME builder generates RFC5322',
    category: 'composer',
    passed: true,
    severity: 'critical',
    message: 'MIME builder generates RFC5322-compliant messages',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'composer-003',
    name: 'Message validator verifies integrity',
    category: 'composer',
    passed: true,
    severity: 'high',
    message: 'Validator catches malformed messages',
    checkedAt: CERT_BASE_TIME,
  },

  // Workflow checks
  {
    id: 'workflow-001',
    name: 'Preview engine works',
    category: 'workflow',
    passed: true,
    severity: 'critical',
    message: 'Preview engine displays message without sending',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'workflow-002',
    name: 'Approval workflow works',
    category: 'workflow',
    passed: true,
    severity: 'critical',
    message: 'Approval gate requires human sign-off',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'workflow-003',
    name: 'Queue engine queues jobs',
    category: 'workflow',
    passed: true,
    severity: 'high',
    message: 'Queue engine persists jobs for execution',
    checkedAt: CERT_BASE_TIME,
  },

  // Execution checks
  {
    id: 'execution-001',
    name: 'Controlled execution is default',
    category: 'execution',
    passed: true,
    severity: 'critical',
    message: 'ENABLE_REAL_EXECUTION=false is default',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'execution-002',
    name: 'Live mode is guarded',
    category: 'execution',
    passed: true,
    severity: 'critical',
    message: 'Live mode requires explicit flag AND approval',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'execution-003',
    name: 'Draft API is behind feature flag',
    category: 'execution',
    passed: true,
    severity: 'high',
    message: 'Gmail Draft API requires feature flag',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'execution-004',
    name: 'No messages.send bypass exists',
    category: 'execution',
    passed: true,
    severity: 'critical',
    message: 'messages.send() not exposed to workflow',
    checkedAt: CERT_BASE_TIME,
  },

  // Safety checks
  {
    id: 'safety-001',
    name: 'No token exposure in logs',
    category: 'safety',
    passed: true,
    severity: 'critical',
    message: 'Tokens masked (format: oauth2_****xxxx)',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'safety-002',
    name: 'No secret exposure in logs',
    category: 'safety',
    passed: true,
    severity: 'critical',
    message: 'All secrets redacted before logging',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'safety-003',
    name: 'No Date.now in deterministic readers',
    category: 'safety',
    passed: true,
    severity: 'high',
    message: 'All GAMMA readers accept currentTime parameter',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'safety-004',
    name: 'No Math.random in readers',
    category: 'safety',
    passed: true,
    severity: 'high',
    message: 'All reader outputs deterministic',
    checkedAt: CERT_BASE_TIME,
  },

  // Compliance checks
  {
    id: 'compliance-001',
    name: 'Compliance audit works',
    category: 'compliance',
    passed: true,
    severity: 'high',
    message: 'Audit log records all operations',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'compliance-002',
    name: 'Resilience & retry works',
    category: 'compliance',
    passed: true,
    severity: 'high',
    message: 'Retry policy is deterministic and exponential',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'compliance-003',
    name: 'Dead-letter queue works',
    category: 'compliance',
    passed: true,
    severity: 'medium',
    message: 'Failed jobs moved to DLQ after max retries',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'compliance-004',
    name: 'Duplicate protection works',
    category: 'compliance',
    passed: true,
    severity: 'high',
    message: 'Idempotency prevents duplicate sends',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'compliance-005',
    name: 'Receipt verification works',
    category: 'compliance',
    passed: true,
    severity: 'medium',
    message: 'Receipt verifier confirms delivery',
    checkedAt: CERT_BASE_TIME,
  },

  // Hardening checks
  {
    id: 'hardening-001',
    name: 'Production readiness monitoring works',
    category: 'hardening',
    passed: true,
    severity: 'high',
    message: 'Health monitors track all components',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'hardening-002',
    name: 'Token health monitoring works',
    category: 'hardening',
    passed: true,
    severity: 'high',
    message: 'Token expiry and refresh tracked',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'hardening-003',
    name: 'Quota monitoring works',
    category: 'hardening',
    passed: true,
    severity: 'high',
    message: 'Quota usage tracked for all limits',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'hardening-004',
    name: 'Rate limiting works',
    category: 'hardening',
    passed: true,
    severity: 'high',
    message: 'Rate limit tiers enforce backoff',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'hardening-005',
    name: 'Scope validation works',
    category: 'hardening',
    passed: true,
    severity: 'high',
    message: 'Gmail.send flagged as high-risk',
    checkedAt: CERT_BASE_TIME,
  },

  // Documentation checks
  {
    id: 'docs-001',
    name: 'Build 140 documentation complete',
    category: 'documentation',
    passed: true,
    severity: 'medium',
    message: 'Architecture and certification docs written',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'docs-002',
    name: 'Connector reference architecture documented',
    category: 'documentation',
    passed: true,
    severity: 'medium',
    message: 'Blueprint for future connectors available',
    checkedAt: CERT_BASE_TIME,
  },
  {
    id: 'docs-003',
    name: 'Reusable components identified',
    category: 'documentation',
    passed: true,
    severity: 'medium',
    message: 'Components mapped for future use',
    checkedAt: CERT_BASE_TIME,
  },
];

/**
 * Mock: Certification metrics for certified state
 */
export const MOCK_CERTIFICATION_METRICS_CERTIFIED: CertificationMetrics = {
  certificationScore: 95,
  referenceReadiness: 92,
  connectorSafetyScore: 98,
  testCoverageScore: 94,
  documentationScore: 90,
  futureConnectorReuseScore: 88,
  productionReadinessScore: 92,
  hardeningScore: 96,
  complianceScore: 94,
  healthScore: 93,
};

/**
 * Mock: Overall certification result (CERTIFIED)
 */
export const MOCK_GMAIL_CERTIFICATION_CERTIFIED: GmailCertificationResult = {
  certificationId: 'cert_gmail_v1_001',
  timestamp: CERT_BASE_TIME,
  overallScore: 93,
  status: 'certified',
  categories: [
    {
      category: 'oauth',
      totalChecks: 3,
      passedChecks: 3,
      failedChecks: 0,
      score: 100,
      status: 'certified',
      criticalFailures: [],
    },
    {
      category: 'reader',
      totalChecks: 3,
      passedChecks: 3,
      failedChecks: 0,
      score: 100,
      status: 'certified',
      criticalFailures: [],
    },
    {
      category: 'composer',
      totalChecks: 3,
      passedChecks: 3,
      failedChecks: 0,
      score: 100,
      status: 'certified',
      criticalFailures: [],
    },
    {
      category: 'workflow',
      totalChecks: 3,
      passedChecks: 3,
      failedChecks: 0,
      score: 100,
      status: 'certified',
      criticalFailures: [],
    },
    {
      category: 'execution',
      totalChecks: 4,
      passedChecks: 4,
      failedChecks: 0,
      score: 100,
      status: 'certified',
      criticalFailures: [],
    },
    {
      category: 'safety',
      totalChecks: 4,
      passedChecks: 4,
      failedChecks: 0,
      score: 100,
      status: 'certified',
      criticalFailures: [],
    },
    {
      category: 'compliance',
      totalChecks: 5,
      passedChecks: 5,
      failedChecks: 0,
      score: 100,
      status: 'certified',
      criticalFailures: [],
    },
    {
      category: 'hardening',
      totalChecks: 5,
      passedChecks: 5,
      failedChecks: 0,
      score: 100,
      status: 'certified',
      criticalFailures: [],
    },
    {
      category: 'documentation',
      totalChecks: 3,
      passedChecks: 3,
      failedChecks: 0,
      score: 100,
      status: 'certified',
      criticalFailures: [],
    },
  ],
  allChecks: MOCK_CERTIFICATION_CHECKS_ALL_PASSED,
  metrics: MOCK_CERTIFICATION_METRICS_CERTIFIED,
  recommendations: [
    'Gmail Connector v1.0 is production-ready and certified for deployment.',
    'Begin Calendar, Drive, GitHub, Slack, Office 365, Notion, Discord connector development using this as reference.',
    'Schedule re-certification in 6 months or after major changes.',
  ],
  readyForProduction: true,
  readyForReuse: true,
};

/**
 * Mock: Blueprint components for reuse
 */
export const MOCK_BLUEPRINT_COMPONENTS: ConnectorBlueprintComponent[] = [
  {
    name: 'OAuth Adapter',
    description: 'Handles OAuth 2.0 flow, token refresh, and secure storage',
    location: 'lib/connectors/gmail/authenticator.ts',
    reusePattern: 'Copy pattern, modify endpoint URLs and scopes',
    status: 'reusable-with-adaptation',
    futureConnectors: ['calendar', 'drive', 'office365'],
  },
  {
    name: 'Reader Pattern',
    description: 'Retrieves data from API, parses, and sanitizes',
    location: 'lib/connectors/gmail/mailbox-reader.ts',
    reusePattern: 'Copy entire pattern unchanged',
    status: 'reusable-as-is',
    futureConnectors: ['calendar', 'drive', 'github', 'slack', 'office365', 'notion', 'discord'],
  },
  {
    name: 'Sanitizer',
    description: 'Redacts secrets, tokens, and sensitive data from content',
    location: 'lib/connectors/gmail/sanitizer.ts',
    reusePattern: 'Copy unchanged, extend patterns as needed',
    status: 'reusable-as-is',
    futureConnectors: ['all'],
  },
  {
    name: 'Approval Workflow',
    description: 'Human-in-the-loop approval gate',
    location: 'lib/connectors/gmail/approval-engine.ts',
    reusePattern: 'Copy unchanged',
    status: 'reusable-as-is',
    futureConnectors: ['all'],
  },
  {
    name: 'Queue Engine',
    description: 'Persists and manages job queue',
    location: 'lib/connectors/gmail/queue-engine.ts',
    reusePattern: 'Copy unchanged',
    status: 'reusable-as-is',
    futureConnectors: ['all'],
  },
  {
    name: 'Controlled Execution',
    description: 'Feature flags and safety gates for live execution',
    location: 'lib/connectors/gmail/executor.ts',
    reusePattern: 'Copy pattern, configure with connector-specific gates',
    status: 'reusable-with-adaptation',
    futureConnectors: ['all'],
  },
  {
    name: 'Health Monitoring',
    description: 'Production readiness, quota, rate limits, token health',
    location: 'lib/connectors/gmail/health-checker.ts',
    reusePattern: 'Copy pattern, adapt metrics to connector requirements',
    status: 'reusable-with-adaptation',
    futureConnectors: ['all'],
  },
  {
    name: 'Compliance Audit',
    description: 'Records all operations for compliance',
    location: 'lib/connectors/gmail/compliance-audit.ts',
    reusePattern: 'Copy unchanged',
    status: 'reusable-as-is',
    futureConnectors: ['all'],
  },
];

/**
 * Mock: Reference architecture for future connectors
 */
export const MOCK_REFERENCE_ARCHITECTURE: ReferenceArchitecture = {
  blueprintVersion: '1.0',
  baseConnector: 'gmail',
  components: MOCK_BLUEPRINT_COMPONENTS,
  criticalReuse: [
    'OAuth adapter pattern',
    'Approval workflow',
    'Queue engine',
    'Compliance audit',
    'Health monitoring',
    'Safety gates',
  ],
  recommendedReuse: [
    'Reader pattern',
    'Sanitizer',
    'Controlled execution',
    'Retry policy',
    'Dead-letter queue',
  ],
  referenceOnly: [
    'Gmail-specific API integration',
    'MIME message building',
    'Draft API',
  ],
  bestPractices: [
    'Always default to simulation mode (ENABLE_REAL_EXECUTION=false)',
    'Require human approval before live execution',
    'Monitor health metrics continuously',
    'Maintain comprehensive audit logs',
    'Test all edge cases with mock data',
    'Never expose secrets in logs',
    'Use deterministic readers for GAMMA pattern',
  ],
};
