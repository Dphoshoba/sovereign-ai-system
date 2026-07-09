/**
 * Gmail Certification Types
 *
 * Defines the certification framework for Gmail Connector v1.0
 * Used for verifying complete connector lifecycle and reusability.
 */

/**
 * Individual certification check result
 */
export interface CertificationCheckResult {
  id: string;
  name: string;
  category: 'oauth' | 'reader' | 'composer' | 'workflow' | 'execution' | 'safety' | 'compliance' | 'hardening' | 'health' | 'documentation';
  passed: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  recommendation?: string;
  checkedAt: Date;
}

/**
 * Certification category summary
 */
export interface CertificationCategoryResult {
  category: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  score: number; // 0-100
  status: 'certified' | 'at-risk' | 'failed';
  criticalFailures: CertificationCheckResult[];
}

/**
 * Overall certification result
 */
export interface GmailCertificationResult {
  certificationId: string;
  timestamp: Date;
  overallScore: number; // 0-100
  status: 'certified' | 'at-risk' | 'not-certified';
  categories: CertificationCategoryResult[];
  allChecks: CertificationCheckResult[];
  metrics: CertificationMetrics;
  recommendations: string[];
  readyForProduction: boolean;
  readyForReuse: boolean;
}

/**
 * Detailed certification metrics
 */
export interface CertificationMetrics {
  certificationScore: number; // 0-100, all checks passed
  referenceReadiness: number; // 0-100, ready to be copied by others
  connectorSafetyScore: number; // 0-100, no bypasses, secrets secure
  testCoverageScore: number; // 0-100, tests cover all checks
  documentationScore: number; // 0-100, blueprint documentation complete
  futureConnectorReuseScore: number; // 0-100, components reusable
  productionReadinessScore: number; // 0-100, from Build 139 hardening
  hardeningScore: number; // 0-100, security & resilience
  complianceScore: number; // 0-100, audit & compliance
  healthScore: number; // 0-100, monitoring & observability
}

/**
 * Connector reusability blueprint
 */
export interface ConnectorBlueprintComponent {
  name: string;
  description: string;
  location: string; // File path in Gmail
  reusePattern: string; // How future connectors should copy it
  status: 'reusable-as-is' | 'reusable-with-adaptation' | 'reference-only';
  futureConnectors: string[]; // Which connectors should use this
}

/**
 * Reference architecture for future connectors
 */
export interface ReferenceArchitecture {
  blueprintVersion: string;
  baseConnector: 'gmail';
  components: ConnectorBlueprintComponent[];
  criticalReuse: string[]; // Must copy exactly
  recommendedReuse: string[]; // Should copy
  referenceOnly: string[]; // Learn from but implement uniquely
  bestPractices: string[];
}

/**
 * Certification summary for dashboard
 */
export interface CertificationSummary {
  gmailVersion: 'v1.0';
  certificationStatus: 'certified' | 'at-risk' | 'not-certified';
  certificationDate: Date;
  expiryDate?: Date; // Re-certification recommended after N months
  score: number;
  productionReady: boolean;
  reuseReady: boolean;
  lastUpdated: Date;
}
