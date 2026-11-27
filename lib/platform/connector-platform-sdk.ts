/**
 * Gamma Connector Platform SDK v1.0
 *
 * The base platform that all Phase XVI connectors instantiate.
 * Never modify this file after tagging gamma-connector-platform-v1.
 *
 * To build a new connector:
 *   1. Install platform: import { ConnectorPlatform } from this file
 *   2. Replace OAuth:    implement OAuthAdapter for your service
 *   3. Replace Client:   implement ApiClient for your service
 *   4. Replace Parser:   implement MessageParser for your service
 *   5. Replace Actions:  implement ActionSet for your service
 *   Done. No other code required.
 */

// ─── Layer 1: OAuth & Authentication ─────────────────────────────────────────

export interface OAuthAdapter {
  /** Authorization URL for your service */
  authorizationUrl: string;
  /** Token URL for your service */
  tokenUrl: string;
  /** Required scopes for this connector */
  requiredScopes: string[];
  /** High-risk scopes that need operator approval */
  highRiskScopes: string[];
  /** Exchange authorization code for tokens */
  exchangeCode(code: string): Promise<TokenSet>;
  /** Refresh access token */
  refreshToken(refreshToken: string): Promise<TokenSet>;
  /** Validate token health */
  validateToken(token: TokenSet): TokenValidationResult;
}

export interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scopes: string[];
}

export interface TokenValidationResult {
  valid: boolean;
  issue?: 'expired' | 'expiring_soon' | 'missing' | 'revoked' | 'invalid';
  minutesUntilExpiry?: number;
  maskedToken: string; // Format: oauth2_****xxxx — never expose raw
}

// ─── Layer 2: API Client ──────────────────────────────────────────────────────

export interface ApiClient {
  /** Human-readable service name */
  serviceName: string;
  /** Base URL for all API calls */
  baseUrl: string;
  /** Rate limit info for health monitoring */
  rateLimitTiers: RateLimitTier[];
  /** Quota definitions for health monitoring */
  quotaDefinitions: QuotaDefinition[];
  /** Execute a read operation (no side effects) */
  read(resource: string, params?: Record<string, string>): Promise<unknown>;
  /** Create a resource (draft/item/event) */
  create(resource: string, payload: unknown): Promise<unknown>;
  /** Update a resource */
  update(resource: string, id: string, payload: unknown): Promise<unknown>;
  /** Delete a resource */
  delete(resource: string, id: string): Promise<void>;
}

export interface RateLimitTier {
  name: string;
  thresholdPercent: number; // 0-100
  score: number;            // 0-100, lower = worse
  backoffSeconds: number;
}

export interface QuotaDefinition {
  name: string;
  limit: number;
  windowSeconds: number;
}

// ─── Layer 3: Message/Resource Parser ────────────────────────────────────────

export interface ResourceParser<TRaw, TParsed> {
  /** Parse raw API response into standard format */
  parse(raw: TRaw): TParsed;
  /** Validate parsed resource */
  validate(parsed: TParsed): ValidationResult;
  /** Sanitize content (redact secrets, PII) */
  sanitize(parsed: TParsed): TParsed;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ─── Layer 4: Actions ─────────────────────────────────────────────────────────

export interface ActionSet {
  /** List of all actions this connector supports */
  supportedActions: ActionDefinition[];
  /** Preview an action without executing (zero side effects) */
  preview(action: ActionRequest): Promise<ActionPreview>;
  /** Execute an approved action */
  execute(action: ApprovedAction): Promise<ActionReceipt>;
}

export interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  requiresFeatureFlag: boolean;
  featureFlagKey?: string;
}

export interface ActionRequest {
  actionId: string;
  params: Record<string, unknown>;
  requestedBy: string;
  requestedAt: Date;
}

export interface ActionPreview {
  actionId: string;
  description: string;
  affectedResources: string[];
  estimatedImpact: string;
  riskWarnings: string[];
  requiresApproval: boolean;
}

export interface ApprovedAction extends ActionRequest {
  approvedBy: string;
  approvedAt: Date;
  approvalReason: string;
  queueId: string;
}

export interface ActionReceipt {
  actionId: string;
  queueId: string;
  status: 'completed' | 'failed' | 'queued';
  result?: unknown;
  error?: string;
  executedAt: Date;
  auditId: string;
}

// ─── Platform Core (Never Replace) ───────────────────────────────────────────

export interface ConnectorPlatformConfig {
  connectorId: string;
  connectorName: string;
  version: string;
  oauth: OAuthAdapter;
  client: ApiClient;
  parser: ResourceParser<unknown, unknown>;
  actions: ActionSet;
  /** Feature flag key for enabling real execution (default: ENABLE_REAL_EXECUTION) */
  executionFlagKey?: string;
}

export interface ConnectorPlatformHealth {
  connectorId: string;
  overallScore: number;       // 0-100
  productionReady: boolean;
  oauth: { score: number; issue?: string };
  quota: { score: number; utilizationPercent: number };
  rateLimit: { score: number; tier: string };
  scopes: { score: number; missingScopes: string[] };
  operatorWarnings: PlatformWarning[];
}

export interface PlatformWarning {
  severity: 'critical' | 'high' | 'medium' | 'low';
  component: string;
  message: string;
  recommendedAction: string;
}

export interface ConnectorPlatformMetrics {
  connectorId: string;
  certificationScore: number;
  safetyScore: number;
  testCoverageScore: number;
  productionReadinessScore: number;
  referenceReadiness: number;
}

// ─── Platform Bill of Materials ───────────────────────────────────────────────

/**
 * GAMMA Connector Platform v1.0 — Bill of Materials
 *
 * These are the shared components included in every connector.
 * They are never modified per-connector. They are instantiated with adapters.
 *
 * Component                    Location                                    Reuse
 * ─────────────────────────────────────────────────────────────────────────────
 * Approval Gate              lib/connectors/gmail/approval-engine.ts      100%
 * Queue Engine               lib/connectors/gmail/queue-engine.ts          100%
 * Compliance Audit           lib/connectors/gmail/compliance-audit.ts      100%
 * Sanitizer                  lib/connectors/gmail/sanitizer.ts             100%
 * Feature Flags              lib/connectors/gmail/executor.ts              100%
 * Retry Policy               lib/connectors/gmail/retry-orchestrator.ts    100%
 * Dead-Letter Queue          lib/connectors/gmail/dead-letter-queue.ts     100%
 * Idempotency Guard          lib/connectors/gmail/idempotency.ts           100%
 * Receipt Verifier           lib/connectors/gmail/receipt-verifier.ts      100%
 * Health Monitor (pattern)   lib/connectors/gmail/health-checker.ts        ~80%
 * Certification Runner       lib/connectors/gmail/certification-runner.ts  ~80%
 * GAMMA Reader Pattern       lib/gamma/gmail-hardening-reader.ts           ~70%
 *
 * Connector-specific adapters (implement per connector):
 *   OAuthAdapter     — API credentials, endpoints, scopes
 *   ApiClient        — HTTP client for the external service
 *   ResourceParser   — Translate API responses to standard format
 *   ActionSet        — What actions this connector can perform
 */

export const PLATFORM_VERSION = '1.0.0';
export const PLATFORM_TAG = 'gamma-connector-platform-v1';
export const PLATFORM_BASE_CONNECTOR = 'gmail';
export const PLATFORM_BUILDS = ['135', '136', '137', '138', '139', '140'] as const;

export const PLATFORM_BILL_OF_MATERIALS = {
  shared: [
    'approval-engine',
    'queue-engine',
    'compliance-audit',
    'sanitizer',
    'feature-flags',
    'retry-orchestrator',
    'dead-letter-queue',
    'idempotency',
    'receipt-verifier',
  ],
  patterns: [
    'health-checker',
    'certification-runner',
    'gamma-reader',
  ],
  adapters: [
    'OAuthAdapter',
    'ApiClient',
    'ResourceParser',
    'ActionSet',
  ],
} as const;
